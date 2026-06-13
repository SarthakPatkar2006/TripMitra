import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

import userModel from "../Models/User.js";

export async function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Unauthorized - No token provided"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // FIX: Add .select("-password") to exclude the hash!
    req.user = await userModel.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized - User no longer exists"
      });
    }

    next();

  } catch (error) {
    console.error("JWT Error:", error.message);

    return res.status(401).json({
      message: "Unauthorized - Invalid or expired token"
    });
  }
}