import nodemailer from "nodemailer";

// Notice the "export const sendEmail" here! This matches your { sendEmail } import.
export const sendEmail = async (options) => {
  try {
    // Create a transporter (Replace with your actual SMTP credentials later)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.mailtrap.io",
      port: process.env.SMTP_PORT || 2525,
      auth: {
        user: process.env.SMTP_USER || "your_user",
        pass: process.env.SMTP_PASS || "your_pass",
      },
    });

    const mailOptions = {
      from: "TripMitra <noreply@tripmitra.com>",
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", options.email);
    
  } catch (error) {
    console.error("Error sending email:", error);
    // We don't throw here so the app doesn't crash if an email fails to send
  }
};