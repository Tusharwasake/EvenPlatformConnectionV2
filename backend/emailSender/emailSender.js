

import "dotenv/config";
import nodemailer from "nodemailer";

/**
 * Send email to recipient
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} content - Email content (HTML or plain text)
 * @returns {Promise<boolean>} - Success status
 */
const mailsender = async (to, subject, content) => {
  // Check environment variables first
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error("Email credentials missing in environment variables");
    return false;
  }

  // Create transporter inside function to ensure fresh credentials
  const transporter = nodemailer.createTransport({
    service: "gmail", // Use Gmail service instead of host/port
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS, // This should be an app password, not regular password
    },
  });

  const mailOptions = {
    from: `"Event Connection" <${process.env.GMAIL_USER}>`,
    to: to, // Use recipient's email
    subject: subject,
    text:
      typeof content === "string"
        ? content.replace(/<[^>]*>/g, "")
        : "Your verification code", // Plain text version
    html:
      typeof content === "string"
        ? content
        : `
        <h1>Event Connection - Verification Code</h1>
        <h2>${content}</h2>
        <p>Please use this code to verify your registration.</p>
      `,
  };

  try {
    console.log(`Attempting to send email to ${to}`);
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to", to);
    return true;
  } catch (error) {
    console.error("Error sending email:", error.message);
    return false;
  }
};

export { mailsender };
