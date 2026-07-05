import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit","withdrawal"],
      required: true,
    },
    method: {
      type: String,
      default: "Other",
    },
    category: {
      type: String,
      default: "Other",
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Supports both the paginated history query (userId + date sort) and the
// dashboard's "recent transactions" lookup without a full collection scan.
transactionSchema.index({ userId: 1, date: -1 });

export default mongoose.model("Transaction", transactionSchema);
