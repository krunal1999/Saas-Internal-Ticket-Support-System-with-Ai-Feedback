import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Customer } from "../models/customer.model.js";

const protect = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader =
      req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
    console.log(authHeader);

    if (!authHeader) {
      console.log("no token");
      return res.status(401).json({
        success: false,
        message: "Not authorized. No token provided.",
      });
    }

    const token = authHeader;

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);

    // 3. Attach agent to request (exclude password)
    let user = await User.findById(decoded.id).select("-password");
    if (!user) {
      user = await Customer.findById(decoded.id).select("-password");
    }

    if (!user || !user.isActive) {
      console.log("no User");
      return res.status(401).json({
        success: false,
        message: "User no longer exists or is inactive.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token." });
  }
};

// Optional: restrict certain routes to admin only
const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Access denied. Admins only." });
  }
  next();
};

export { protect, adminOnly };
