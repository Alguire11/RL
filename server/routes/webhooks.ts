import type { Express } from "express";
import { storage } from "../storage";
import { nanoid } from "nanoid";

/**
 * Register MailerSend webhook routes
 * These endpoints receive delivery status updates from MailerSend
 */
export function registerWebhookRoutes(app: Express) {
    // MailerSend webhook endpoint
    // This receives events like: sent, delivered, bounced, opened, clicked
    app.post('/api/webhooks/mailersend', async (req, res) => {
        try {
            const event = req.body;

            console.log('[MailerSend Webhook] Received event:', {
                type: event.type,
                email: event.data?.email?.recipient?.email,
                messageId: event.data?.email?.message?.id
            });

            // Validate webhook signature if secret is configured
            const webhookSecret = process.env.MAILERSEND_WEBHOOK_SECRET;
            if (webhookSecret) {
                const signature = req.headers['x-mailersend-signature'] as string;
                // TODO: Implement signature verification
                // For now, we'll log if signature is missing
                if (!signature) {
                    console.warn('[MailerSend Webhook] No signature provided');
                }
            }

            // Extract event data
            const eventType = event.type;
            const emailData = event.data?.email;

            if (!emailData) {
                console.warn('[MailerSend Webhook] No email data in event');
                return res.status(400).json({ error: 'No email data provided' });
            }

            const recipientEmail = emailData.recipient?.email;
            const messageId = emailData.message?.id;

            // Store event in database
            if (recipientEmail) {
                await storage.createEmailEvent({
                    id: nanoid(),
                    email: recipientEmail,
                    eventType,
                    messageId: messageId || null,
                    metadata: event.data,
                    timestamp: new Date(event.created_at || Date.now())
                });
            }

            // Handle specific event types
            switch (eventType) {
                case 'activity.sent':
                    console.log(`[Email] Sent to ${recipientEmail}`);
                    break;
                case 'activity.delivered':
                    console.log(`[Email] Delivered to ${recipientEmail}`);
                    break;
                case 'activity.soft_bounced':
                    console.warn(`[Email] Soft bounce for ${recipientEmail}`);
                    break;
                case 'activity.hard_bounced':
                    console.error(`[Email] Hard bounce for ${recipientEmail} - email may be invalid`);
                    break;
                case 'activity.opened':
                    console.log(`[Email] Opened by ${recipientEmail}`);
                    break;
                case 'activity.clicked':
                    console.log(`[Email] Link clicked by ${recipientEmail}`);
                    break;
                default:
                    console.log(`[Email] Unknown event type: ${eventType}`);
            }

            res.status(200).json({ received: true });
        } catch (error) {
            console.error('[MailerSend Webhook] Error processing webhook:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
}
