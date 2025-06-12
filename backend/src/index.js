import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

console.log("Setting up middleware...");

app.use(cors({ 
  origin: process.env.NODE_ENV === "production" 
    ? process.env.FRONTEND_URL || true 
    : "http://localhost:8080",
  credentials: true 
}));

app.use(express.json());
app.use(cookieParser());

console.log("Loading routes...");

// Load routes one by one with error handling
try {
  console.log("Loading auth routes...");
  const authRoutes = await import("./routes/authRoutes/auth.routes.js");
  app.use("/api/auth", authRoutes.default);
  console.log("Auth routes loaded successfully");
} catch (error) {
  console.error("Error loading auth routes:", error);
}

try {
  console.log("Loading circuit routes...");
  const circuitRoutes = await import("./routes/circuitRoutes/circuit.routes.js");
  app.use("/api/circuit", circuitRoutes.default);
  console.log("Circuit routes loaded successfully");
} catch (error) {
  console.error("Error loading circuit routes:", error);
}

try {
  console.log("Loading energy routes...");
  const energyRoutes = await import("./routes/energyRoutes/energy.routes.js");
  app.use("/api/energy", energyRoutes.default);
  console.log("Energy routes loaded successfully");
} catch (error) {
  console.error("Error loading energy routes:", error);
}

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));
  
  app.get("*", (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    } else {
      res.status(404).json({ error: "API route not found" });
    }
  });
}

console.log("Starting server...");

app.listen(PORT, async () => {
  try {
    const { connectDB } = await import("./lib/connectDB.js");
    connectDB();
    console.log("Server is running on port: ", PORT);
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
});
