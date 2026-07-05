import mongoose from "mongoose";

const categoryBudgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: { type: String, required: true, trim: true },
    limit: { type: Number, required: true, min: 0 },
    month: {
      type: String, // "YYYY-MM"
      required: true,
    },
  },
  { timestamps: true }
);

categoryBudgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });

export default mongoose.model("CategoryBudget", categoryBudgetSchema);
