import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

import userModel from "../Models/User.js";

export async function protect(req, res, next) {

  const authHeader =
    req.headers.authorization;

  if (
    !authHeader ||
    !authHeader.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      message: "Unauthorized"
    });
  }

  const token =
    authHeader.split(" ")[1];

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log(
      "Decoded JWT:",
      decoded
    );

    req.user =
      await userModel.findById(
        decoded.id
      );

    console.log(
      "Decoded User:",
      req.user
    );

    if (!req.user) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    next();

  } catch (error) {

    console.error(error);

    return res.status(401).json({
      message: "Invalid token"
    });

  }
}