// controllers/healthController.js
export const healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    message: "API server is running",
    timestamp: new Date(),
    environment: process.env.NODE_ENV || "development",
  });
};
