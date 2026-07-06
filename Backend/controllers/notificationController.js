import Notification from "../Models/Notification.js";

// 📄 List a user's most recent notifications, plus their unread count
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).limit(limit),
      Notification.countDocuments({ userId, read: false }),
    ]);

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🔁 Mark a single notification as read
export const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Mark Notification Read Error:", error);
    res.status(500).json({ message: error.message });
  }
};
