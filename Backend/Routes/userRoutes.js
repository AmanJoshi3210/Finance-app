import express from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../Models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { sendEmail } from "../services/emailService.js";
const router = express.Router();

const OTP_EXPIRY_MINUTES = 10;

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const sendOtpEmail = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: "Your FinTrack verification code",
    text: `Your verification code is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    html: `<p>Your verification code is <strong>${otp}</strong>.</p><p>It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
  });
};

router.get("/verify", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("name email createdAt");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      valid: true,
      userId: req.user.userId,
      name: user.name, // ✅ send name
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


const DEFAULT_NOTIFICATION_PREFERENCES = {
  budgetAlerts: true,
  weeklySummary: true,
  unusualActivity: false,
};

router.get("/notification-preferences", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("notificationPreferences");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/notification-preferences", authMiddleware, async (req, res) => {
  try {
    const { budgetAlerts, weeklySummary, unusualActivity } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $set: {
          "notificationPreferences.budgetAlerts": Boolean(budgetAlerts),
          "notificationPreferences.weeklySummary": Boolean(weeklySummary),
          "notificationPreferences.unusualActivity": Boolean(unusualActivity),
        },
      },
      { new: true, select: "notificationPreferences" }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.notificationPreferences);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update the signed-in user's profile. Email is deliberately not editable —
// it's the login identity and unique key.
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { name: name.trim() } },
      { new: true, select: "name email createdAt" }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ name: user.name, email: user.email, createdAt: user.createdAt });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Change the signed-in user's password after verifying the current one.
router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// REGISTER — creates an unverified account and emails a one-time code.
// The account only becomes usable once /verify-otp confirms the code.
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // An existing *verified* account owns this email. An existing
    // *unverified* one just means a prior signup was abandoned before the
    // code was entered — let this call refresh it and send a new code
    // rather than leaving the user permanently stuck on that email.
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const user = existingUser
      ? Object.assign(existingUser, {
          name: name.trim(),
          password: hashedPassword,
          otpCode: hashedOtp,
          otpExpiry,
        })
      : new User({
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          isVerified: false,
          otpCode: hashedOtp,
          otpExpiry,
        });
    await user.save();

    await sendOtpEmail(normalizedEmail, otp);

    // Never echo the user document back — it contains the password hash.
    res.status(201).json({
      message: "Verification code sent to your email",
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// VERIFY OTP — confirms the code emailed at signup and activates the account.
// Succeeds by logging the user straight in, since verification is the final
// signup step.
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+otpCode +otpExpiry");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    if (!user.otpCode || !user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "Code expired. Please request a new one." });
    }

    const isMatch = await bcrypt.compare(otp, user.otpCode);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid verification code" });
    }

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token, userId: user._id, name: user.name });
  } catch (err) {
    console.error("OTP verify error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// RESEND OTP — issues a fresh code for a not-yet-verified account.
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    const otp = generateOtp();
    user.otpCode = await bcrypt.hash(otp, 10);
    user.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await user.save();

    await sendOtpEmail(normalizedEmail, otp);

    res.json({ message: "Verification code resent" });
  } catch (err) {
    console.error("OTP resend error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  console.log("Login request received");
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "All fields required" });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
        requiresVerification: true,
        email: user.email,
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token, userId: user._id, name: user.name });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
