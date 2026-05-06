// Wraps async route handlers so we don't need try/catch in every controller.
// Usage: router.get("/", asyncHandler(myController))
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Central error handler — add this as the LAST middleware in app.js
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res
      .status(400)
      .json({ success: false, message: "Validation failed", errors: messages });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res
      .status(400)
      .json({ success: false, message: `${field} already exists.` });
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    return res
      .status(400)
      .json({ success: false, message: `Invalid ID format: ${err.value}` });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Invalid token." });
  }

  // Default 500
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
};

export { asyncHandler, errorHandler };
