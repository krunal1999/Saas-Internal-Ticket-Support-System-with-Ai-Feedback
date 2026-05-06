import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { Customer } from "../models/customer.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";
import dotenv from "dotenv";
dotenv.config();

// Helper: sign JWT
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// @route   POST /api/auth/login
// @desc    Login agent/admin and return JWT
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required." });
  }

  // select("+password") because password has select: false in schema
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );

  if (!user || !user.isActive) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials." });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials." });
  }

  const token = signToken(user._id);

  // Remove password from response
  const userObj = user.toObject();
  delete userObj.password;

  res.status(200).json({ success: true, token, user: userObj });
});

// @route   GET /api/auth/me
// @desc    Get currently logged-in agent
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

// @route   POST /api/auth/customer-login
// @desc    Login customer and return JWT
// @access  Public
const customerLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required." });
  }

  const customer = await Customer.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );

  if (!customer || !customer.isActive) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials." });
  }

  const isMatch = await bcrypt.compare(password, customer.password);
  if (!isMatch) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials." });
  }

  const token = signToken(customer._id);

  const customerObj = customer.toObject();
  delete customerObj.password;

  res.status(200).json({ success: true, token, user: customerObj });
});

export { login, customerLogin, getMe };
