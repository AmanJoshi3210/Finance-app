import * as tf from "@tensorflow/tfjs";
import mongoose from "mongoose";
import MonthlySummary from "../Models/MonthlySummary.js";

// -------------------
// 🔹 1. Connect to MongoDB
// -------------------
await mongoose.connect("mongodb://localhost:27017/financeApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// -------------------
// 🔹 2. Fetch user’s monthly data
// -------------------
const userId = "YOUR_USER_ID"; // replace or pass dynamically
const data = await MonthlySummary.find({ userId }).sort({ month: 1 }).lean();

if (data.length < 3) {
  console.error("❌ Not enough data to train the model");
  process.exit(1);
}

console.log(`✅ Loaded ${data.length} months of data`);

// -------------------
// 🔹 3. Prepare Training Data
// -------------------
// Features (X): totalCredit, monthlyLimit
// Labels (Y): totalDebit (you can expand this later)

const maxCredit = Math.max(...data.map(d => d.totalCredit));
const maxLimit = Math.max(...data.map(d => d.monthlyLimit));
const maxDebit = Math.max(...data.map(d => d.totalDebit));

const xs = tf.tensor2d(
  data.map(d => [d.totalCredit / maxCredit, d.monthlyLimit / maxLimit])
);
const ys = tf.tensor2d(
  data.map(d => [d.totalDebit / maxDebit])
);

// -------------------
// 🔹 4. Build Neural Network
// -------------------
const model = tf.sequential();
model.add(tf.layers.dense({ units: 8, activation: "relu", inputShape: [2] }));
model.add(tf.layers.dense({ units: 4, activation: "relu" }));
model.add(tf.layers.dense({ units: 1 })); // output = predicted totalDebit

model.compile({
  optimizer: tf.train.adam(0.01),
  loss: "meanSquaredError",
});

console.log("🧠 Training model...");
await model.fit(xs, ys, {
  epochs: 300,
  shuffle: true,
  verbose: 0,
});

console.log("✅ Model trained successfully!");

// -------------------
// 🔹 5. Predict Next Month
// -------------------
// Example: Predict debit for a hypothetical month
const nextMonthCredit = 80000; // e.g. estimated credit
const nextMonthLimit = 100000; // e.g. limit

const input = tf.tensor2d([[nextMonthCredit / maxCredit, nextMonthLimit / maxLimit]]);
const prediction = model.predict(input);

const predictedDebit = (await prediction.data())[0] * maxDebit;

console.log(`📈 Predicted totalDebit for next month: ₹${predictedDebit.toFixed(2)}`);

// -------------------
// 🔹 6. Optionally Save Model
// -------------------
await model.save("file://./ml-model");
console.log("💾 Model saved to ./ml-model folder");

mongoose.connection.close();
