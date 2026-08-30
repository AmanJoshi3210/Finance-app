import mongoose from "mongoose";

const userDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  monthlyLimit: {
    type: Number,
    default: 0,
  },
  totalCredit: {
    type: Number,
    default: 0,
  },
  totalDebit: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Exactly one totals document per user. applyUserDataDelta relies on an
// upsert keyed on userId; without this index two concurrent first writes
// (a double-clicked save, or withTransaction retrying) both miss and both
// insert, after which the running totals silently split across two docs.
userDataSchema.index({ userId: 1 }, { unique: true });

export default mongoose.model("UserData", userDataSchema);
