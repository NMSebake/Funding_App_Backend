// server/server.ts
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import authRoutes from "./routes/authRoutes";
import clientRoutes from "./routes/clientRoutes";
import fundingRequestRoutes from "./routes/fundingRequestRoutes";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
app.use(express.urlencoded({ extended: true }));
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(bodyParser.json());
app.use(express.json());



// Middleware in correct order
app.use(cors({
  origin: [
    "https://funding-app-frontend.onrender.com",
    "http://localhost:3000",  // for local development
    "http://localhost:5173", // Vite default port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add this after all middleware but before routes
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.originalUrl}`, {
    headers: req.headers,
    body: req.body
  });
  next();
});


// Add this after CORS but before routes
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    params: req.params
  });
  next();
});


// Test route - remove this after fixing
app.get("/api/test-client", (req, res) => {
  res.json({ message: "Client routes are working!" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/client", clientRoutes);
app.use("/api", fundingRequestRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Backend is running!",
    timestamp: new Date().toISOString()
  });
});

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Serve frontend build (only AFTER api routes)
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Must be LAST
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
