const { body, param, query } = require('express-validator');

// Comment creation validation
const validateCreateComment = [
  body('bookId')
    .isMongoId()
    .withMessage('Book ID must be a valid MongoDB ObjectId'),
  
  body('content')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
];

// Comment update validation
const validateUpdateComment = [
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
];

// Reply validation
const validateReply = [
  body('content')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reply must be between 5 and 500 characters')
];

// Comment query validation
const validateCommentQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'rating', 'likeCount', 'dislikeCount', 'netScore'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// User comments query validation
const validateUserCommentsQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

module.exports = {
  validateCreateComment,
  validateUpdateComment,
  validateReply,
  validateCommentQuery,
  validateUserCommentsQuery
};
