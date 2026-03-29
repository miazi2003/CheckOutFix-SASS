const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or use host/port depending on your SMTP provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendAlertEmail = async (store, result) => {
  if (result.status !== 'broken') {
    return; // Only alert on broken
  }

  const mailOptions = {
    from: `"CheckoutFix Alerts" <${process.env.EMAIL_USER}>`,
    to: store.alertEmail,
    subject: "🚨 Checkout Issue Detected",
    html: `
      <h2>CheckoutFix AI Alert</h2>
      <p>We detected an issue with your store checkout flow.</p>
      <hr />
      <ul>
        <li><strong>Store URL:</strong> <a href="${store.url}">${store.url}</a></li>
        <li><strong>Status:</strong> ${result.status.toUpperCase()}</li>
        <li><strong>Timestamp:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      <h3>Issue Summary:</h3>
      <ul>
        ${result.issues.map(issue => `<li>${issue}</li>`).join('')}
      </ul>
      <p>Please check your dashboard for more details.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Alert email sent to ${store.alertEmail} for ${store.url}`);
  } catch (err) {
    console.error(`Failed to send email alert to ${store.alertEmail}:`, err.message);
  }
};
