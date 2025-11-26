import { storage } from '../storage';

/**
 * Clean up expired email verification tokens
 * This function should be run periodically (e.g., daily) to remove expired tokens
 */
export async function cleanupExpiredTokens(): Promise<void> {
    try {
        console.log('[Token Cleanup] Starting cleanup of expired email verification tokens...');

        const deletedCount = await storage.deleteExpiredEmailVerificationTokens();

        console.log(`[Token Cleanup] Successfully deleted ${deletedCount} expired token(s)`);
    } catch (error) {
        console.error('[Token Cleanup] Error cleaning up expired tokens:', error);
        // Don't throw - we don't want to crash the scheduler
    }
}
