// utils/emailService.js
// Nodemailer-based email service for OTP and notifications

const nodemailer = require('nodemailer');

// Create transporter — uses Gmail SMTP
// Requires EMAIL_USER and EMAIL_PASS in .env
// EMAIL_PASS must be a Gmail App Password (not normal Gmail password)
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

/**
 * Send an OTP email for faculty registration verification
 * @param {string} toEmail - recipient (the mandatory faculty email)
 * @param {string} otp - 6-digit OTP code
 * @param {string} subjectName - the subject being registered
 */
const sendFacultyOTP = async (toEmail, otp, subjectName) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: `"SKUCET Portal" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `SKUCET Faculty Registration OTP — ${subjectName}`,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #0EA5E9 0%, #10B981 100%); padding: 32px 40px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 3px; font-weight: 900;">SKUCET</h1>
                    <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; font-weight: 500;">Faculty Portal — Verification Code</p>
                </div>

                <!-- Body -->
                <div style="padding: 36px 40px; background: white;">
                    <p style="color: #374151; font-size: 16px; margin: 0 0 16px;">Hello,</p>
                    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                        Your OTP code to register as faculty for <strong style="color: #0EA5E9;">${subjectName}</strong> is:
                    </p>

                    <!-- OTP Box -->
                    <div style="background: #f0f9ff; border: 2px solid #bae6fd; border-radius: 12px; text-align: center; padding: 24px; margin: 0 0 24px;">
                        <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Your Verification Code</p>
                        <p style="margin: 0; font-size: 44px; font-weight: 900; letter-spacing: 12px; color: #0f172a; font-family: 'Courier New', monospace;">${otp}</p>
                    </div>

                    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
                        ⏱️ This OTP is valid for <strong>10 minutes</strong> only.
                    </p>
                    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                        🔒 Do not share this code with anyone. SKUCET staff will never ask for your OTP.
                    </p>

                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                    <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
                        SK University College of Engineering and Technology · Computer Science Department<br/>
                        This is an automated message. Please do not reply.
                    </p>
                </div>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ OTP email sent to ${toEmail} | MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send OTP email:', error.message);
        throw new Error(`Email delivery failed: ${error.message}`);
    }
};

/**
 * Send a secure login OTP for Faculty or Admin portals
 * @param {string} toEmail - recipient email
 * @param {string} otp - 6-digit OTP code
 * @param {string} role - 'faculty' or 'admin'
 * @param {string} userName - user's name
 */
const sendLoginVerificationOTP = async (toEmail, otp, role, userName) => {
    const transporter = createTransporter();

    const roleLabel = role === 'admin' ? 'Admin' : 'Faculty';
    const roleColor = role === 'admin' ? '#DC2626' : '#0EA5E9';
    const gradientStart = role === 'admin' ? '#991B1B' : '#0EA5E9';
    const gradientEnd = role === 'admin' ? '#DC2626' : '#10B981';

    const mailOptions = {
        from: `"SKUCET Secure Portal" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `🔐 SKUCET ${roleLabel} Portal — Login Verification Code`,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%); padding: 32px 40px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 3px; font-weight: 900;">SKUCET</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 14px; font-weight: 600; letter-spacing: 1px;">${roleLabel.toUpperCase()} PORTAL — SECURE LOGIN</p>
                </div>

                <!-- Security Badge -->
                <div style="background: linear-gradient(135deg, ${gradientStart}10, ${gradientEnd}10); padding: 16px 40px; border-bottom: 1px solid #e2e8f0; text-align: center;">
                    <span style="display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: ${roleColor}; font-weight: 700; letter-spacing: 0.5px;">
                        🔒 SECURE LOGIN VERIFICATION REQUIRED
                    </span>
                </div>

                <!-- Body -->
                <div style="padding: 36px 40px; background: white;">
                    <p style="color: #374151; font-size: 16px; margin: 0 0 8px; font-weight: 600;">Hello, ${userName}!</p>
                    <p style="color: #6B7280; font-size: 14px; line-height: 1.7; margin: 0 0 24px;">
                        A login attempt was made to your <strong style="color: ${roleColor};">${roleLabel} Portal</strong> account. 
                        Please use the verification code below to complete your sign-in.
                    </p>

                    <!-- OTP Box -->
                    <div style="background: linear-gradient(135deg, ${gradientStart}08, ${gradientEnd}12); border: 2px solid ${roleColor}30; border-radius: 16px; text-align: center; padding: 28px; margin: 0 0 24px;">
                        <p style="margin: 0 0 8px; font-size: 12px; color: #94A3B8; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Login Verification Code</p>
                        <p style="margin: 0 0 12px; font-size: 52px; font-weight: 900; letter-spacing: 14px; color: #0F172A; font-family: 'Courier New', monospace;">${otp}</p>
                        <p style="margin: 0; font-size: 12px; color: ${roleColor}; font-weight: 600;">Valid for 10 minutes only</p>
                    </div>

                    <!-- Warning -->
                    <div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 12px 16px; margin: 0 0 20px;">
                        <p style="margin: 0; font-size: 13px; color: #92400E; line-height: 1.5;">
                            ⚠️ <strong>Security Alert:</strong> If you did NOT initiate this login, someone may have access to your credentials. Change your password immediately and contact the system administrator.
                        </p>
                    </div>

                    <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 8px;">
                        🔒 <strong>Never share this code</strong> with anyone — SKUCET staff will never ask for your OTP.
                    </p>
                    <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 24px;">
                        📍 This code expires in <strong>10 minutes</strong>. If you didn't request this, ignore this email.
                    </p>

                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                    <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
                        SK University College of Engineering and Technology · Computer Science Department<br/>
                        This is an automated security message. Please do not reply.
                    </p>
                </div>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Login OTP email sent to ${toEmail} (${role}) | MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send Login OTP email:', error.message);
        throw new Error(`Email delivery failed: ${error.message}`);
    }
};

module.exports = { sendFacultyOTP, sendLoginVerificationOTP };
