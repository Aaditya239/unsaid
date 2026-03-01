import nodemailer from 'nodemailer';

/**
 * Basic Email Service using Nodemailer
 */
export const sendEmail = async (options: {
    email: string;
    subject: string;
    message: string;
    html?: string;
}) => {
    // 1. Create a transporter
    // For development, use Mailtrap or similar
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
        port: parseInt(process.env.EMAIL_PORT || '2525'),
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    // 2. Define the email options
    const mailOptions = {
        from: `UNSAID Support <${process.env.EMAIL_FROM || 'support@unsaid.app'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    // 3. Actually send the email
    await transporter.sendMail(mailOptions);
};

/**
 * Send Password Reset Email
 */
export const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
    const subject = 'Password Reset Request - UNSAID';
    const message = `You requested a password reset. Please click on the link below to reset your password:\n\n${resetUrl}\n\nThis link is valid for 15 minutes. If you did not request this, please ignore this email.`;

    const html = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4F7CFF;">UNSAID</h2>
            <p>You requested a password reset for your account.</p>
            <p>Click the button below to reset your password. This link is valid for <strong>15 minutes</strong>.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #4F7CFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            <p style="font-size: 13px; color: #666;">If you did not request this, please ignore this email. No changes will be made to your account.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999;">UNSAID - Your Emotional Companion</p>
        </div>
    `;

    await sendEmail({ email, subject, message, html });
};
