import mongoose from "mongoose";

const NotificationType = {
  BUDGET_ALERT: "budget_alert",
  UNUSUAL_ACTIVITY: "unusual_activity",
  BILL_REMINDER: "bill_reminder",
  WEEKLY_SUMMARY: "weekly_summary",
};


const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: Object.values(NotificationType),
    required: true,
  },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  // Identifies the specific condition that produced this alert (e.g. a budget
  // threshold crossing or a bill's due cycle) so the same condition is never
  // notified twice, even if the trigger logic runs again on a later write.
  dedupeKey: { type: String },
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, dedupeKey: 1 }, { unique: true, sparse: true });

export default mongoose.model("Notification", notificationSchema);

