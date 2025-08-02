const Joi = require('joi');

// Order placement validation schema
const orderSchema = Joi.object({
  items: Joi.array()
    .items(Joi.object({
      menuItemId: Joi.string()
        .required()
        .messages({
          'any.required': 'Menu item ID is required'
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
        .required()
        .messages({
          'number.integer': 'Quantity must be a whole number',
          'number.min': 'Quantity must be at least 1',
          'number.max': 'Quantity cannot exceed 50 per item',
          'any.required': 'Quantity is required'
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
    }))
    .min(1)
    .max(20)
    .required()
    .messages({
      'array.min': 'At least one item is required',
      'array.max': 'Maximum 20 items allowed per order',
      'any.required': 'Order items are required'
    }),
  address: Joi.object({
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
      })
  })
    .required()
    .messages({
      'any.required': 'Delivery address is required'
    }),
  phone: Joi.string()
    .pattern(/^\+91[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be in format +91XXXXXXXXXX and start with 6-9',
      'any.required': 'Phone number is required'
    }),
  total: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Order total must be positive',
      'any.required': 'Order total is required'
    }),
  paymentMethod: Joi.string()
    .valid('cash', 'card', 'upi', 'wallet')
    .optional()
    .default('cash')
    .messages({
      'any.only': 'Payment method must be one of: cash, card, upi, wallet'
    }),
  specialInstructions: Joi.string()
    .max(500)
    .optional()
    .allow('', null)
    .messages({
      'string.max': 'Special instructions must not exceed 500 characters'
    })
});

// Order status update validation schema
const orderStatusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid('Pending', 'Processing', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled')
    .required()
    .messages({
      'any.only': 'Status must be one of: Pending, Processing, Confirmed, Preparing, Out for Delivery, Delivered, Cancelled',
      'any.required': 'Status is required'
    }),
  estimatedDeliveryTime: Joi.date()
    .min('now')
    .optional()
    .messages({
      'date.min': 'Estimated delivery time cannot be in the past'
    }),
  notes: Joi.string()
    .max(300)
    .optional()
    .allow('', null)
    .messages({
      'string.max': 'Notes must not exceed 300 characters'
    })
});

// Query parameters for order history
const orderQuerySchema = Joi.object({
  status: Joi.string()
    .valid('Pending', 'Processing', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled')
    .optional(),
  startDate: Joi.date()
    .optional(),
  endDate: Joi.date()
    .min(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.min': 'End date must be after start date'
    }),
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20)
});

module.exports = {
  orderSchema,
  orderStatusUpdateSchema,
  orderQuerySchema
};