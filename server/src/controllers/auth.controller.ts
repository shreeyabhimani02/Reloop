import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";

export async function register(
  req: Request,
  res: Response
) {
  try {
    const {
      name,
      email,
      password,
      location,
    } = req.body;

    // Normalize email
    const normalizedEmail =
      String(email).trim().toLowerCase();

    // Check duplicate email
    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists",
      });
    }

    // Hash password
    const hashedPassword =
      await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      location: location?.trim() || "",
    });

    // Generate JWT
    const token = generateToken(
      user._id.toString()
    );

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location,
        avatar: user.avatar,
        rating: user.rating,
        totalRatings: user.totalRatings,
        itemsSold: user.itemsSold,
        responseRate: user.responseRate,
      },
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
}

export async function login(
  req: Request,
  res: Response
) {
  try {
    const { email, password } = req.body;

    const normalizedEmail =
      String(email).trim().toLowerCase();

    // Password has select:false in User model,
    // so explicitly include it.
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare entered password with hashed password
    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT
    const token = generateToken(
      user._id.toString()
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location,
        avatar: user.avatar,
        rating: user.rating,
        totalRatings: user.totalRatings,
        itemsSold: user.itemsSold,
        responseRate: user.responseRate,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location,
        avatar: user.avatar,
        bio: user.bio,
        rating: user.rating,
        totalRatings: user.totalRatings,
        itemsSold: user.itemsSold,
        responseRate: user.responseRate,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
}