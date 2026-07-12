import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["bank", "credit_card", "cash", "wallet", "investment", "other"],
      default: "other",
    },
    // Fixed at creation — the starting point the running `balance` was seeded
    // from. Kept immutable afterwards to avoid balance-drift recomputation.
    openingBalance: { type: Number, default: 0 },
    // Live running total, seeded to openingBalance on create and mutated by
    // every transaction against this account (see applyAccountBalanceDelta
    // in transactionController.js). Deliberately allowed to go negative
    // (overdrawn account, credit card balance owed) — unlike UserData's
    // totals, this is not clamped at 0.
    balance: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
    // Soft-delete: an archived account with existing transactions stays
    // attached to its history/exports but drops out of the account selector
    // and out of getOrCreateDefaultAccount's candidate pool.
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// At most one default account per user.
accountSchema.index(
  { userId: 1, isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } }
);

export default mongoose.model("Account", accountSchema);
