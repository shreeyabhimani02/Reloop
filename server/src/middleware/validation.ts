import {
  body,
  validationResult,
} from "express-validator";

import { Request, Response, NextFunction } from "express";

export const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage(
      "Name must be between 2 and 50 characters"
    ),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  body("password")
    .isString()
    .withMessage("Password must be a string")
    .isLength({ min: 6, max: 100 })
    .withMessage(
      "Password must be between 6 and 100 characters"
    ),

  body("location")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage(
      "Location cannot exceed 100 characters"
    ),
];

export const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  body("password")
    .isString()
    .notEmpty()
    .withMessage("Password is required"),
];

export function validateRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field:
          "path" in error
            ? error.path
            : "unknown",
        message: error.msg,
      })),
    });
  }

  next();
}