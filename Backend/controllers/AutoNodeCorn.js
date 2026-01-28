import cron from "node-cron";
import UserData from "../Models/UserData.js";
import MonthlySummary from "../Models/MonthlySummary";

// Run at midnight on the 1st of every month
cron.schedule("0 0 1 * *", async () => {
  console.log("Running monthly reset...");

  try {
    const allUsersData = await UserData.find();

    for (const userData of allUsersData) {
      const month = new Date().toISOString().slice(0, 7); // "YYYY-MM"

      // Save the month's summary
      await MonthlySummary.create({
        userId: userData.userId,
        month,
        totalCredit: userData.totalCredit,
        totalDebit: userData.totalDebit,
        monthlyLimit: userData.monthlyLimit,
      });

      // Reset totals but keep the monthly limit
      userData.totalCredit = 0;
      userData.totalDebit = 0;
      userData.updatedAt = Date.now();

      await userData.save();
    }

    console.log("✅ Monthly data saved and totals reset successfully");
  } catch (error) {
    console.error("❌ Error during monthly reset:", error);
  }
});
