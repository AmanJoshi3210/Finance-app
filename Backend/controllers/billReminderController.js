import BillReminder from "../Models/BillReminder.js";

// Rolls a recurring reminder's dueDate forward by whole months until it's in
// the future — same lazy self-healing convention as the monthly summary job,
// so no separate cron is needed just to keep recurring bills current.
const rollForwardIfPast = (reminder, now) => {
  if (!reminder.recurring) return false;

  let rolled = false;
  const dueDate = new Date(reminder.dueDate);
  let iterations = 0;

  while (dueDate < now && iterations < 120) {
    dueDate.setMonth(dueDate.getMonth() + 1);
    rolled = true;
    iterations++;
  }

  if (rolled) {
    reminder.dueDate = dueDate;
  }

  return rolled;
};

const deriveStatus = (reminder, now) => {
  const msUntilDue = new Date(reminder.dueDate) - now;
  const daysUntilDue = msUntilDue / (1000 * 60 * 60 * 24);

  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= reminder.notifyDaysBefore) return "due-soon";
  return "upcoming";
};

// ➕ Create a bill reminder
export const createBillReminder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, amount, dueDate, recurring, notifyDaysBefore } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Bill name is required" });
    }
    if (amount === undefined || Number(amount) < 0) {
      return res.status(400).json({ message: "Please provide a valid amount" });
    }
    if (!dueDate) {
      return res.status(400).json({ message: "Due date is required" });
    }

    const reminder = await BillReminder.create({
      userId,
      name: name.trim(),
      amount: Number(amount),
      dueDate,
      recurring: Boolean(recurring),
      notifyDaysBefore: notifyDaysBefore !== undefined ? Number(notifyDaysBefore) : undefined,
    });

    res.status(201).json(reminder);
  } catch (error) {
    console.error("Create Bill Reminder Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📄 List a user's bill reminders, self-healing overdue recurring ones and
// annotating each with a derived status.
export const getBillReminders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();

    const reminders = await BillReminder.find({ userId });

    for (const reminder of reminders) {
      if (rollForwardIfPast(reminder, now)) {
        await reminder.save();
      }
    }

    reminders.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.json(reminders.map((reminder) => ({ ...reminder.toObject(), status: deriveStatus(reminder, now) })));
  } catch (error) {
    console.error("Get Bill Reminders Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🔁 Update a bill reminder
export const updateBillReminder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { name, amount, dueDate, recurring, notifyDaysBefore } = req.body;

    const reminder = await BillReminder.findOneAndUpdate(
      { _id: id, userId },
      {
        name,
        amount: amount !== undefined ? Number(amount) : undefined,
        dueDate,
        recurring,
        notifyDaysBefore: notifyDaysBefore !== undefined ? Number(notifyDaysBefore) : undefined,
      },
      { new: true, omitUndefined: true }
    );

    if (!reminder) {
      return res.status(404).json({ message: "Bill reminder not found" });
    }

    res.json(reminder);
  } catch (error) {
    console.error("Update Bill Reminder Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🗑️ Delete a bill reminder
export const deleteBillReminder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const reminder = await BillReminder.findOneAndDelete({ _id: id, userId });

    if (!reminder) {
      return res.status(404).json({ message: "Bill reminder not found" });
    }

    res.json({ message: "Bill reminder deleted successfully" });
  } catch (error) {
    console.error("Delete Bill Reminder Error:", error);
    res.status(500).json({ message: error.message });
  }
};
