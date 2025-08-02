const Joi = require('joi');

// Cart item validation schema
const cartItemSchema = Joi.object({
  id: Joi.string()
    .required()
    .messages({
      'any.required': 'Item ID is required'
    }),
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Item name must be at least 2 characters long',
      'string.max': 'Item name must not exceed 100 characters',
      'any.required': 'Item name is required'
    }),
  price: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Item price must be positive',
      'any.required': 'Item price is required'
    }),
  quantity: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .optional()
    .default(1)
    .messages({
      'number.integer': 'Quantity must be a whole number',
      'number.min': 'Quantity must be at least 1',
      'number.max': 'Quantity cannot exceed 50 per item'
    }),
  image: Joi.string()
    .uri()
    .optional()
    .allow('', null)
    .messages({
      'string.uri': 'Image must be a valid URL'
    }),
  restaurant: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Restaurant name must be at least 2 characters long',
      'string.max': 'Restaurant name must not exceed 100 characters'
    })
});

// Update quantity validation schema
const updateQuantitySchema = Joi.object({
  quantity: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .required()
    .messages({
      'number.integer': 'Quantity must be a whole number',
      'number.min': 'Quantity must be at least 1',
      'number.max': 'Quantity cannot exceed 50 per item',
      'any.required': 'Quantity is required'
    })
});

// Cart sync validation schema
const cartSyncSchema = Joi.object({
  items: Joi.array()
    .items(cartItemSchema)
    .max(20)
    .required()
    .messages({
      'array.max': 'Maximum 20 items allowed in cart',
      'any.required': 'Items array is required'
    })
});

module.exports = {
  cartItemSchema,
  updateQuantitySchema,
  cartSyncSchema
};