// Transactional email via Brevo's HTTP API (https://api.brevo.com), NOT raw SMTP.
//
// Why: Render's free tier blocks outbound SMTP ports (25/465/587), so
// nodemailer -> smtp.gmail.com hangs and times out in deployment (works locally
// because a laptop isn't blocked). Brevo's API goes over HTTPS (443), which is
// never blocked, so the same code path works both locally and on Render.
//
// sendEmail keeps the same { to, subject, text, html } signature, so callers
// (OTP flow in Routes/userRoutes.js, notificationService.js) are unchanged.

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

// The "from" address must be a sender you've verified in Brevo. We reuse the
// existing SMTP_USER (your Gmail) so you don't need a new env var for it;
// set BREVO_SENDER_EMAIL only if you want a different verified sender.
const getSenderEmail = () =>
  process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER;

// Fire-and-forget friendly: never throws, swallows its own errors so a
// notification/transaction/OTP flow can never fail because email delivery did.
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = getSenderEmail();

    // Email disabled (no API key / no sender) or nothing to send to.
    if (!apiKey || !senderEmail || !to) return false;

    const res = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: process.env.EMAIL_FROM || "FinTrack",
          email: senderEmail,
        },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html,
      }),
      // Guard against a hung request; HTTPS won't be blocked, but be defensive.
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      // Brevo returns a JSON error body (e.g. unverified sender, bad key).
      const detail = await res.text().catch(() => "");
      console.error(`Send Email Error: Brevo ${res.status} ${detail}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Send Email Error:", error.message);
    return false;
  }
};
