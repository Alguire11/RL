import cron from 'node-cron';
import { storage } from '../storage';
import { sendEmail } from '../emailService';

// Run every day at 9:00 AM
export function startScheduler() {
    console.log('Starting scheduler service...');

    // Check for rent payments due in 3 days
    cron.schedule('0 9 * * *', async () => {
        console.log('Running daily rent reminder check...');
        try {
            const users = await storage.getUsersWithPreferences();
            const today = new Date();
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(today.getDate() + 3);

            for (const user of users) {
                const userWithPrefs = user as any;
                if (!userWithPrefs.rentInfo || !userWithPrefs.preferences?.paymentReminders) continue;

                const rentInfo = userWithPrefs.rentInfo;
                const nextPaymentDate = new Date(rentInfo.nextPaymentDate);

                // Simple check: if next payment is in 3 days
                if (
                    nextPaymentDate.getDate() === threeDaysFromNow.getDate() &&
                    nextPaymentDate.getMonth() === threeDaysFromNow.getMonth() &&
                    nextPaymentDate.getFullYear() === threeDaysFromNow.getFullYear()
                ) {
                    // Create notification
                    await storage.createNotification({
                        userId: user.id,
                        type: 'payment_reminder',
                        title: 'Rent Payment Due Soon',
                        message: `Your rent payment of £${rentInfo.amount} is due on ${nextPaymentDate.toLocaleDateString()}`,
                        isRead: false,
                        scheduledFor: new Date(),
                    });

                    // Send email if enabled
                    if (userWithPrefs.preferences.emailNotifications) {
                        await sendEmail({
                            to: user.email,
                            from: 'noreply@rentledger.co.uk',
                            subject: 'Rent Payment Reminder',
                            html: `
                <h2>Rent Payment Reminder</h2>
                <p>Hi ${user.firstName},</p>
                <p>This is a friendly reminder that your rent payment of <strong>£${rentInfo.amount}</strong> is due on <strong>${nextPaymentDate.toLocaleDateString()}</strong>.</p>
                <p>Log in to RentLedger to record your payment and keep your streak alive!</p>
                <a href="https://rentledger.co.uk/dashboard">Go to Dashboard</a>
              `,
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error in rent reminder job:', error);
        }
    });

    // Check for overdue payments (5 days past due)
    cron.schedule('0 10 * * *', async () => {
        console.log('Running overdue payment check...');
        try {
            // logic to find pending payments past due date would go here
            // For now, we'll just log as a placeholder since we need to query payments by status and date
            // This requires a new storage method: getPendingPaymentsBefore(date)
        } catch (error) {
            console.error('Error in overdue payment check:', error);
        }
    });
}
