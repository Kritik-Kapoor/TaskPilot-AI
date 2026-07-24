import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { ApiResponse } from "./utils/apiResponse.js";

dotenv.config();

const corsOptions: cors.CorsOptions = {
  origin: process.env.WEBAPP_URL,
  credentials: true,
};

connectDB();

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/health", (_req, res) => {
  return new ApiResponse(200, null, "SERVER IS CONNECTED").send(res);
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
