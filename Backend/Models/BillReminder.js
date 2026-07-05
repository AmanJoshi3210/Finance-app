import mongoose from "mongoose";

const billReminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    recurring: { type: Boolean, default: false },
    notifyDaysBefore: { type: Number, default: 3, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("BillReminder", billReminderSchema);
