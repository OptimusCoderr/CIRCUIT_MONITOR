import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import authRoutes from "./routes/authRoutes/auth.routes.js";
import circuitRoutes from "./routes/circuitRoutes/circuit.routes.js";
import energyRoutes from "./routes/energyRoutes/energy.routes.js";
import { connectDB } from "./lib/connectDB.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === "production" 
    ? process.env.FRONTEND_URL || true 
    : "http://localhost:8080",
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/circuit", circuitRoutes);
app.use("/api/energy", energyRoutes);

// Static file serving for production
if (process.env.NODE_ENV === "production") {
  // Serve static files from the React app build directory
  app.use(express.static(path.join(__dirname, "frontend/dist")));

  // Handle React routing, return all requests to React app
  // Use a function instead of a wildcard pattern to avoid path-to-regexp issues
  app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // For all other routes, serve the React app
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port: ${PORT}`);
});
