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

app.use(cors({ 
    origin: "http://localhost:8080",
    credentials: true 
}));

app.use(express.json()); // allows us to parse incoming requests:req.body
app.use(cookieParser()); // allows us to parse incoming cookies

// Import routes
app.use("/api/auth", authRoutes);
app.use("/api/circuit", circuitRoutes);
app.use("/api/energy", energyRoutes);

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "/frontend/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    });
}

app.listen(PORT, () => {
    connectDB();
    console.log("Server is running on port: ", PORT);
});
