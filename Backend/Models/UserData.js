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

export default mongoose.model("UserData", userDataSchema);
