const transporter = require("../config/email");
const templates = require("../templates/email");

const senderInfo = `"${process.env.EMAIL_NAME || 'Mentorship Platform'}" <${process.env.EMAIL_FROM || 'noreply@example.com'}>`;

/**
 * Core unified email sender with silent failure handling
 * so business logic is never interrupted.
 */
const sendMail = async (to, subject, html) => {
    try {
        if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
            console.warn(`[EmailService] Bypassed sending email to ${to} (SMTP credentials not configured)`);
            return { success: false, reason: "No credentials" };
        }

        const info = await transporter.sendMail({
            from: senderInfo,
            to,
            subject,
            html
        });
        
        console.log(`[EmailService] Email sent to ${to} - MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`[EmailService] Failed to send email to ${to}:`, error.message);
        return { success: false, reason: error.message };
    }
};

const emailService = {
    sendWelcomeEmail: (email, name, role) => {
        return sendMail(email, "Welcome to the Mentorship Platform!", templates.welcome(name, role));
    },
    sendAlumniApprovedEmail: (email, name) => {
        return sendMail(email, "Your Alumni Profile is Approved!", templates.alumniApproval(name));
    },
    sendMeetingScheduledEmail: (email, name, meetingDetails) => {
        return sendMail(email, "New Mentorship Session Scheduled", templates.meetingScheduled(name, meetingDetails));
    },
    sendFeedbackReceivedEmail: (email, name, rating, feedbackText) => {
        return sendMail(email, "New Mentorship Feedback Received", templates.feedbackReceived(name, rating, feedbackText));
    },
    sendPasswordResetEmail: (email, name, resetToken) => {
        return sendMail(email, "Password Reset Instructions", templates.passwordReset(name, resetToken));
    }
};

module.exports = emailService;
