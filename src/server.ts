// server/server.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

import authRoutes from "./routes/authRoutes";
import clientRoutes from "./routes/clientRoutes";
import fundingRequestRoutes from "./routes/fundingRequestRoutes";

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

app.use(cors({
  origin: [
    "https://funding-app-frontend.onrender.com",
    "http://localhost:3000",
    "http://localhost:5173"
  ],
  credentials: true,
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Logging - helpful for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`, { headers: req.headers });
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/client", clientRoutes);
app.use("/api", fundingRequestRoutes);

// Health
app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// Serve static frontend if you place build output under public (optional)
// app.use(express.static(path.join(__dirname, "public")));
// app.get("*", (req, res) => {
//   // If request starts with /api return 404
//   if (req.path.startsWith("/api")) return res.status(404).json({ message: "API endpoint not found" });
//   res.sendFile(path.join(__dirname, "public", "index.html"));
// });

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
