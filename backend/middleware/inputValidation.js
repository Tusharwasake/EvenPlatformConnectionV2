import Joi from "joi";

/**
 * Helper function to handle validation results
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {object} schema - Joi validation schema
 * @param {string} source - Source of data to validate ('body', 'query', 'params')
 * @returns {boolean} True if validation passed, false otherwise
 */
const validateRequest = (req, res, schema, source = "body") => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false, // Return all errors, not just the first
    stripUnknown: true, // Remove unknown properties
  });

  if (error) {
    const errorDetails = error.details.map((detail) => ({
      field: detail.context.key,
      message: detail.message,
    }));

    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errorDetails,
    });

    return false;
  }

  // Replace request data with validated data
  req[source] = value;
  return true;
};

/**
 * Validation middleware for user registration
 */
export const validateRegistration = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .trim()
      .pattern(/^[a-zA-Z0-9\s'-]+$/)
      .messages({
        "string.pattern.base": "Name contains invalid characters",
        "string.empty": "Name is required",
        "string.min": "Name must be at least 2 characters long",
        "string.max": "Name cannot exceed 50 characters",
      }),

    email: Joi.string().email().required().trim().lowercase().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),

    password: Joi.string()
      .min(8)
      .required()
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      )
      .messages({
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        "string.empty": "Password is required",
        "string.min": "Password must be at least 8 characters long",
      }),

    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Passwords do not match",
        "string.empty": "Please confirm your password",
      }),

    role: Joi.string().valid("user", "organizer").default("user").messages({
      "any.only": 'Role must be either "user" or "organizer"',
    }),
  });

  return validateRequest(req, res, schema) ? next() : undefined;
};

/**
 * Validation middleware for user login
 */
export const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().trim().lowercase().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),

    password: Joi.string().required().messages({
      "string.empty": "Password is required",
    }),
  });

  return validateRequest(req, res, schema) ? next() : undefined;
};

/**
 * Validation middleware for creating events
 */
export const validateEventCreation = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required().trim().messages({
      "string.empty": "Event name is required",
      "string.min": "Event name must be at least 3 characters long",
      "string.max": "Event name cannot exceed 100 characters",
    }),

    description: Joi.string().min(10).max(2000).required().trim().messages({
      "string.empty": "Event description is required",
      "string.min": "Event description must be at least 10 characters long",
      "string.max": "Event description cannot exceed 2000 characters",
    }),

    location: Joi.string().required().trim().messages({
      "string.empty": "Event location is required",
    }),

    imageUrl: Joi.string().uri().required().messages({
      "string.uri": "Image URL must be a valid URL",
      "string.empty": "Image URL is required",
    }),

    startDate: Joi.date().iso().greater("now").required().messages({
      "date.base": "Start date must be a valid date",
      "date.greater": "Start date must be in the future",
      "date.format": "Start date must be in ISO format (YYYY-MM-DD)",
    }),

    endDate: Joi.date().iso().min(Joi.ref("startDate")).required().messages({
      "date.base": "End date must be a valid date",
      "date.min": "End date must be after or equal to start date",
      "date.format": "End date must be in ISO format (YYYY-MM-DD)",
    }),

    category: Joi.array()
      .items(Joi.string().trim())
      .min(1)
      .required()
      .messages({
        "array.base": "Category must be an array",
        "array.min": "At least one category is required",
      }),
  });

  return validateRequest(req, res, schema) ? next() : undefined;
};

/**
 * Validation middleware for joining event
 */
export const validateEventJoin = (req, res, next) => {
  const schema = Joi.object({
    eventId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid event ID format",
        "string.empty": "Event ID is required",
      }),
  });

  return validateRequest(req, res, schema) ? next() : undefined;
};

/**
 * Validation middleware for OTP verification
 */
export const validateOtpVerification = (req, res, next) => {
  const schema = Joi.object({
    otp: Joi.string()
      .pattern(/^\d{4,6}$/)
      .required()
      .messages({
        "string.pattern.base": "OTP must be 4-6 digits",
        "string.empty": "OTP is required",
      }),

    eventId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid event ID format",
        "string.empty": "Event ID is required",
      }),
  });

  return validateRequest(req, res, schema) ? next() : undefined;
};

/**
 * Validation middleware for friend requests
 */
export const validateFriendRequest = (req, res, next) => {
  const schema = Joi.object({
    recipientId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid recipient ID format",
        "string.empty": "Recipient ID is required",
      }),

    lobbyId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid lobby ID format",
        "string.empty": "Lobby ID is required",
      }),
  });

  return validateRequest(req, res, schema) ? next() : undefined;
};

/**
 * Validation middleware for chat messages
 */
export const validateChatMessage = (req, res, next) => {
  const schema = Joi.object({
    content: Joi.string().trim().min(1).max(2000).required().messages({
      "string.empty": "Message content is required",
      "string.min": "Message content cannot be empty",
      "string.max": "Message cannot exceed 2000 characters",
    }),

    attachmentUrl: Joi.string().uri().allow(null, "").messages({
      "string.uri": "Attachment URL must be a valid URL",
    }),

    attachmentType: Joi.string()
      .valid("image", "document", "audio", null)
      .allow("")
      .messages({
        "any.only": "Attachment type must be image, document, audio, or null",
      }),
  });

  return validateRequest(req, res, schema) ? next() : undefined;
};

/**
 * Validation middleware for object IDs
 */
export const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const schema = Joi.object({
      [paramName]: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
          "string.pattern.base": `Invalid ${paramName} format`,
          "string.empty": `${paramName} is required`,
        }),
    });

    return validateRequest(req, res, schema, "params") ? next() : undefined;
  };
};

/**
 * Validation middleware for pagination parameters
 */
export const validatePagination = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      "number.base": "Page must be a number",
      "number.integer": "Page must be an integer",
      "number.min": "Page must be at least 1",
    }),

    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      "number.base": "Limit must be a number",
      "number.integer": "Limit must be an integer",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 100",
    }),

    sort: Joi.string().valid("asc", "desc").default("desc").messages({
      "any.only": 'Sort must be either "asc" or "desc"',
    }),
  });

  return validateRequest(req, res, schema, "query") ? next() : undefined;
};
