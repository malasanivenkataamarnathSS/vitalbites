const Joi = require('joi');

// Menu item validation schema
const menuItemSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Menu item name must be at least 2 characters long',
      'string.max': 'Menu item name must not exceed 100 characters',
      'any.required': 'Menu item name is required'
    }),
  description: Joi.string()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description must not exceed 500 characters',
      'any.required': 'Description is required'
    }),
  price: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Price must be a positive number',
      'any.required': 'Price is required'
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
    .required()
    .messages({
      'string.min': 'Restaurant name must be at least 2 characters long',
      'string.max': 'Restaurant name must not exceed 100 characters',
      'any.required': 'Restaurant name is required'
    }),
  category: Joi.string()
    .valid('appetizer', 'main-course', 'dessert', 'beverage', 'snacks', 'pizza', 'burger', 'indian', 'chinese', 'italian', 'other')
    .optional()
    .default('other')
    .messages({
      'any.only': 'Category must be one of: appetizer, main-course, dessert, beverage, snacks, pizza, burger, indian, chinese, italian, other'
    }),
  available: Joi.boolean()
    .optional()
    .default(true),
  preparationTime: Joi.number()
    .integer()
    .min(5)
    .max(120)
    .optional()
    .messages({
      'number.integer': 'Preparation time must be a whole number',
      'number.min': 'Preparation time must be at least 5 minutes',
      'number.max': 'Preparation time must not exceed 120 minutes'
    }),
  tags: Joi.array()
    .items(Joi.string().min(2).max(20))
    .max(5)
    .optional()
    .messages({
      'array.max': 'Maximum 5 tags allowed'
    })
});

// Menu item update schema (allows partial updates)
const menuItemUpdateSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Menu item name must be at least 2 characters long',
      'string.max': 'Menu item name must not exceed 100 characters'
    }),
  description: Joi.string()
    .min(10)
    .max(500)
    .optional()
    .messages({
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description must not exceed 500 characters'
    }),
  price: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.positive': 'Price must be a positive number'
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
    }),
  category: Joi.string()
    .valid('appetizer', 'main-course', 'dessert', 'beverage', 'snacks', 'pizza', 'burger', 'indian', 'chinese', 'italian', 'other')
    .optional()
    .messages({
      'any.only': 'Category must be one of: appetizer, main-course, dessert, beverage, snacks, pizza, burger, indian, chinese, italian, other'
    }),
  available: Joi.boolean()
    .optional(),
  preparationTime: Joi.number()
    .integer()
    .min(5)
    .max(120)
    .optional()
    .messages({
      'number.integer': 'Preparation time must be a whole number',
      'number.min': 'Preparation time must be at least 5 minutes',
      'number.max': 'Preparation time must not exceed 120 minutes'
    }),
  tags: Joi.array()
    .items(Joi.string().min(2).max(20))
    .max(5)
    .optional()
    .messages({
      'array.max': 'Maximum 5 tags allowed'
    })
});

// Query parameters validation
const menuQuerySchema = Joi.object({
  category: Joi.string()
    .valid('appetizer', 'main-course', 'dessert', 'beverage', 'snacks', 'pizza', 'burger', 'indian', 'chinese', 'italian', 'other')
    .optional(),
  restaurant: Joi.string()
    .min(2)
    .max(100)
    .optional(),
  available: Joi.boolean()
    .optional(),
  minPrice: Joi.number()
    .positive()
    .optional(),
  maxPrice: Joi.number()
    .positive()
    .optional(),
  search: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Search term must be at least 2 characters long',
      'string.max': 'Search term must not exceed 50 characters'
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
  menuItemSchema,
  menuItemUpdateSchema,
  menuQuerySchema
};