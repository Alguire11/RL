// Resend Email Configuration Test Script
// Run this to verify your email service is properly configured

import { emailService } from './emailService';

async function testEmailConfiguration() {
    console.log('🔍 Testing Resend Email Configuration...\n');

    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY is not set in environment variables');
        console.log('\n📝 Add this to your .env file:');
        console.log('RESEND_API_KEY=re_9L5dwXLp_3Cz9qY5Fg6Sv9uyXjQBQmyQY');
        process.exit(1);
    }

    console.log('✅ RESEND_API_KEY is configured');
    console.log(`📧 From Email: ${process.env.RESEND_FROM_EMAIL || 'info@myrentledger.co.uk'}\n`);

    // Test 1: Email Verification Email
    console.log('Test 1: Sending Email Verification...');
    const testEmail = 'your-test-email@example.com'; // Replace with your email
    const verificationResult = await emailService.sendEmailVerification(
        testEmail,
        'Test User',
        'https://myrentledger.co.uk/verify/test-token'
    );

    if (verificationResult.success) {
        console.log('✅ Email verification sent successfully\n');
    } else {
        console.error('❌ Failed to send email verification:', verificationResult.error, '\n');
    }

    // Test 2: Welcome Email
    console.log('Test 2: Sending Welcome Email...');
    const welcomeResult = await emailService.sendWelcomeEmail(
        testEmail,
        'Test User',
        'tenant'
    );

    if (welcomeResult.success) {
        console.log('✅ Welcome email sent successfully\n');
    } else {
        console.error('❌ Failed to send welcome email:', welcomeResult.error, '\n');
    }

    // Test 3: Test Email
    console.log('Test 3: Sending Test Email...');
    const testResult = await emailService.sendTestEmail(testEmail);

    if (testResult.success) {
        console.log('✅ Test email sent successfully\n');
    } else {
        console.error('❌ Failed to send test email:', testResult.error, '\n');
    }

    console.log('✨ Email configuration test complete!');
    console.log('\n📬 Check your inbox at:', testEmail);
}

// Run the test
testEmailConfiguration().catch(console.error);
