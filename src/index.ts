import express from "express";
import cors from "cors";
import dotenv from "dotenv";
//? import agentRoutes from "./routes/agent.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
//? example app.use("/api/agent", agentRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API Docs: http://localhost:${PORT}/api/agent`);
});
