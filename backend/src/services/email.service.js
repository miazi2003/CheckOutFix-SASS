const nodemailer = require('nodemailer');

const createTransporter = () => {
  const isGmail = process.env.EMAIL_USER && process.env.EMAIL_USER.includes('gmail.com');
  
  const config = isGmail ? {
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  } : {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: process.env.EMAIL_SECURE === 'true' || true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };

  return nodemailer.createTransport(config);
};

exports.sendAlertEmail = async (store, result) => {
  console.log(`[EMAIL] Processing alert for ${store.url}...`);

  if (result.status !== 'issue') return;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('[EMAIL] CRITICAL: EMAIL_USER or EMAIL_PASS not found in .env');
    return;
  }

  const transporter = createTransporter();

  // Verify connection before sending
  try {
    await transporter.verify();
    console.log('[EMAIL] SMTP Connection verified successfully.');
  } catch (verifyErr) {
    console.error('[EMAIL] SMTP Connection failed verification:', verifyErr.message);
    if (verifyErr.code === 'EAUTH') {
      console.error('[EMAIL] AUTH ERROR: Your email or app password in .env is incorrect.');
    }
    return; // Don't try to send if connection is bad
  }

  const mailOptions = {
    from: `"CheckoutFix Alerts" <${process.env.EMAIL_USER}>`,
    to: store.alertEmail,
    bcc: process.env.EMAIL_USER,
    subject: `🚨 CRITICAL: Checkout Issue at ${store.url}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e53e3e; padding: 25px; border-radius: 12px; background-color: #fffaf0;">
        <h1 style="color: #c53030; margin-top: 0;">CheckoutFix Alert</h1>
        <p style="font-size: 16px; color: #2d3748;">Our bot failed to complete a purchase flow on your store.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 5px solid #c53030; margin: 20px 0;">
          <p><strong>Store:</strong> <a href="${store.url}">${store.url}</a></p>
          <p><strong>Detected Issues:</strong></p>
          <ul style="color: #4a5568;">
            ${result.issues.map(issue => `<li>${issue}</li>`).join('')}
          </ul>
        </div>

        <p style="font-size: 14px; color: #718096; text-align: center;">
          Checked on: ${new Date().toLocaleString()}
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Alert successfully delivered! ID: ${info.messageId}`);
  } catch (err) {
    console.error(`[EMAIL] Delivery failed for ${store.url}:`, err.message);
  }
};


