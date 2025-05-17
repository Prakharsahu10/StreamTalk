import express from "express";
import { checkAuth, login, logout, signup, updateProfile } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);

// Support both GET and POST for login endpoint
router.get("/login", (req, res) => {
  res
    .status(200)
    .json({
      message: "Login page - Please use POST method for authentication",
    });
});
router.post("/login", login);

router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

export default router;
