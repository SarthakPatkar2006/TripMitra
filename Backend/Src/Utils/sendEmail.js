import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify SMTP connection once when the server starts
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Connection Failed:");
    console.error(error);
  } else {
    console.log("✅ Gmail SMTP Connected Successfully");
  }
});

export const sendEmail = async ({
  email,
  subject,
  message,
  html
}) => {
  try {
    console.log("==================================");
    console.log("Sending Email");
    console.log("To:", email);
    console.log("Subject:", subject);
    console.log("==================================");

    const info = await transporter.sendMail({
      from: `"TripMitra" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text: message,
      html
    });

    console.log("Email sent successfully");
    console.log("Message ID:", info.messageId);

    return info;
  } catch (error) {
    console.error("Failed to send email");
    console.error(error);

    throw error;
  }
};