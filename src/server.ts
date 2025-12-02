// server/server.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

// Load environment variables first
dotenv.config();

// Import routes
import authRoutes from "./routes/authRoutes";
import clientRoutes from "./routes/clientRoutes";
import fundingRequestRoutes from "./routes/fundingRequestRoutes";

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

// Middleware - order matters
// 1. CORS first
app.use(cors({
  origin: [
    "https://funding-app-frontend.onrender.com",
    "http://localhost:3000",
    "http://localhost:5173"
  ],
  credentials: true,
}));

// 2. Body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// 3. Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`, { headers: req.headers });
  next();
});

// 4. API Routes
app.use("/api/auth", authRoutes);
app.use("/api/client", clientRoutes);
app.use("/api", fundingRequestRoutes);

// 5. Health check
app.get("/api/health", (_req, res) => 
  res.json({ status: "ok", time: new Date().toISOString() })
);

// 6. Error handling (catch-all at the end)
app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "API endpoint not found" });
  }
  res.status(404).json({ message: "Not found" });
});

// 7. Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
