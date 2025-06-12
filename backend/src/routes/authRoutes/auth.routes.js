import express from "express";
import { logout, login, signup, checkAuth } from "../../controllers/authControllers/auth.controller.js";
import { protectRoute } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/check-auth", protectRoute, checkAuth);

export default router;
