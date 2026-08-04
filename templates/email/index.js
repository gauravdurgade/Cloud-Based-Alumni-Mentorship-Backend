const brandColor = "#4A90E2";
const platformName = process.env.EMAIL_NAME || "Cloud Alumni Mentorship Platform";

const baseLayout = (content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background-color: ${brandColor}; color: #ffffff; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px; color: #333333; line-height: 1.6; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #888888; font-size: 12px; border-top: 1px solid #eeeeee; }
        .btn { display: inline-block; background-color: ${brandColor}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${platformName}</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} ${platformName}. All rights reserved.<br>
            Please do not reply to this automated email.
        </div>
    </div>
</body>
</html>
`;

const templates = {
    welcome: (name, role) => baseLayout(`
        <h2>Welcome to the Platform, ${name}!</h2>
        <p>We are thrilled to have you join our mentorship community as a <strong>${role}</strong>.</p>
        <p>Get started by completing your profile and exploring the network. Our platform is designed to foster meaningful professional connections and career growth.</p>
        <center><a href="${process.env.CLIENT_URL || '#'}" class="btn">Go to Dashboard</a></center>
    `),
    
    alumniApproval: (name) => baseLayout(`
        <h2>Congratulations, ${name}!</h2>
        <p>Your Alumni registration has been officially <strong>approved</strong> by the administration team.</p>
        <p>You can now log in, set your mentorship availability, and start accepting requests from students.</p>
        <center><a href="${process.env.CLIENT_URL || '#'}/login" class="btn">Log In Now</a></center>
    `),
    
    meetingScheduled: (name, meetingDetails) => baseLayout(`
        <h2>New Meeting Scheduled!</h2>
        <p>Hi ${name},</p>
        <p>A new mentorship session has been scheduled successfully.</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid ${brandColor};">
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(meetingDetails.date).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${meetingDetails.time}</p>
            <p style="margin: 5px 0;"><strong>Link:</strong> <a href="${meetingDetails.link}">${meetingDetails.link}</a></p>
        </div>
        <p>Please ensure you arrive on time. You can view full details on your dashboard.</p>
    `),

    feedbackReceived: (name, rating, feedback) => baseLayout(`
        <h2>New Feedback Received</h2>
        <p>Hi ${name},</p>
        <p>A student has just submitted feedback for your recent mentorship session!</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid ${brandColor};">
            <p style="margin: 5px 0;"><strong>Rating:</strong> ${rating} / 5 Stars</p>
            <p style="margin: 5px 0; font-style: italic;">"${feedback}"</p>
        </div>
        <p>Thank you for your continued contribution to the community.</p>
    `),

    passwordReset: (name, resetToken) => baseLayout(`
        <h2>Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset the password for your account.</p>
        <p>Click the button below to choose a new password. This link is valid for 1 hour.</p>
        <center><a href="${process.env.CLIENT_URL || '#'}/reset-password/${resetToken}" class="btn">Reset Password</a></center>
        <p style="margin-top: 20px; font-size: 12px; color: #888;">If you didn't request this, you can safely ignore this email.</p>
    `)
};

module.exports = templates;
