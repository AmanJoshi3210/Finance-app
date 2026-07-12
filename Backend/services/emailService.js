import nodemailer from "nodemailer";

// Cached across warm serverless invocations — same idiom as the `isConnected`
// flag in connection/Connection.js, so we don't rebuild an SMTP connection
// pool on every request.
let transporter;
let transporterInitialized = false;

const getTransporter = () => {
  if (transporterInitialized) return transporter;
  transporterInitialized = true;

  if (!process.env.SMTP_HOST) {
    transporter = null; // email disabled (e.g. local dev with no SMTP configured)
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

// Fire-and-forget friendly: never throws, swallows its own errors so a
// notification/transaction flow can never fail because email delivery did.
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const t = getTransporter();
    if (!t || !to) return false;

    await t.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (error) {
    console.error("Send Email Error:", error.message);
    return false;
  }
};
