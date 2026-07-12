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
  otpCode: {
    type: String,
    select: false,
  },
  otpExpiry: {
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
