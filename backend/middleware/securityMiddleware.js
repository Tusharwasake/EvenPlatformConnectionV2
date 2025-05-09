import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";

/**
 * Configure and export security middleware
 * @param {object} app - Express app instance
 */
export const configureSecurityMiddleware = (app) => {
  // Set security HTTP headers
  app.use(helmet());

  // Rate limiting
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
      success: false,
      message: "Too many requests from this IP, please try again later",
    },
  });

  // Apply general rate limiting to all routes
  app.use("/", generalLimiter);

  // More strict rate limiting for authentication routes
  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 attempts per hour
    message: {
      success: false,
      message: "Too many login attempts, please try again later",
    },
  });

  // Apply stricter rate limiting to auth routes
  app.use("/user/login", authLimiter);
  app.use("/user/register", authLimiter);
  app.use("/user/forgot-password", authLimiter);

  // Data sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // Data sanitization against XSS
  app.use(xss());

  // Prevent parameter pollution
  app.use(
    hpp({
      whitelist: ["startDate", "endDate", "category", "location", "sort"],
    })
  );

  // Set Content Security Policy
  app.use((req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'"
    );
    next();
  });

  // Add security headers for WebSocket connections
  app.use((req, res, next) => {
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
    next();
  });

  console.log("✅ Security middleware configured");
};
