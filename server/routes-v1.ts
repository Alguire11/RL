
import { Router } from "express";
import { storage } from "./storage";
import { hashReference } from "./reporting-utils";

const router = Router();

// Middleware: Require API Key
const requireApiKey = async (req: any, res: any, next: any) => {
    const key = req.header('X-API-Key');
    if (!key) {
        return res.status(401).json({ code: 'unauthorized', message: 'Missing API Key' });
    }

    const apiKey = await storage.getApiKey(key as string);
    if (!apiKey) {
        return res.status(401).json({ code: 'unauthorized', message: 'Invalid API Key' });
    }

    // Check expiry
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
        return res.status(401).json({ code: 'unauthorized', message: 'API Key Expired' });
    }

    // Log usage (async)
    storage.logApiKeyUsage(apiKey.id).catch(console.error);

    req.apiKey = apiKey;
    next();
};

router.use(requireApiKey);

// -----------------------------------------------------------------------------
// Reporting Batches
// -----------------------------------------------------------------------------

router.get('/reporting/batches', async (req, res) => {
    try {
        const batches = await storage.getReportingBatches();
        // Filter sensitive fields if needed? For V1 admin == partner conceptually for now
        res.json({ items: batches });
    } catch (error) {
        res.status(500).json({ code: 'internal_error', message: String(error) });
    }
});

router.post('/reporting/batches', async (req, res) => {
    try {
        const { month, include_unverified, only_consented, format } = req.body;

        if (!month || !month.match(/^\d{4}-\d{2}$/)) {
            return res.status(400).json({ code: 'invalid_param', message: 'Invalid month format (YYYY-MM)' });
        }

        const { generateBatch } = await import('./reporting');

        // Use a system admin ID or the API key owner ID if linked for 'created_by'
        // For now, we'll store 'api_key_user' as placeholder if valid ID not avail
        const creatorId = req.apiKey?.createdBy || 'system';

        const result = await generateBatch(month, creatorId, {
            includeUnverified: !!include_unverified,
            onlyConsented: only_consented !== false,
            format: format || 'csv'
        });

        res.status(201).json(result);
    } catch (error) {
        console.error("Batch Gen Error:", error);
        res.status(500).json({ code: 'internal_error', message: 'Failed to generate batch' });
    }
});

router.get('/reporting/batches/:id', async (req, res) => {
    try {
        const batch = await storage.getReportingBatch(req.params.id);
        if (!batch) return res.status(404).json({ code: 'not_found', message: 'Batch not found' });
        res.json(batch);
    } catch (error) {
        res.status(500).json({ code: 'internal_error', message: 'Failed to fetch batch' });
    }
});

router.get('/reporting/batches/:id/download', async (req, res) => {
    try {
        const batch = await storage.getReportingBatch(req.params.id);
        if (!batch) return res.status(404).json({ code: 'not_found', message: 'Batch not found' });
        if (batch.status !== 'ready') return res.status(400).json({ code: 'not_ready', message: 'Batch is not ready' });

        const records = await storage.getReportingRecords(batch.id);

        let content = '';
        if (batch.format === 'csv') {
            const { generateCSV } = await import('./reporting');
            content = generateCSV(records);
            res.header('Content-Type', 'text/csv');
            res.attachment(`rent-ledger-export-${batch.month}-${batch.id.slice(0, 8)}.csv`);
        } else {
            content = JSON.stringify(records, null, 2);
            res.header('Content-Type', 'application/json');
            res.attachment(`rent-ledger-export-${batch.month}-${batch.id.slice(0, 8)}.json`);
        }
        res.send(content);
    } catch (error) {
        res.status(500).json({ code: 'internal_error', message: 'Failed to download batch' });
    }
});

// -----------------------------------------------------------------------------
// Reporting Records
// -----------------------------------------------------------------------------

router.get('/reporting/records', async (req, res) => {
    try {
        const { month, verification_status, limit, cursor } = req.query;

        if (!month || typeof month !== 'string') {
            return res.status(400).json({ code: 'missing_param', message: 'month is required' });
        }

        const result = await storage.getReportingRecordsByQuery({
            month,
            verificationStatus: verification_status as string,
            limit: limit ? parseInt(limit as string) : 50,
            offset: cursor ? parseInt(cursor as string) : 0
        });

        res.json({
            items: result.items,
            next_cursor: (result.items.length > 0 && result.items.length === (limit ? parseInt(limit as string) : 50))
                ? String((cursor ? parseInt(cursor as string) : 0) + result.items.length)
                : null
        });
    } catch (error) {
        res.status(500).json({ code: 'internal_error', message: 'Failed to fetch records' });
    }
});

// -----------------------------------------------------------------------------
// Consents
// -----------------------------------------------------------------------------

router.get('/consents/:tenant_ref', async (req, res) => {
    try {
        const consent = await storage.getConsentByRef(req.params.tenant_ref);
        if (!consent) {
            // Per spec, return status: not_consented object
            return res.json({
                tenant_ref: req.params.tenant_ref,
                consent_status: 'not_consented',
                scope: 'reporting_to_partners'
            });
        }
        res.json({
            tenant_ref: consent.tenantRef,
            consent_status: consent.status,
            scope: consent.scope,
            captured_at: consent.capturedAt,
            withdrawn_at: consent.withdrawnAt
        });
    } catch (error) {
        res.status(500).json({ code: 'internal_error', message: 'Failed to fetch consent' });
    }
});

router.put('/consents/:tenant_ref', async (req, res) => {
    try {
        const { consent_status } = req.body;
        const tenantRef = req.params.tenant_ref;

        if (!['consented', 'withdrawn'].includes(consent_status)) {
            return res.status(400).json({ code: 'invalid_param', message: 'Invalid consent_status' });
        }

        // 1. Lookup existing record by ref
        const existing = await storage.getConsentByRef(tenantRef);

        if (!existing) {
            // We cannot create a NEW consent record because we don't know the real tenantId from the hash.
            // Return 404 or specific error. Spec doesn't clarify, but 404 is logical.
            return res.status(404).json({ code: 'not_found', message: 'Tenant reference not found. Cannot create consent via API.' });
        }

        // 2. Update using the found real ID
        const updated = await storage.updateConsent(existing.tenantId, 'reporting_to_partners', consent_status, tenantRef);

        res.json({
            tenant_ref: updated.tenantRef,
            consent_status: updated.status,
            scope: updated.scope,
            captured_at: updated.capturedAt,
            withdrawn_at: updated.withdrawnAt
        });
    } catch (error) {
        console.error("Consent Update Error:", error);
        res.status(500).json({ code: 'internal_error', message: 'Failed to update consent' });
    }
});


export default router;
