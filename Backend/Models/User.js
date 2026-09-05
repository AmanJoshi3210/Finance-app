import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  // Per-user login 2FA. When true, /login won't return a token directly —
  // it emails a one-time code that must be confirmed via /verify-login-otp.
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  otpCode: {
    type: String,
    select: false,
  },
  otpExpiry: {
    type: Date,
    select: false,
  },
  // Wrong-code counter shared by every OTP flow (signup, login 2FA, password
  // reset). The code is burned once this hits MAX_OTP_ATTEMPTS, so a 6-digit
  // code can't be walked through at HTTP speed within its 10-minute window.
  otpAttempts: {
    type: Number,
    default: 0,
    select: false,
  },
  resetOtpCode: {
    type: String,
    select: false,
  },
  resetOtpExpiry: {
    type: Date,
    select: false,
  },
  notificationPreferences: {
    budgetAlerts: { type: Boolean, default: true },
    weeklySummary: { type: Boolean, default: true },
    unusualActivity: { type: Boolean, default: false },
  },
});

export default mongoose.model("User", userSchema);
