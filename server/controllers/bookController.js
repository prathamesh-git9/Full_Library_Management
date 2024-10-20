const Book = require('../models/Book');
const { validationResult } = require('express-validator');

// @desc    Get all books
// @route   GET /api/books
// @access  Public
const getBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = { isActive: true };
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.author) {
      filter.author = { $regex: req.query.author, $options: 'i' };
    }
    
    if (req.query.available !== undefined) {
      if (req.query.available === 'true') {
        filter.availableCopies = { $gt: 0 };
      } else {
        filter.availableCopies = 0;
      }
    }
    
    if (req.query.minRating) {
      filter['statistics.averageRating'] = { $gte: parseFloat(req.query.minRating) };
    }
    
    // Build sort object
    let sort = { createdAt: -1 };
    if (req.query.sortBy) {
      const sortOrder = req.query.sort === 'desc' ? -1 : 1;
      sort = { [req.query.sortBy]: sortOrder };
    }
    
    // Search functionality
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { author: { $regex: req.query.search, $options: 'i' } },
        { isbn: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }
    
    const books = await Book.find(filter)
      .populate('addedBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await Book.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        books,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalBooks: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get book by ID
// @route   GET /api/books/:id
// @access  Public
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('addedBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email');
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { book }
    });
  } catch (error) {
    console.error('Get book by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Create new book
// @route   POST /api/books
// @access  Private (Admin/Librarian only)
const createBook = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const bookData = {
      ...req.body,
      addedBy: req.user._id,
      lastModifiedBy: req.user._id
    };
    
    const book = await Book.create(bookData);
    
    const populatedBook = await Book.findById(book._id)
      .populate('addedBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: { book: populatedBook }
    });
  } catch (error) {
    console.error('Create book error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Book with this ISBN already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create book',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private (Admin/Librarian only)
const updateBook = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }
    
    // Update book data
    const updateData = {
      ...req.body,
      lastModifiedBy: req.user._id
    };
    
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('addedBy', 'firstName lastName email')
     .populate('lastModifiedBy', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: { book: updatedBook }
    });
  } catch (error) {
    console.error('Update book error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Book with this ISBN already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update book',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Admin only)
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }
    
    // Soft delete - set isActive to false
    book.isActive = false;
    book.lastModifiedBy = req.user._id;
    await book.save();
    
    res.status(200).json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete book',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get popular books
// @route   GET /api/books/popular
// @access  Public
const getPopularBooks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const books = await Book.getPopularBooks(limit);
    
    res.status(200).json({
      success: true,
      data: { books }
    });
  } catch (error) {
    console.error('Get popular books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular books',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get recently added books
// @route   GET /api/books/recent
// @access  Public
const getRecentlyAddedBooks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const books = await Book.getRecentlyAddedBooks(limit);
    
    res.status(200).json({
      success: true,
      data: { books }
    });
  } catch (error) {
    console.error('Get recently added books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recently added books',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get book statistics
// @route   GET /api/books/stats
// @access  Private (Admin/Librarian only)
const getBookStats = async (req, res) => {
  try {
    const [bookStats, categoryStats] = await Promise.all([
      Book.getBookStats(),
      Book.getCategoryStats()
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        bookStats: bookStats[0] || {},
        categoryStats
      }
    });
  } catch (error) {
    console.error('Get book stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Search books
// @route   GET /api/books/search
// @access  Public
const searchBooks = async (req, res) => {
  try {
    const { q: query, ...options } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const books = await Book.searchBooks(query, options);
    
    res.status(200).json({
      success: true,
      data: { books }
    });
  } catch (error) {
    console.error('Search books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search books',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getPopularBooks,
  getRecentlyAddedBooks,
  getBookStats,
  searchBooks
};
