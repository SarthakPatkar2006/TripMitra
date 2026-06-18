import { Resend } from "resend";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

export const sendEmail = async ({
  email,
  subject,
  message,
  html
}) => {
  try {
    const response =
      await resend.emails.send({
        from:
          process.env.EMAIL_FROM ||
          "TripMitra <onboarding@resend.dev>",
        to: email,
        subject,
        text: message,
        html
      });

    console.log(
      "Email sent successfully:",
      response.data?.id
    );

    return response;
  } catch (error) {
    console.error(
      "Error sending email:",
      error
    );

    throw error;
  }
};