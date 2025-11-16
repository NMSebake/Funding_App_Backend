// server/server.ts
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import authRoutes from "./routes/authRoutes";
import clientRoutes from "./routes/clientRoutes";
import fundingRequestRoutes from "./routes/fundingRequestRoutes";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

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



app.use(bodyParser.json());
app.use(express.json());

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});