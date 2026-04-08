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
    const loaderBase64 = "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIj4KICAgIDxkZWZzPgogICAgICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ibG9hZGVyLWdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICAgICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjYTg1NWY3Ij48L3N0b3A+IDwhLS0gUHVycGxlIDUwMCAtLT4KICAgICAgICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNmQyOGQ5Ij48L3N0b3A+IDwhLS0gVmlvbGV0IDcwMCAtLT4KICAgICAgICA8L2xpbmVhckdyYWRpZW50PgoKICAgICAgICA8bWFzayBpZD0iZ2FwLW1hc2stbG9hZGVyIj4KICAgICAgICAgICAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0id2hpdGUiPjwvcmVjdD4KICAgICAgICAgICAgPHBhdGggZD0iTSAyNjEgMjI2IEwgMzYxIDIyNiBRIDM5MSAyMjYgMzkxIDI1NiBMIDM5MSAzMTYgUSAzOTEgMzQ2IDM2MSAzNDYgTCAyOTEgMzQ2IEwgMjQxIDM4NiBMIDI2MSAzNDYgUSAyMzEgMzQ2IDIzMSAzMTYgTCAyMzEgMjU2IFEgMjMxIDIyNiAyNjEgMjI2IFoiIGZpbGw9ImJsYWNrIiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjUyIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2UtbGluZWNhcD0icm91bmQiPjwvcGF0aD4KICAgICAgICA8L21hc2s+CgogICAgICAgIDwhLS0gRW1iZWRkZWQgQ1NTIGZvciBzdGFuZGFyZCBSZWFjdC9XZWIgY29tcGF0aWJpbGl0eSB3aXRob3V0IGV4dGVybmFsIHN0eWxlc2hlZXRzIC0tPgogICAgICAgIDxzdHlsZT4KICAgICAgICAgICAgLnBhdGgtYW5pbSB7CiAgICAgICAgICAgICAgICBzdHJva2UtZGFzaGFycmF5OiAxMDA7CiAgICAgICAgICAgICAgICBzdHJva2UtZGFzaG9mZnNldDogMTAwOwogICAgICAgICAgICAgICAgYW5pbWF0aW9uOiBkcmF3LXBhdGggM3MgY3ViaWMtYmV6aWVyKDAuNCwgMCwgMC4yLCAxKSBpbmZpbml0ZTsKICAgICAgICAgICAgfQogICAgICAgICAgICAucGF0aC1iYWNrIHsKICAgICAgICAgICAgICAgIGFuaW1hdGlvbi1kZWxheTogMHM7CiAgICAgICAgICAgIH0KICAgICAgICAgICAgLnBhdGgtZnJvbnQgewogICAgICAgICAgICAgICAgYW5pbWF0aW9uLWRlbGF5OiAwLjE1czsKICAgICAgICAgICAgfQogICAgICAgICAgICAuZG90IHsKICAgICAgICAgICAgICAgIGZpbGw6IHVybCgjbG9hZGVyLWdyYWQpOwogICAgICAgICAgICAgICAgb3BhY2l0eTogMDsKICAgICAgICAgICAgfQogICAgICAgICAgICAuZG90LTEgeyBhbmltYXRpb246IGRvdC1ib3VuY2UgM3MgaW5maW5pdGUgY3ViaWMtYmV6aWVyKDAuNCwgMCwgMC4yLCAxKTsgdHJhbnNmb3JtLW9yaWdpbjogMjg2cHggMjg2cHg7IH0KICAgICAgICAgICAgLmRvdC0yIHsgYW5pbWF0aW9uOiBkb3QtYm91bmNlIDNzIGluZmluaXRlIGN1YmljLWJlemllcigwLjQsIDAsIDAuMiwgMSkgMC4xczsgdHJhbnNmb3JtLW9yaWdpbjogMzExcHggMjg2cHg7IH0KICAgICAgICAgICAgLmRvdC0zIHsgYW5pbWF0aW9uOiBkb3QtYm91bmNlIDNzIGluZmluaXRlIGN1YmljLWJlemllcigwLjQsIDAsIDAuMiwgMSkgMC4yczsgdHJhbnNmb3JtLW9yaWdpbjogMzM2cHggMjg2cHg7IH0KCiAgICAgICAgICAgIEBrZXlmcmFtZXMgZHJhdy1wYXRoIHsKICAgICAgICAgICAgICAgIDAlIHsgc3Ryb2tlLWRhc2hvZmZzZXQ6IDEwMDsgb3BhY2l0eTogMDsgfQogICAgICAgICAgICAgICAgNSUgeyBvcGFjaXR5OiAxOyBzdHJva2UtZGFzaG9mZnNldDogMTAwOyB9CiAgICAgICAgICAgICAgICA0MCUgeyBzdHJva2UtZGFzaG9mZnNldDogMDsgb3BhY2l0eTogMTsgfQogICAgICAgICAgICAgICAgODAlIHsgc3Ryb2tlLWRhc2hvZmZzZXQ6IDA7IG9wYWNpdHk6IDE7IH0KICAgICAgICAgICAgICAgIDkwJSwgMTAwJSB7IHN0cm9rZS1kYXNob2Zmc2V0OiAwOyBvcGFjaXR5OiAwOyB9CiAgICAgICAgICAgIH0KCiAgICAgICAgICAgIEBrZXlmcmFtZXMgZG90LWJvdW5jZSB7CiAgICAgICAgICAgICAgICAwJSwgMzUlIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDApIHNjYWxlKDApOyBvcGFjaXR5OiAwOyB9CiAgICAgICAgICAgICAgICA0NSUgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLThweCkgc2NhbGUoMS4xKTsgb3BhY2l0eTogMTsgfQogICAgICAgICAgICAgICAgNTUlIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDApIHNjYWxlKDEpOyBvcGFjaXR5OiAxOyB9CiAgICAgICAgICAgICAgICA4MCUgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMCkgc2NhbGUoMSk7IG9wYWNpdHk6IDE7IH0KICAgICAgICAgICAgICAgIDkwJSwgMTAwJSB7IHRyYW5zZm9ybTogdHJhbnNsYXRlWSgwKSBzY2FsZSgwKTsgb3BhY2l0eTogMDsgfQogICAgICAgICAgICB9CiAgICAgICAgPC9zdHlsZT4KICAgIDwvZGVmcz4KCiAgICA8Zz4KICAgICAgICA8IS0tIEJhY2sgQnViYmxlIC0tPgogICAgICAgIDxwYXRoIGNsYXNzPSJwYXRoLWFuaW0gcGF0aC1iYWNrIiBwYXRoTGVuZ3RoPSIxMDAiIGQ9Ik0gMTYxIDEyNiBMIDMwMSAxMjYgUSAzNDEgMTI2IDM0MSAxNjYgTCAzNDEgMjQ2IFEgMzQxIDI4NiAzMDEgMjg2IEwgMTkxIDI4NiBMIDE0MSAzMzYgTCAxNjEgMjg2IFEgMTIxIDI4NiAxMjEgMjQ2IEwgMTIxIDE2NiBRIDEyMSAxMjYgMTYxIDEyNiBaIiBmaWxsPSJub25lIiBzdHJva2U9InVybCgjbG9hZGVyLWdyYWQpIiBzdHJva2Utd2lkdGg9IjMyIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2UtbGluZWNhcD0icm91bmQiIG1hc2s9InVybCgjZ2FwLW1hc2stbG9hZGVyKSI+PC9wYXRoPgoKICAgICAgICA8IS0tIEZyb250IEJ1YmJsZSAtLT4KICAgICAgICA8cGF0aCBjbGFzcz0icGF0aC1hbmltIHBhdGgtZnJvbnQiIHBhdGhMZW5ndGg9IjEwMCIgZD0iTSAyNjEgMjI2IEwgMzYxIDIyNiBRIDM5MSAyMjYgMzkxIDI1NiBMIDM5MSAzMTYgUSAzOTEgMzQ2IDM2MSAzNDYgTCAyOTEgMzQ2IEwgMjQxIDM4NiBMIDI2MSAzNDYgUSAyMzEgMzQ2IDIzMSAzMTYgTCAyMzEgMjU2IFEgMjMxIDIyNiAyNjEgMjI2IFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0idXJsKCNsb2FkZXItZ3JhZCkiIHN0cm9rZS13aWR0aD0iMzIiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCI+PC9wYXRoPgogICAgICAgIAogICAgICAgIDwhLS0gQW5pbWF0ZWQgVHlwaW5nIERvdHMgKC4uLikgLS0+CiAgICAgICAgPGNpcmNsZSBjeD0iMjg2IiBjeT0iMjg2IiByPSIxNCIgY2xhc3M9ImRvdCBkb3QtMSI+PC9jaXJjbGU+CiAgICAgICAgPGNpcmNsZSBjeD0iMzExIiBjeT0iMjg2IiByPSIxNCIgY2xhc3M9ImRvdCBkb3QtMiI+PC9jaXJjbGU+CiAgICAgICAgPGNpcmNsZSBjeD0iMzM2IiBjeT0iMjg2IiByPSIxNCIgY2xhc3M9ImRvdCBkb3QtMyI+PC9jaXJjbGU+CiAgICA8L2c+Cjwvc3ZnPg==";
    const mailOptions = {
      from: process.env.SMTP_FROM || `Value Chat <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Value Chat Verification Code',
      html: `
        <div style="font-family: 'Outfit', 'Inter', Arial, sans-serif; background-color: #000000; padding: 40px 20px; min-height: 100vh;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #0f0f12; border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
            <tr>
              <td align="center">
                <div style="width: 72px; height: 72px; margin-bottom: 24px;">
                  <img src="data:image/svg+xml;base64,${loaderBase64}" width="72" height="72" style="display: block;" alt="Value Chat" />
                </div>
                <h2 style="color: #ffffff; font-size: 26px; font-weight: 700; margin: 0 0 12px 0; letter-spacing: -0.5px;">Verify Your Email</h2>
                <p style="color: #a1a1aa; font-size: 15px; margin: 0 0 32px 0; line-height: 1.5;">Enter this code to complete your registration and log into your workspace.</p>
                
                <div style="background-color: #18181b; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
                  <span style="font-family: 'SF Mono', 'Courier New', monospace; font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #818cf8; margin-left: 12px;">${code}</span>
                </div>
                
                <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px; margin-top: 32px;">
                  <p style="color: #71717a; font-size: 13px; line-height: 1.5; margin: 0;">This code expires in <strong style="color: #d4d4d8;">10 minutes</strong>.<br>If you didn't request this, please ignore this email.</p>
                </div>
              </td>
            </tr>
          </table>
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
    const loaderBase64 = "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIj4KICAgIDxkZWZzPgogICAgICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ibG9hZGVyLWdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICAgICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjYTg1NWY3Ij48L3N0b3A+IDwhLS0gUHVycGxlIDUwMCAtLT4KICAgICAgICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNmQyOGQ5Ij48L3N0b3A+IDwhLS0gVmlvbGV0IDcwMCAtLT4KICAgICAgICA8L2xpbmVhckdyYWRpZW50PgoKICAgICAgICA8bWFzayBpZD0iZ2FwLW1hc2stbG9hZGVyIj4KICAgICAgICAgICAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0id2hpdGUiPjwvcmVjdD4KICAgICAgICAgICAgPHBhdGggZD0iTSAyNjEgMjI2IEwgMzYxIDIyNiBRIDM5MSAyMjYgMzkxIDI1NiBMIDM5MSAzMTYgUSAzOTEgMzQ2IDM2MSAzNDYgTCAyOTEgMzQ2IEwgMjQxIDM4NiBMIDI2MSAzNDYgUSAyMzEgMzQ2IDIzMSAzMTYgTCAyMzEgMjU2IFEgMjMxIDIyNiAyNjEgMjI2IFoiIGZpbGw9ImJsYWNrIiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjUyIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2UtbGluZWNhcD0icm91bmQiPjwvcGF0aD4KICAgICAgICA8L21hc2s+CgogICAgICAgIDwhLS0gRW1iZWRkZWQgQ1NTIGZvciBzdGFuZGFyZCBSZWFjdC9XZWIgY29tcGF0aWJpbGl0eSB3aXRob3V0IGV4dGVybmFsIHN0eWxlc2hlZXRzIC0tPgogICAgICAgIDxzdHlsZT4KICAgICAgICAgICAgLnBhdGgtYW5pbSB7CiAgICAgICAgICAgICAgICBzdHJva2UtZGFzaGFycmF5OiAxMDA7CiAgICAgICAgICAgICAgICBzdHJva2UtZGFzaG9mZnNldDogMTAwOwogICAgICAgICAgICAgICAgYW5pbWF0aW9uOiBkcmF3LXBhdGggM3MgY3ViaWMtYmV6aWVyKDAuNCwgMCwgMC4yLCAxKSBpbmZpbml0ZTsKICAgICAgICAgICAgfQogICAgICAgICAgICAucGF0aC1iYWNrIHsKICAgICAgICAgICAgICAgIGFuaW1hdGlvbi1kZWxheTogMHM7CiAgICAgICAgICAgIH0KICAgICAgICAgICAgLnBhdGgtZnJvbnQgewogICAgICAgICAgICAgICAgYW5pbWF0aW9uLWRlbGF5OiAwLjE1czsKICAgICAgICAgICAgfQogICAgICAgICAgICAuZG90IHsKICAgICAgICAgICAgICAgIGZpbGw6IHVybCgjbG9hZGVyLWdyYWQpOwogICAgICAgICAgICAgICAgb3BhY2l0eTogMDsKICAgICAgICAgICAgfQogICAgICAgICAgICAuZG90LTEgeyBhbmltYXRpb246IGRvdC1ib3VuY2UgM3MgaW5maW5pdGUgY3ViaWMtYmV6aWVyKDAuNCwgMCwgMC4yLCAxKTsgdHJhbnNmb3JtLW9yaWdpbjogMjg2cHggMjg2cHg7IH0KICAgICAgICAgICAgLmRvdC0yIHsgYW5pbWF0aW9uOiBkb3QtYm91bmNlIDNzIGluZmluaXRlIGN1YmljLWJlemllcigwLjQsIDAsIDAuMiwgMSkgMC4xczsgdHJhbnNmb3JtLW9yaWdpbjogMzExcHggMjg2cHg7IH0KICAgICAgICAgICAgLmRvdC0zIHsgYW5pbWF0aW9uOiBkb3QtYm91bmNlIDNzIGluZmluaXRlIGN1YmljLWJlemllcigwLjQsIDAsIDAuMiwgMSkgMC4yczsgdHJhbnNmb3JtLW9yaWdpbjogMzM2cHggMjg2cHg7IH0KCiAgICAgICAgICAgIEBrZXlmcmFtZXMgZHJhdy1wYXRoIHsKICAgICAgICAgICAgICAgIDAlIHsgc3Ryb2tlLWRhc2hvZmZzZXQ6IDEwMDsgb3BhY2l0eTogMDsgfQogICAgICAgICAgICAgICAgNSUgeyBvcGFjaXR5OiAxOyBzdHJva2UtZGFzaG9mZnNldDogMTAwOyB9CiAgICAgICAgICAgICAgICA0MCUgeyBzdHJva2UtZGFzaG9mZnNldDogMDsgb3BhY2l0eTogMTsgfQogICAgICAgICAgICAgICAgODAlIHsgc3Ryb2tlLWRhc2hvZmZzZXQ6IDA7IG9wYWNpdHk6IDE7IH0KICAgICAgICAgICAgICAgIDkwJSwgMTAwJSB7IHN0cm9rZS1kYXNob2Zmc2V0OiAwOyBvcGFjaXR5OiAwOyB9CiAgICAgICAgICAgIH0KCiAgICAgICAgICAgIEBrZXlmcmFtZXMgZG90LWJvdW5jZSB7CiAgICAgICAgICAgICAgICAwJSwgMzUlIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDApIHNjYWxlKDApOyBvcGFjaXR5OiAwOyB9CiAgICAgICAgICAgICAgICA0NSUgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLThweCkgc2NhbGUoMS4xKTsgb3BhY2l0eTogMTsgfQogICAgICAgICAgICAgICAgNTUlIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDApIHNjYWxlKDEpOyBvcGFjaXR5OiAxOyB9CiAgICAgICAgICAgICAgICA4MCUgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMCkgc2NhbGUoMSk7IG9wYWNpdHk6IDE7IH0KICAgICAgICAgICAgICAgIDkwJSwgMTAwJSB7IHRyYW5zZm9ybTogdHJhbnNsYXRlWSgwKSBzY2FsZSgwKTsgb3BhY2l0eTogMDsgfQogICAgICAgICAgICB9CiAgICAgICAgPC9zdHlsZT4KICAgIDwvZGVmcz4KCiAgICA8Zz4KICAgICAgICA8IS0tIEJhY2sgQnViYmxlIC0tPgogICAgICAgIDxwYXRoIGNsYXNzPSJwYXRoLWFuaW0gcGF0aC1iYWNrIiBwYXRoTGVuZ3RoPSIxMDAiIGQ9Ik0gMTYxIDEyNiBMIDMwMSAxMjYgUSAzNDEgMTI2IDM0MSAxNjYgTCAzNDEgMjQ2IFEgMzQxIDI4NiAzMDEgMjg2IEwgMTkxIDI4NiBMIDE0MSAzMzYgTCAxNjEgMjg2IFEgMTIxIDI4NiAxMjEgMjQ2IEwgMTIxIDE2NiBRIDEyMSAxMjYgMTYxIDEyNiBaIiBmaWxsPSJub25lIiBzdHJva2U9InVybCgjbG9hZGVyLWdyYWQpIiBzdHJva2Utd2lkdGg9IjMyIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2UtbGluZWNhcD0icm91bmQiIG1hc2s9InVybCgjZ2FwLW1hc2stbG9hZGVyKSI+PC9wYXRoPgoKICAgICAgICA8IS0tIEZyb250IEJ1YmJsZSAtLT4KICAgICAgICA8cGF0aCBjbGFzcz0icGF0aC1hbmltIHBhdGgtZnJvbnQiIHBhdGhMZW5ndGg9IjEwMCIgZD0iTSAyNjEgMjI2IEwgMzYxIDIyNiBRIDM5MSAyMjYgMzkxIDI1NiBMIDM5MSAzMTYgUSAzOTEgMzQ2IDM2MSAzNDYgTCAyOTEgMzQ2IEwgMjQxIDM4NiBMIDI2MSAzNDYgUSAyMzEgMzQ2IDIzMSAzMTYgTCAyMzEgMjU2IFEgMjMxIDIyNiAyNjEgMjI2IFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0idXJsKCNsb2FkZXItZ3JhZCkiIHN0cm9rZS13aWR0aD0iMzIiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCI+PC9wYXRoPgogICAgICAgIAogICAgICAgIDwhLS0gQW5pbWF0ZWQgVHlwaW5nIERvdHMgKC4uLikgLS0+CiAgICAgICAgPGNpcmNsZSBjeD0iMjg2IiBjeT0iMjg2IiByPSIxNCIgY2xhc3M9ImRvdCBkb3QtMSI+PC9jaXJjbGU+CiAgICAgICAgPGNpcmNsZSBjeD0iMzExIiBjeT0iMjg2IiByPSIxNCIgY2xhc3M9ImRvdCBkb3QtMiI+PC9jaXJjbGU+CiAgICAgICAgPGNpcmNsZSBjeD0iMzM2IiBjeT0iMjg2IiByPSIxNCIgY2xhc3M9ImRvdCBkb3QtMyI+PC9jaXJjbGU+CiAgICA8L2c+Cjwvc3ZnPg==";
    const mailOptions = {
      from: process.env.SMTP_FROM || `Value Chat <${process.env.SMTP_USER}>`,
      to: email,
      subject: `You're invited to join ${tenantName} on Value Chat`,
      html: `
        <div style="font-family: 'Outfit', 'Inter', Arial, sans-serif; background-color: #000000; padding: 40px 20px; min-height: 100vh;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #0f0f12; border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
            <tr>
              <td align="center">
                <div style="width: 72px; height: 72px; margin-bottom: 24px;">
                  <img src="data:image/svg+xml;base64,${loaderBase64}" width="72" height="72" style="display: block;" alt="Value Chat" />
                </div>
                <h2 style="color: #ffffff; font-size: 26px; font-weight: 700; margin: 0 0 12px 0; letter-spacing: -0.5px;">You've been invited!</h2>
                <p style="color: #a1a1aa; font-size: 15px; margin: 0 0 32px 0; line-height: 1.5;">
                  <strong style="color: #ffffff;">${inviterEmail}</strong> invited you to join <strong style="color: #ffffff;">${tenantName}</strong> as a <strong>${role}</strong>.
                </p>
                
                <div style="background-color: #18181b; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
                  <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 16px 0;">Sign in or create an account using this email to accept.</p>
                  <a href="${process.env.FRONTEND_URL || 'https://valuechat.app'}/login" style="display: inline-block; background-color: #818cf8; color: #0f0f12; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 15px;">Accept Invitation</a>
                </div>
                
                <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px; margin-top: 32px;">
                  <p style="color: #71717a; font-size: 13px; line-height: 1.5; margin: 0;">This invitation expires in 7 days.</p>
                </div>
              </td>
            </tr>
          </table>
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

  /**
   * Send a generic email
   */
  async sendEmail({ to, subject, html, text }) {
    const mailOptions = {
      from: process.env.SMTP_FROM || `Value Chat <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: html || text,
      text: text || ''
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
