// ============================================
// utils/emailSender.js (Enhanced version)
const nodemailer = require("nodemailer");

// Create reusable transporter with connection pooling
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT || 587,
    secure: process.env.MAIL_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    pool: true, // Enable connection pooling
    maxConnections: 5, // Maximum concurrent connections
    maxMessages: 100, // Maximum messages per connection
    rateLimit: 10, // Maximum messages per second
  });
};

// Singleton transporter instance
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

const emailSender = async (email, subject, body, options = {}) => {
  try {
    const transporter = getTransporter();
    
    const mailOptions = {
      from: options.from || `"Expense Tracker 💰" <${process.env.MAIL_USER}>`,
      to: email,
      subject: subject,
      html: body,
      priority: options.priority || 'normal', // high, normal, low
      ...options.additionalOptions,
    };

    // Add text fallback for HTML emails
    if (!options.text && body.includes('<')) {
      // Simple HTML to text conversion for fallback
      mailOptions.text = body
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
        .replace(/&amp;/g, '&') // Replace &amp; with &
        .replace(/&lt;/g, '<')  // Replace &lt; with <
        .replace(/&gt;/g, '>')  // Replace &gt; with >
        .trim();
    }

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`Email sent successfully to ${email}:`, {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    console.error(`Email sending failed for ${email}:`, error.message);
    
    // Don't expose internal email errors to prevent information leakage
    throw new Error(`Failed to send email: ${error.code || 'UNKNOWN_ERROR'}`);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  if (transporter) {
    transporter.close();
  }
});

module.exports = emailSender;