const Joi = require('joi');
const { createError } = require('../utils/errorUtils');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} source - Request source to validate ('body', 'params', 'query')
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[source], { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      return next(createError(400, errorMessage));
    }
    
    next();
  };
};

// Common validation schemas
const schemas = {
  // Auth schemas
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
  }),

  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Reset token is required'
    }),
    newPassword: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'New password is required'
    })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required'
    }),
    newPassword: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'New password is required'
    })
  }),

  // User schemas
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    realName: Joi.string().min(2).max(100).optional(),
    username: Joi.string().alphanum().min(3).max(30).optional(),
    interests: Joi.string().optional().allow(''),
    hobbies: Joi.string().optional().allow(''),
    loveLanguage: Joi.string().optional().allow(''),
    profilePicture: Joi.string().uri().optional().allow(''),
    dateOfBirth: Joi.date().iso().optional().allow(''),
    gender: Joi.string().valid('male', 'female', 'other', '').optional(),
    maritalStatus: Joi.string().optional().allow(''),
    height: Joi.string().optional(),
    complexion: Joi.string().optional(),
    bodySize: Joi.string().optional(),
    occupation: Joi.string().optional(),
    country: Joi.string().optional(),
    state: Joi.string().optional(),
    lga: Joi.string().optional(),
    contactNumber: Joi.string().optional(),
    email: Joi.string().email().optional()
  }),

  // Group call schemas
  createGroupCall: Joi.object({
    group_id: Joi.string().uuid().required().messages({
      'string.uuid': 'Group ID must be a valid UUID',
      'any.required': 'Group ID is required'
    }),
    call_type: Joi.string().valid('audio', 'video').optional().messages({
      'any.only': 'Call type must be either "audio" or "video"'
    }),
    metadata: Joi.object().optional()
  }),

  joinGroupCall: Joi.object({
    audio_enabled: Joi.boolean().optional(),
    video_enabled: Joi.boolean().optional()
  }),

  groupCallParams: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.uuid': 'Call ID must be a valid UUID',
      'any.required': 'Call ID is required'
    })
  })
};

module.exports = {
  validate,
  schemas
}; 