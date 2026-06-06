const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * Create reusable transporter.
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
};

/**
 * Send an email.
 * @param {Object} options - { to, subject, html, text }
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `"Digital Microsys" <${config.smtp.user}>`,
      to,
      subject,
      html,
      text,
    });

    console.log(`📧  Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌  Email send failed: ${error.message}`);
    throw error;
  }
};

/**
 * Send test invitation email.
 */
const sendTestInvitation = async (studentEmail, studentName, testTitle, accessCode) => {
  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #6366f1;">📝 Digital Microsys — Test Invitation</h2>
      <p>Hello <strong>${studentName}</strong>,</p>
      <p>You have been invited to take the following test:</p>
      <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3 style="margin: 0 0 8px;">${testTitle}</h3>
        ${accessCode ? `<p style="margin: 0;">Access Code: <code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${accessCode}</code></p>` : ''}
      </div>
      <p>Log in to your Digital Microsys account to begin.</p>
      <p style="color: #94a3b8; font-size: 12px;">— Digital Microsys Team</p>
    </div>
  `;

  return sendEmail({
    to: studentEmail,
    subject: `Test Invitation: ${testTitle} — Digital Microsys`,
    html,
  });
};

/**
 * Send result notification email.
 */
const sendResultNotification = async (studentEmail, studentName, testTitle, score, total) => {
  const percentage = Math.round((score / total) * 100);
  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #6366f1;">📊 Test Results — Digital Microsys</h2>
      <p>Hello <strong>${studentName}</strong>,</p>
      <p>Your results for <strong>${testTitle}</strong> are now available:</p>
      <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
        <h1 style="margin: 0; color: ${percentage >= 60 ? '#22c55e' : '#ef4444'};">${percentage}%</h1>
        <p style="margin: 4px 0 0; color: #64748b;">${score} / ${total} marks</p>
      </div>
      <p>Log in to view your detailed results.</p>
      <p style="color: #94a3b8; font-size: 12px;">— Digital Microsys Team</p>
    </div>
  `;

  return sendEmail({
    to: studentEmail,
    subject: `Results: ${testTitle} — Digital Microsys`,
    html,
  });
};

module.exports = { sendEmail, sendTestInvitation, sendResultNotification };
