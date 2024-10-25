const { body, param, query } = require('express-validator');

// Borrow book validation
const validateBorrowBook = [
  body('bookId')
    .isMongoId()
    .withMessage('Book ID must be a valid MongoDB ObjectId')
];

// Return book validation
const validateReturnBook = [
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// Borrow query validation
const validateBorrowQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(['borrowed', 'returned', 'overdue'])
    .withMessage('Status must be borrowed, returned, or overdue'),
  
  query('user')
    .optional()
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),
  
  query('book')
    .optional()
    .isMongoId()
    .withMessage('Book ID must be a valid MongoDB ObjectId'),
  
  query('sortBy')
    .optional()
    .isIn(['borrowDate', 'dueDate', 'returnDate', 'fineAmount', 'status'])
    .withMessage('Invalid sort field'),
  
  query('sort')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// User borrow history validation
const validateUserBorrowHistory = [
  param('userId')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Overdue borrows validation
const validateOverdueBorrows = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

module.exports = {
  validateBorrowBook,
  validateReturnBook,
  validateBorrowQuery,
  validateUserBorrowHistory,
  validateOverdueBorrows
};
