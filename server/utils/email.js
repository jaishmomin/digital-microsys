const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * Create reusable transporter.
 */
const createTransporter = () => {
  console.log('Email env check:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    passExists: !!process.env.SMTP_PASS
  });

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 
      'smtp.gmail.com',
    port: 465,
    secure: true,  // ← true for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
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
      from: `"Digital Microsys" <${process.env.SMTP_USER}>`,
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

/**
 * Send OTP Email.
 */
const sendOTPEmail = async (email, otp, name) => {
  console.log('Attempting to send OTP email to:', email);

  const transporter = createTransporter();

  // Verify connection first
  try {
    await transporter.verify();
    console.log('Email transporter verified OK');
  } catch (verifyError) {
    console.error('Transporter verify failed:', verifyError.message);
    throw verifyError;
  }

  const mailOptions = {
    from: `"Digital Microsys" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your OTP for Digital Microsys - ' + otp,
    text: `Your OTP is: ${otp}. Valid for 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;
        max-width:480px;margin:0 auto;
        padding:20px;">
        <div style="background:#2563eb;
          padding:24px;border-radius:12px 12px 0 0;
          text-align:center;">
          <h1 style="color:#fff;margin:0;
            font-size:22px;">
            Digital Microsys
          </h1>
        </div>
        <div style="background:#fff;
          padding:32px;
          border:1px solid #e5e7eb;
          border-top:none;
          border-radius:0 0 12px 12px;">
          <h2 style="color:#111827;
            font-size:18px;margin:0 0 16px;">
            Hello ${name || 'Student'}!
          </h2>
          <p style="color:#6b7280;margin:0 0 24px;">
            Your OTP for Digital Microsys 
            registration is:
          </p>
          <div style="background:#eff6ff;
            border:2px dashed #2563eb;
            border-radius:10px;
            padding:20px;
            text-align:center;
            margin-bottom:24px;">
            <h1 style="color:#2563eb;
              font-size:42px;
              font-weight:800;
              letter-spacing:10px;
              margin:0;">
              ${otp}
            </h1>
            <p style="color:#9ca3af;
              font-size:12px;margin:8px 0 0;">
              Valid for 10 minutes only
            </p>
          </div>
          <p style="color:#ef4444;
            font-size:13px;margin:0;">
            Do not share this OTP with anyone.
          </p>
        </div>
      </div>
    `
  };

  const info = await transporter.sendMail(mailOptions);
  
  console.log('Email sent:', info.messageId);
  return info;
};

module.exports = { sendEmail, sendTestInvitation, sendResultNotification, sendOTPEmail };
