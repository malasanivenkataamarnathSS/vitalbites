const Joi = require('joi');

// Email validation schema
const emailSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

// OTP verification schema
const otpVerificationSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.length': 'OTP must be exactly 6 digits',
      'string.pattern.base': 'OTP must contain only numbers',
      'any.required': 'OTP is required'
    })
});

// Registration completion schema
const registrationSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  username: Joi.string()
    .pattern(/^[a-zA-Z\s]{2,50}$/)
    .required()
    .messages({
      'string.pattern.base': 'Name must contain only letters and spaces, and be 2-50 characters long',
      'any.required': 'Username is required'
    }),
  mobile: Joi.string()
    .pattern(/^\+91[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Mobile number must be in format +91XXXXXXXXXX and start with 6-9',
      'any.required': 'Mobile number is required'
    })
});

// Profile update schema
const profileUpdateSchema = Joi.object({
  username: Joi.string()
    .pattern(/^[a-zA-Z\s]{2,50}$/)
    .required()
    .messages({
      'string.pattern.base': 'Name must contain only letters and spaces, and be 2-50 characters long',
      'any.required': 'Username is required'
    }),
  gender: Joi.string()
    .valid('male', 'female', 'other')
    .allow(null, '')
    .optional()
    .messages({
      'any.only': 'Gender must be male, female, or other'
    }),
  dateOfBirth: Joi.date()
    .max('now')
    .allow(null, '')
    .optional()
    .messages({
      'date.max': 'Date of birth cannot be in the future'
    })
});

// Address schema
const addressSchema = Joi.object({
  fullName: Joi.string()
    .pattern(/^[a-zA-Z\s]{2,100}$/)
    .required()
    .messages({
      'string.pattern.base': 'Full name must contain only letters and spaces, and be 2-100 characters long',
      'any.required': 'Full name is required'
    }),
  mobile: Joi.string()
    .pattern(/^\+91[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Mobile number must be in format +91XXXXXXXXXX and start with 6-9',
      'any.required': 'Mobile number is required'
    }),
  street: Joi.string()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.min': 'Street address must be at least 5 characters long',
      'string.max': 'Street address must not exceed 200 characters',
      'any.required': 'Street address is required'
    }),
  city: Joi.string()
    .pattern(/^[a-zA-Z\s]{2,50}$/)
    .required()
    .messages({
      'string.pattern.base': 'City must contain only letters and spaces, and be 2-50 characters long',
      'any.required': 'City is required'
    }),
  state: Joi.string()
    .pattern(/^[a-zA-Z\s]{2,50}$/)
    .required()
    .messages({
      'string.pattern.base': 'State must contain only letters and spaces, and be 2-50 characters long',
      'any.required': 'State is required'
    }),
  pincode: Joi.string()
    .pattern(/^[1-9][0-9]{5}$/)
    .required()
    .messages({
      'string.pattern.base': 'Pincode must be a valid 6-digit Indian postal code',
      'any.required': 'Pincode is required'
    }),
  deliveryInstructions: Joi.string()
    .max(300)
    .optional()
    .allow('', null)
    .messages({
      'string.max': 'Delivery instructions must not exceed 300 characters'
    }),
  isDefault: Joi.boolean()
    .optional()
    .default(false)
});

module.exports = {
  emailSchema,
  otpVerificationSchema,
  registrationSchema,
  profileUpdateSchema,
  addressSchema
};