import mongoose from "mongoose";

const recurringTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit", "withdrawal"],
      required: true,
    },
    method: { type: String, default: "Other" },
    category: { type: String, default: "Other" },
    amount: { type: Number, required: true },
    description: { type: String, trim: true },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: true,
    },
    nextRunDate: { type: Date, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Supports the CRUD list (sorted by next run) and the cron job's due-record scan.
recurringTransactionSchema.index({ userId: 1, nextRunDate: 1 });

export default mongoose.model("RecurringTransaction", recurringTransactionSchema);
