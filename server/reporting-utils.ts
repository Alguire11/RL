import crypto from "crypto";
export function hashReference(id: string): string {
    return crypto.createHmac('sha256', process.env.REPORTING_HASH_SECRET || 'dev_secret').update(id).digest('hex');
}
