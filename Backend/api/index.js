import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "../connection/Connection.js";

import userRoutes from "../Routes/userRoutes.js";
import userDataRoutes from "../Routes/userDataRoutes.js";
import transactionRoutes from "../Routes/transactionRoutes.js";

dotenv.config();

const app = express();

// ====== Middleware ======
app.use(express.json());
app.use(cors());

// ====== DB Connection ======
connectDB();

// ====== Routes ======
app.get("/", (req, res) => {
  res.send("💸 Finance Recorder API is running...");
});

app.use("/api/users", userRoutes);
app.use("/api/userdata", userDataRoutes);
app.use("/api/transactions", transactionRoutes);

// 🚀 IMPORTANT: export app (NO listen)
// export default app;
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
