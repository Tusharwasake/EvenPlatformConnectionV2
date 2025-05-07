import jwt from "jsonwebtoken";
import { promisify } from "util";

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const JWT_COOKIE_EXPIRES_IN = process.env.JWT_COOKIE_EXPIRES_IN || 24; // hours

/**
 * Signs a JWT token for authentication
 * @param {string} userId - User ID to include in the payload
 * @param {string} role - User role (e.g., "user", "organizer", "admin")
 * @returns {string} Signed JWT token
 */
export const signToken = (userId, role) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Creates and sends a JWT token as a cookie and in response
 * @param {object} user - User object
 * @param {number} statusCode - HTTP status code to send
 * @param {object} res - Express response object
 * @param {string} message - Optional message to include in response
 */
export const createSendToken = (user, statusCode, res, message = "Success") => {
  const token = signToken(user._id, user.role);

  // Set secure HTTP-only cookie for better security
  const cookieOptions = {
    expires: new Date(Date.now() + JWT_COOKIE_EXPIRES_IN * 60 * 60 * 1000),
    httpOnly: true, // Cannot be accessed or modified by browser
    secure: process.env.NODE_ENV === "production", // Only sent on HTTPS
    sameSite: "strict", // Protects against CSRF attacks
  };

  // Remove password from output
  if (user.password) user.password = undefined;

  // Send cookie with the token
  res.cookie("jwt", token, cookieOptions);

  // Also send token in response body (for API clients)
  res.status(statusCode).json({
    success: true,
    message,
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
};

/**
 * Middleware to protect routes - verifies JWT token
 * Can be used from either cookies or Authorization header
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // 1) Get token and check if it exists
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // From Authorization header
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      // From cookie
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "You are not logged in. Please log in to get access.",
      });
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, JWT_SECRET);

    // 3) Check if user still exists (optional: you could check in your DB)
    // Implemented in authMiddleware.js

    // 4) Store user info in request object for use in routes
    req.user = decoded;

    // Grant access to protected route
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Your token has expired. Please log in again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed. Please log in again.",
    });
  }
};

/**
 * Middleware to restrict access to certain roles
 * @param  {...string} roles - Roles allowed to access the route
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

/**
 * Middleware to refresh JWT token if it's about to expire
 * This helps provide a seamless user experience
 */
export const refreshToken = async (req, res, next) => {
  try {
    // Only proceed if there's a valid token
    if (!req.user || !req.user.userId) {
      return next();
    }

    // Get token expiration from decoded token
    const tokenExp = req.user.exp; // Expiration timestamp
    const currentTime = Math.floor(Date.now() / 1000);

    // If token is about to expire (less than 30 minutes left)
    if (tokenExp && tokenExp - currentTime < 30 * 60) {
      // Create a new token
      const newToken = signToken(req.user.userId, req.user.role);

      // Set new cookie
      const cookieOptions = {
        expires: new Date(Date.now() + JWT_COOKIE_EXPIRES_IN * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      };

      res.cookie("jwt", newToken, cookieOptions);

      // Add refreshed token to header for API clients
      res.setHeader("X-Refreshed-Token", newToken);
    }

    next();
  } catch (error) {
    // Don't block the request if token refresh fails
    console.error("Error refreshing token:", error);
    next();
  }
};

/**
 * Middleware to clear JWT cookie for logout
 */
export const clearJwtCookie = (req, res, next) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
    httpOnly: true,
  });
  next();
};
