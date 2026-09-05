import mongoose from "mongoose";

const monthlySummarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  month: {
    type: String, // e.g. "2025-10"
    required: true,
  },
  totalCredit: {
    type: Number,
    required: true,
  },
  totalDebit: {
    type: Number,
    required: true,
  },
  monthlyLimit: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// One summary per user per month. The snapshot job upserts on this pair, so
// the index is what makes a concurrent cron run and lazy read-repair collapse
// into a single row instead of racing to insert duplicates.
monthlySummarySchema.index({ userId: 1, month: 1 }, { unique: true });

export default mongoose.model("MonthlySummary", monthlySummarySchema);
