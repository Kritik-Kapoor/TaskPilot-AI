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
import helmet from "helmet";
import { authenticateWorkspaceUser } from "./middlewares/authenticateWorkspaceUser.middleware.js";

dotenv.config();

const corsOptions: cors.CorsOptions = {
  origin: process.env.WEBAPP_URL,
  credentials: true,
};

connectDB();

const app = express();

app.set("trust proxy", 1);

// Middleware
app.use(cors(corsOptions));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Routes
app.use("/health", (_req, res) => {
  return new ApiResponse(200, null, "SERVER IS CONNECTED").send(res);
});
app.use("/auth", authRoutes);
app.use("/organization", organizationRoutes);
app.use("/project", authenticateWorkspaceUser, projectRoutes);
app.use("/ticket", authenticateWorkspaceUser, ticketRoutes);

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
