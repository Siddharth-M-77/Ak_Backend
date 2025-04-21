import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import UserRouter from "./routes/user.router.js";
import AdminRouter from "./routes/admin.routes.js";

import connectToDB from "./DB/DB.js";

dotenv.config();

// Initialize app
const app = express();

const allowedOrigins = [
  "http://localhost:4155",
  "http://192.168.29.175:6018",
  "http://192.168.3.56:4155",
  "http://192.168.29.127:6017",
  "http://192.168.29.88:4155",
  "http://192.168.3.56:6017",
];

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  })
);

// API Routes
app.use("/api/users", UserRouter);
app.use("/api/admin", AdminRouter);
connectToDB()
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    // import("./utils/cronJobs.js");
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB Connection Failed:", err);
    process.exit(1);
  });
