const Borrow = require('../models/Borrow');
const Book = require('../models/Book');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const config = require('../config');

// @desc    Get all borrow records
// @route   GET /api/borrows
// @access  Private (Admin/Librarian only)
const getBorrows = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = { isActive: true };
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.user) {
      filter.user = req.query.user;
    }
    
    if (req.query.book) {
      filter.book = req.query.book;
    }
    
    // Build sort object
    let sort = { borrowDate: -1 };
    if (req.query.sortBy) {
      const sortOrder = req.query.sort === 'desc' ? -1 : 1;
      sort = { [req.query.sortBy]: sortOrder };
    }
    
    const borrows = await Borrow.find(filter)
      .populate('user', 'firstName lastName email studentId')
      .populate('book', 'title author isbn coverImage')
      .populate('borrowedBy', 'firstName lastName email')
      .populate('returnedBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await Borrow.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        borrows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalBorrows: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get borrows error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch borrow records',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get borrow record by ID
// @route   GET /api/borrows/:id
// @access  Private
const getBorrowById = async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.id)
      .populate('user', 'firstName lastName email studentId')
      .populate('book', 'title author isbn coverImage')
      .populate('borrowedBy', 'firstName lastName email')
      .populate('returnedBy', 'firstName lastName email')
      .populate('renewalHistory.renewedBy', 'firstName lastName email');
    
    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: 'Borrow record not found'
      });
    }
    
    // Check if user can access this record
    if (req.user.role !== 'admin' && req.user.role !== 'librarian' && 
        borrow.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { borrow }
    });
  } catch (error) {
    console.error('Get borrow by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch borrow record',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Borrow a book
// @route   POST /api/borrows
// @access  Private
const borrowBook = async (req, res) => {
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
    
    const { bookId } = req.body;
    const userId = req.user._id;
    
    // Check if book exists and is available
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }
    
    if (!book.isBookAvailable()) {
      return res.status(400).json({
        success: false,
        message: 'Book is not available for borrowing'
      });
    }
    
    // Check if user already has this book borrowed
    const existingBorrow = await Borrow.findOne({
      user: userId,
      book: bookId,
      status: 'borrowed',
      isActive: true
    });
    
    if (existingBorrow) {
      return res.status(409).json({
        success: false,
        message: 'You already have this book borrowed'
      });
    }
    
    // Check if user has too many books borrowed (limit to 5)
    const userBorrowCount = await Borrow.countDocuments({
      user: userId,
      status: 'borrowed',
      isActive: true
    });
    
    if (userBorrowCount >= 5) {
      return res.status(400).json({
        success: false,
        message: 'You have reached the maximum borrowing limit (5 books)'
      });
    }
    
    // Create borrow record
    const borrow = await Borrow.create({
      user: userId,
      book: bookId,
      borrowedBy: userId
    });
    
    // Update book availability
    book.borrowCopy();
    await book.save();
    
    // Populate the borrow record
    const populatedBorrow = await Borrow.findById(borrow._id)
      .populate('user', 'firstName lastName email studentId')
      .populate('book', 'title author isbn coverImage')
      .populate('borrowedBy', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      message: 'Book borrowed successfully',
      data: { borrow: populatedBorrow }
    });
  } catch (error) {
    console.error('Borrow book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to borrow book',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Return a borrowed book
// @route   POST /api/borrows/:id/return
// @access  Private
const returnBook = async (req, res) => {
  try {
    const borrowId = req.params.id;
    const { notes } = req.body;
    
    const borrow = await Borrow.findById(borrowId);
    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: 'Borrow record not found'
      });
    }
    
    // Check if user can return this book
    if (req.user.role !== 'admin' && req.user.role !== 'librarian' && 
        borrow.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    if (borrow.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'Book is already returned'
      });
    }
    
    // Return the book
    borrow.returnBook(req.user._id, notes);
    await borrow.save();
    
    // Update book availability
    const book = await Book.findById(borrow.book);
    if (book) {
      book.returnCopy();
      await book.save();
    }
    
    // Populate the updated borrow record
    const updatedBorrow = await Borrow.findById(borrowId)
      .populate('user', 'firstName lastName email studentId')
      .populate('book', 'title author isbn coverImage')
      .populate('borrowedBy', 'firstName lastName email')
      .populate('returnedBy', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      message: 'Book returned successfully',
      data: { borrow: updatedBorrow }
    });
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to return book',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Renew a borrowed book
// @route   POST /api/borrows/:id/renew
// @access  Private
const renewBook = async (req, res) => {
  try {
    const borrowId = req.params.id;
    
    const borrow = await Borrow.findById(borrowId);
    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: 'Borrow record not found'
      });
    }
    
    // Check if user can renew this book
    if (req.user.role !== 'admin' && req.user.role !== 'librarian' && 
        borrow.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    if (!borrow.canRenew) {
      return res.status(400).json({
        success: false,
        message: 'Book cannot be renewed. Check if you have reached maximum renewals or if the book is overdue.'
      });
    }
    
    // Renew the book
    borrow.renewBook(req.user._id);
    await borrow.save();
    
    // Populate the updated borrow record
    const updatedBorrow = await Borrow.findById(borrowId)
      .populate('user', 'firstName lastName email studentId')
      .populate('book', 'title author isbn coverImage')
      .populate('borrowedBy', 'firstName lastName email')
      .populate('renewalHistory.renewedBy', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      message: 'Book renewed successfully',
      data: { borrow: updatedBorrow }
    });
  } catch (error) {
    console.error('Renew book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to renew book',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get user's borrow history
// @route   GET /api/borrows/user/:userId
// @access  Private
const getUserBorrowHistory = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check if user can access this history
    if (req.user.role !== 'admin' && req.user.role !== 'librarian' && 
        userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const borrows = await Borrow.find({ user: userId, isActive: true })
      .populate('book', 'title author isbn coverImage')
      .sort({ borrowDate: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Borrow.countDocuments({ user: userId, isActive: true });
    
    res.status(200).json({
      success: true,
      data: {
        borrows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalBorrows: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get user borrow history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user borrow history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get overdue borrows
// @route   GET /api/borrows/overdue
// @access  Private (Admin/Librarian only)
const getOverdueBorrows = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const borrows = await Borrow.findOverdueBorrows()
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Borrow.countDocuments({
      status: 'borrowed',
      dueDate: { $lt: new Date() },
      isActive: true
    });
    
    res.status(200).json({
      success: true,
      data: {
        borrows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalOverdue: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get overdue borrows error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue borrows',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get borrow statistics
// @route   GET /api/borrows/stats
// @access  Private (Admin/Librarian only)
const getBorrowStats = async (req, res) => {
  try {
    const [borrowStats, overdueStats] = await Promise.all([
      Borrow.getBorrowStats(),
      Borrow.getOverdueStats()
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        borrowStats,
        overdueStats: overdueStats[0] || {}
      }
    });
  } catch (error) {
    console.error('Get borrow stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch borrow statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getBorrows,
  getBorrowById,
  borrowBook,
  returnBook,
  renewBook,
  getUserBorrowHistory,
  getOverdueBorrows,
  getBorrowStats
};
