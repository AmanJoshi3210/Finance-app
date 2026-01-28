import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "../connection/Connection.js";

import userRoutes from "../Routes/userRoutes.js";
import userDataRoutes from "../Routes/userDataRoutes.js";
import transactionRoutes from "../Routes/transactionRoutes.js";

dotenv.config();

const app = express();
const allowedOrigins = [
  "https://finance-app-rouge-eight.vercel.app",
  "https://finance-app-git-main-amanjoshi3210s-projects.vercel.app",
  "https://finance-56h50jgwb-amanjoshi3210s-projects.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow Postman / server-to-server
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ====== Middleware ======
app.use(express.json());

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
