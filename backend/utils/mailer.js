const nodemailer = require('nodemailer');

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !port || !user || !pass || !from) {
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    from
  };
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const smtpConfig = getSmtpConfig();

  if (!smtpConfig) {
    return { sent: false };
  }

  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: smtpConfig.auth
  });

  await transporter.sendMail({
    from: smtpConfig.from,
    to,
    subject: 'Reset your Dias Fragrances account password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2933;">
        <h2 style="color: #21635a;">Password Reset Request</h2>
        <p>Hello ${name || 'there'},</p>
        <p>We received a request to reset your password. Use the button below to choose a new one.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #21635a; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 700;">
            Reset Password
          </a>
        </p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <p>This link expires in 30 minutes.</p>
      </div>
    `
  });

  return { sent: true };
}

module.exports = {
  getSmtpConfig,
  sendPasswordResetEmail
};
