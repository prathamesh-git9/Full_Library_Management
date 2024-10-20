const { body, param, query } = require('express-validator');

// Book creation/update validation
const validateBook = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('author')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Author must be between 1 and 100 characters'),
  
  body('isbn')
    .trim()
    .matches(/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/)
    .withMessage('Please enter a valid ISBN'),
  
  body('category')
    .isIn([
      'Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Biography',
      'Philosophy', 'Religion', 'Art', 'Music', 'Literature', 'Poetry', 'Drama',
      'Reference', 'Textbook', 'Children', 'Young Adult', 'Mystery', 'Romance',
      'Fantasy', 'Science Fiction', 'Horror', 'Thriller', 'Comedy', 'Travel',
      'Cooking', 'Health', 'Sports', 'Business', 'Economics', 'Politics',
      'Education', 'Psychology', 'Sociology', 'Mathematics', 'Physics',
      'Chemistry', 'Biology', 'Medicine', 'Engineering', 'Computer Science', 'Other'
    ])
    .withMessage('Please select a valid category'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  
  body('totalCopies')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Total copies must be between 1 and 1000'),
  
  body('availableCopies')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available copies cannot be negative'),
  
  body('publishedYear')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage('Published year must be between 1000 and current year'),
  
  body('publisher')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Publisher name cannot exceed 100 characters'),
  
  body('language')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Language cannot exceed 50 characters'),
  
  body('pages')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Pages must be between 1 and 10000'),
  
  body('edition')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Edition cannot exceed 50 characters'),
  
  body('volume')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Volume cannot exceed 50 characters'),
  
  body('series')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Series name cannot exceed 100 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag cannot exceed 50 characters'),
  
  body('location.shelf')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Shelf cannot exceed 20 characters'),
  
  body('location.section')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Section cannot exceed 50 characters'),
  
  body('location.floor')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Floor must be between 1 and 10'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price cannot be negative'),
  
  body('coverImage')
    .optional()
    .isURL()
    .withMessage('Cover image must be a valid URL'),
  
  body('pdfFile')
    .optional()
    .isURL()
    .withMessage('PDF file must be a valid URL')
];

// Book update validation (all fields optional)
const validateBookUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('author')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Author must be between 1 and 100 characters'),
  
  body('isbn')
    .optional()
    .trim()
    .matches(/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/)
    .withMessage('Please enter a valid ISBN'),
  
  body('category')
    .optional()
    .isIn([
      'Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Biography',
      'Philosophy', 'Religion', 'Art', 'Music', 'Literature', 'Poetry', 'Drama',
      'Reference', 'Textbook', 'Children', 'Young Adult', 'Mystery', 'Romance',
      'Fantasy', 'Science Fiction', 'Horror', 'Thriller', 'Comedy', 'Travel',
      'Cooking', 'Health', 'Sports', 'Business', 'Economics', 'Politics',
      'Education', 'Psychology', 'Sociology', 'Mathematics', 'Physics',
      'Chemistry', 'Biology', 'Medicine', 'Engineering', 'Computer Science', 'Other'
    ])
    .withMessage('Please select a valid category'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  
  body('totalCopies')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Total copies must be between 1 and 1000'),
  
  body('availableCopies')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available copies cannot be negative'),
  
  body('publishedYear')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage('Published year must be between 1000 and current year'),
  
  body('publisher')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Publisher name cannot exceed 100 characters'),
  
  body('language')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Language cannot exceed 50 characters'),
  
  body('pages')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Pages must be between 1 and 10000'),
  
  body('edition')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Edition cannot exceed 50 characters'),
  
  body('volume')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Volume cannot exceed 50 characters'),
  
  body('series')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Series name cannot exceed 100 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag cannot exceed 50 characters'),
  
  body('location.shelf')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Shelf cannot exceed 20 characters'),
  
  body('location.section')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Section cannot exceed 50 characters'),
  
  body('location.floor')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Floor must be between 1 and 10'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price cannot be negative'),
  
  body('coverImage')
    .optional()
    .isURL()
    .withMessage('Cover image must be a valid URL'),
  
  body('pdfFile')
    .optional()
    .isURL()
    .withMessage('PDF file must be a valid URL')
];

// Book query validation
const validateBookQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('category')
    .optional()
    .isIn([
      'Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Biography',
      'Philosophy', 'Religion', 'Art', 'Music', 'Literature', 'Poetry', 'Drama',
      'Reference', 'Textbook', 'Children', 'Young Adult', 'Mystery', 'Romance',
      'Fantasy', 'Science Fiction', 'Horror', 'Thriller', 'Comedy', 'Travel',
      'Cooking', 'Health', 'Sports', 'Business', 'Economics', 'Politics',
      'Education', 'Psychology', 'Sociology', 'Mathematics', 'Physics',
      'Chemistry', 'Biology', 'Medicine', 'Engineering', 'Computer Science', 'Other'
    ])
    .withMessage('Invalid category'),
  
  query('author')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Author search term cannot exceed 100 characters'),
  
  query('available')
    .optional()
    .isBoolean()
    .withMessage('Available filter must be a boolean'),
  
  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Minimum rating must be between 0 and 5'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters'),
  
  query('sortBy')
    .optional()
    .isIn(['title', 'author', 'publishedYear', 'createdAt', 'statistics.averageRating', 'statistics.totalBorrows'])
    .withMessage('Invalid sort field'),
  
  query('sort')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Search validation
const validateBookSearch = [
  query('q')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('category')
    .optional()
    .isIn([
      'Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Biography',
      'Philosophy', 'Religion', 'Art', 'Music', 'Literature', 'Poetry', 'Drama',
      'Reference', 'Textbook', 'Children', 'Young Adult', 'Mystery', 'Romance',
      'Fantasy', 'Science Fiction', 'Horror', 'Thriller', 'Comedy', 'Travel',
      'Cooking', 'Health', 'Sports', 'Business', 'Economics', 'Politics',
      'Education', 'Psychology', 'Sociology', 'Mathematics', 'Physics',
      'Chemistry', 'Biology', 'Medicine', 'Engineering', 'Computer Science', 'Other'
    ])
    .withMessage('Invalid category'),
  
  query('available')
    .optional()
    .isBoolean()
    .withMessage('Available filter must be a boolean'),
  
  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Minimum rating must be between 0 and 5')
];

module.exports = {
  validateBook,
  validateBookUpdate,
  validateBookQuery,
  validateBookSearch
};
