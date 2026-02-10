const nodemailer = require('nodemailer');

/**
 * Email Service using Hostinger SMTP
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true, // SSL
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Generate a 6-digit OTP code
   */
  generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP verification email
   */
  async sendOtp(email, code) {
    const mailOptions = {
      from: process.env.SMTP_FROM || `ValueWats <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your ValueWats Verification Code',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); width: 56px; height: 56px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 24px; font-weight: bold;">V</span>
            </div>
          </div>
          <h2 style="text-align: center; color: #111827; margin-bottom: 8px; font-size: 22px;">Verify Your Email</h2>
          <p style="text-align: center; color: #6b7280; margin-bottom: 32px; font-size: 14px;">
            Enter this code to complete your registration
          </p>
          <div style="background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #111827; font-family: 'Courier New', monospace;">${code}</span>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px;">
            This code expires in <strong>10 minutes</strong>.<br/>
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`OTP sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send team invitation email
   */
  async sendInvitation(email, tenantName, inviterEmail, role) {
    const mailOptions = {
      from: process.env.SMTP_FROM || `ValueWats <${process.env.SMTP_USER}>`,
      to: email,
      subject: `You're invited to join ${tenantName} on ValueWats`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); width: 56px; height: 56px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 24px; font-weight: bold;">V</span>
            </div>
          </div>
          <h2 style="text-align: center; color: #111827; margin-bottom: 8px; font-size: 22px;">You're Invited!</h2>
          <p style="text-align: center; color: #6b7280; margin-bottom: 24px; font-size: 14px;">
            <strong>${inviterEmail}</strong> has invited you to join <strong>${tenantName}</strong> as <strong>${role}</strong>.
          </p>
          <div style="text-align: center; margin-bottom: 24px;">
            <p style="color: #6b7280; font-size: 14px;">
              Register at ValueWats using this email address (<strong>${email}</strong>) to accept the invitation.
            </p>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px;">
            This invitation expires in 7 days.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Invitation sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Invitation email error:', error);
      throw new Error('Failed to send invitation email');
    }
  }
}

module.exports = new EmailService();
