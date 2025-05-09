// middleware/validationMiddleware.js
export const validateEventInput = (req, res, next) => {
  const { name, description, location, startDate, endDate, category } =
    req.body;

  // Basic validation
  if (
    !name ||
    !description ||
    !location ||
    !startDate ||
    !endDate ||
    !category
  ) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
      requiredFields: [
        "name",
        "description",
        "location",
        "startDate",
        "endDate",
        "category",
      ],
    });
  }

  // Check if dates are valid
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid date format",
    });
  }

  // All validations passed
  next();
};
