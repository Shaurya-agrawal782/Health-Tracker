const nodemailer = require('nodemailer');

// Reuse transporter across calls (without pooling for cloud compatibility)
let cachedTransporter = null;

const getTransporter = () => {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      // Use explicit SMTP config instead of 'service: gmail' for
      // better compatibility with cloud platforms like Render.
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,               // SSL on port 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // No connection pooling — avoids stale connection issues on
      // Render/Heroku where instances sleep and connections drop.
      connectionTimeout: 10000,   // 10s to establish connection
      greetingTimeout: 10000,     // 10s for SMTP greeting
      socketTimeout: 15000,       // 15s for socket operations
      logger: process.env.NODE_ENV !== 'production',   // verbose logs in dev
      debug: process.env.NODE_ENV !== 'production',
    });
  }
  return cachedTransporter;
};

/**
 * Verify SMTP connection is working. Called on server startup.
 */
const verifySmtpConnection = async () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[EMAIL] Email credentials not configured. OTP emails will not be sent.');
    return false;
  }
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('[EMAIL] SMTP connection verified successfully.');
    return true;
  } catch (error) {
    console.error('[EMAIL] SMTP verification failed:', error.code, error.message);
    // Reset cached transporter so it can be recreated
    cachedTransporter = null;
    return false;
  }
};

/**
 * Send OTP email with retry logic for transient failures.
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {number} retries - Number of retry attempts (default 2)
 * @returns {boolean} true if sent successfully
 */
const sendOtpEmail = async (email, otp, retries = 2) => {
  const mailOptions = {
    from: `"VitalIQ Health" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your VitalIQ Health Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; borderRadius: 10px;">
        <h2 style="color: #0d9488; text-align: center;">VitalIQ Health</h2>
        <p style="font-size: 16px; color: #334155;">Hello,</p>
        <p style="font-size: 16px; color: #334155;">To complete your login, please use the following 6-digit verification code:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 5px; color: #0d9488; padding: 10px 20px; background: #f0fdfa; border-radius: 8px;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 14px; color: #64748b; text-align: center;">This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">© 2026 VitalIQ Health. AI-Assisted Wellness Platform.</p>
      </div>
    `,
  };

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[EMAIL] Retry attempt ${attempt}/${retries} for ${email}`);
        // Wait briefly before retry (exponential backoff: 1s, 2s)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        // Reset transporter on retry — fresh connection each time
        cachedTransporter = null;
      }

      const transporter = getTransporter();
      const info = await transporter.sendMail(mailOptions);
      console.log(`[EMAIL] OTP sent successfully to ${email} (messageId: ${info.messageId})`);
      return true;
    } catch (error) {
      lastError = error;
      console.error(`[EMAIL] Send attempt ${attempt + 1} failed:`, error.code, error.message);

      // Don't retry on authentication errors — they won't resolve
      if (error.responseCode === 535 || error.code === 'EAUTH') {
        console.error('[EMAIL] Authentication error — check EMAIL_USER and EMAIL_PASS env vars on Render.');
        break;
      }
      // Reset transporter on any failure
      cachedTransporter = null;
    }
  }

  console.error('[EMAIL] All send attempts failed. Last error:', lastError?.code, lastError?.message);
  return false;
};

module.exports = { sendOtpEmail, verifySmtpConnection };
