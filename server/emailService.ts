import { MailService } from '@sendgrid/mail';

const mailService = new MailService();
const apiKey = process.env.SENDGRID_API_KEY;

if (apiKey) {
  mailService.setApiKey(apiKey);
} else {
  console.warn('SENDGRID_API_KEY not set - email functionality will be disabled');
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!apiKey) {
    console.warn(`Email sending skipped (no API key configured) - would have sent to ${params.to}`);
    return false;
  }
  
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || '',
      html: params.html || params.text || '',
    });
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function createLandlordVerificationEmail(
  landlordEmail: string,
  tenantName: string,
  propertyAddress: string,
  verificationUrl: string
): EmailParams {
  const subject = `Tenant Verification Request - ${tenantName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { 
          display: inline-block; 
          background: #2563eb; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0;
        }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Enoíkio - Landlord Verification Request</h1>
        </div>
        <div class="content">
          <h2>Hello,</h2>
          <p>Your tenant <strong>${tenantName}</strong> has requested verification of their rental history for the property:</p>
          <p><strong>${propertyAddress}</strong></p>
          
          <p>This verification helps build their credit history and rental profile. By confirming their tenancy details, you're helping them access better rental opportunities in the future.</p>
          
          <p>Please click the button below to review and verify their rental information:</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Tenant Details</a>
          </div>
          
          <p>This link will expire in 7 days. If you have any questions, please contact us.</p>
          
          <p>Thank you for your time.</p>
          <p><strong>The Enoíkio Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated message from Enoíkio. Please do not reply to this email.</p>
          <p>If you believe you received this email in error, please ignore it.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Enoíkio - Landlord Verification Request
    
    Hello,
    
    Your tenant ${tenantName} has requested verification of their rental history for the property: ${propertyAddress}
    
    This verification helps build their credit history and rental profile. By confirming their tenancy details, you're helping them access better rental opportunities in the future.
    
    Please visit the following link to review and verify their rental information:
    ${verificationUrl}
    
    This link will expire in 7 days. If you have any questions, please contact us.
    
    Thank you for your time.
    The Enoíkio Team
    
    ---
    This is an automated message from Enoíkio. Please do not reply to this email.
    If you believe you received this email in error, please ignore it.
  `;

  return {
    to: landlordEmail,
    from: 'noreply@enoikio.com',
    subject,
    html,
    text
  };
}