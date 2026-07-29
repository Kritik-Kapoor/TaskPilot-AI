import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { ApiResponse } from "./utils/apiResponse.js";
import authRoutes from "./routes/auth.route.js";
import organizationRoutes from "./routes/organization.route.js";
import projectRoutes from "./routes/project.route.js";
import ticketRoutes from "./routes/ticket.route.js";

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
app.use("/auth", authRoutes);
app.use("/organization", organizationRoutes);
app.use("/project", projectRoutes);
app.use("/ticket", ticketRoutes);

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
