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

export default mongoose.model("MonthlySummary", monthlySummarySchema);
