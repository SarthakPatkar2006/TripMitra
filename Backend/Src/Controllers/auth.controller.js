import bcrypt from "bcryptjs";
import userModel from "../Models/User.js";
import generateToken from "../Utils/generateToken.js";
export async function register(req, res) {
  try {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }
    if (!email || !password) {
  return res.status(400).json({
    message: "Email and password are required"
  });
}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(email)) {
  return res.status(400).json({
    message: "Invalid email"
  });
}
if (password.length < 6) {
  return res.status(400).json({
    message: "Password must be at least 6 characters"
  });
}

    const existingUser =
      await userModel.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists"
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user =
      await userModel.create({
        name,
        email,
        password: hashedPassword
      });

    const token =
      generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {

    res.status(500).json({
      message: "Internal Server Error!"
    });

  }
}
export async function login(req, res) {

  try {

    const { email, password } =
      req.body;

    const user =
      await userModel.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const token =
      generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {

    res.status(500).json({
      message: "Internal Server Error!"
    });

  }

}
export async function getMe(
  req,
  res
) {

  res.status(200).json({
    success: true,
    user: req.user
  });

}