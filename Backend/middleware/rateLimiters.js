// middleware/rateLimiters.js
//
// Throttles for the unauthenticated auth surface. Without these, a 6-digit
// OTP and a user's password are both guessable at whatever rate the network
// allows — the attempt counter on the User document caps guesses against a
// single issued code, and these cap how fast codes and passwords can be tried
// across accounts.
//
// Note: these use the default in-memory store, so counters are per-process.
// That's the right trade-off on a single Render instance; if the API is ever
// scaled to multiple instances, swap in a shared store (Redis/Mongo) so the
// limits stay global.
import { rateLimit, ipKeyGenerator } from "express-rate-limit";

// Bucket per (IP, email) rather than per IP alone: one household or office
// NAT shouldn't lock everyone out because a single user fat-fingered a code,
// and an attacker rotating emails from one IP still gets caught by the IP
// half of the key. ipKeyGenerator normalizes IPv6 into a /56 subnet, which
// is what stops a single client from cycling addresses for free.
const ipAndEmailKey = (req) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  return `${ipKeyGenerator(req.ip)}:${email}`;
};

const jsonMessage = (message) => ({ message });

// Password and code submission — the endpoints where a wrong guess is cheap
// for the attacker and expensive for the user.
export const authAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: ipAndEmailKey,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // A correct password/code shouldn't count against the budget, so a user
  // logging in repeatedly on a shared IP never trips this.
  skipSuccessfulRequests: true,
  message: jsonMessage("Too many attempts. Please wait a few minutes and try again."),
});

// Code issuance — each of these sends an email, so the limit protects the
// user's inbox and the Brevo quota as much as it protects the account.
export const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: ipAndEmailKey,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: jsonMessage("Too many code requests. Please wait a few minutes and try again."),
});

// Account creation, keyed on IP alone since the email is attacker-chosen.
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: jsonMessage("Too many accounts created from this address. Please try again later."),
});
