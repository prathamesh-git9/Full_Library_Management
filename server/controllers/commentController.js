const Comment = require('../models/Comment');
const Book = require('../models/Book');
const { validationResult } = require('express-validator');

// @desc    Get comments for a book
// @route   GET /api/comments/book/:bookId
// @access  Public
const getCommentsByBook = async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    
    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }
    
    const comments = await Comment.getCommentsByBook(bookId, {
      sortBy,
      sortOrder,
      limit,
      skip
    });
    
    const total = await Comment.countDocuments({
      book: bookId,
      isActive: true,
      isApproved: true
    });
    
    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalComments: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get comments by book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get user's comments
// @route   GET /api/comments/user/:userId
// @access  Private
const getUserComments = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check if user can access these comments
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
    
    const comments = await Comment.getUserComments(userId, {
      limit,
      skip
    });
    
    const total = await Comment.countDocuments({
      user: userId,
      isActive: true
    });
    
    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalComments: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get user comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user comments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Create a new comment
// @route   POST /api/comments
// @access  Private
const createComment = async (req, res) => {
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
    
    const { bookId, content, rating } = req.body;
    const userId = req.user._id;
    
    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }
    
    // Check if user already commented on this book
    const existingComment = await Comment.findOne({
      book: bookId,
      user: userId,
      isActive: true
    });
    
    if (existingComment) {
      return res.status(409).json({
        success: false,
        message: 'You have already commented on this book'
      });
    }
    
    // Create comment
    const comment = await Comment.create({
      book: bookId,
      user: userId,
      content,
      rating
    });
    
    // Populate the comment
    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'firstName lastName profileImage')
      .populate('book', 'title author');
    
    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: { comment: populatedComment }
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
const updateComment = async (req, res) => {
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
    
    const commentId = req.params.id;
    const { content, rating } = req.body;
    const userId = req.user._id;
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    // Check if user can edit this comment
    if (req.user.role !== 'admin' && req.user.role !== 'librarian' && 
        comment.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments'
      });
    }
    
    // Update comment
    comment.content = content;
    comment.rating = rating;
    comment.isEdited = true;
    comment.editedAt = new Date();
    
    await comment.save();
    
    // Populate the updated comment
    const updatedComment = await Comment.findById(commentId)
      .populate('user', 'firstName lastName profileImage')
      .populate('book', 'title author')
      .populate('replies.user', 'firstName lastName profileImage');
    
    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: { comment: updatedComment }
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user._id;
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    // Check if user can delete this comment
    if (req.user.role !== 'admin' && req.user.role !== 'librarian' && 
        comment.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }
    
    // Soft delete
    comment.isActive = false;
    await comment.save();
    
    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Like a comment
// @route   POST /api/comments/:id/like
// @access  Private
const likeComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user._id;
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    comment.likeComment(userId);
    await comment.save();
    
    res.status(200).json({
      success: true,
      message: 'Comment liked successfully',
      data: {
        likeCount: comment.likeCount,
        dislikeCount: comment.dislikeCount,
        netScore: comment.netScore
      }
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like comment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Dislike a comment
// @route   POST /api/comments/:id/dislike
// @access  Private
const dislikeComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user._id;
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    comment.dislikeComment(userId);
    await comment.save();
    
    res.status(200).json({
      success: true,
      message: 'Comment disliked successfully',
      data: {
        likeCount: comment.likeCount,
        dislikeCount: comment.dislikeCount,
        netScore: comment.netScore
      }
    });
  } catch (error) {
    console.error('Dislike comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dislike comment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Remove like/dislike from comment
// @route   DELETE /api/comments/:id/reaction
// @access  Private
const removeReaction = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user._id;
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    comment.removeReaction(userId);
    await comment.save();
    
    res.status(200).json({
      success: true,
      message: 'Reaction removed successfully',
      data: {
        likeCount: comment.likeCount,
        dislikeCount: comment.dislikeCount,
        netScore: comment.netScore
      }
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove reaction',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Add reply to comment
// @route   POST /api/comments/:id/reply
// @access  Private
const addReply = async (req, res) => {
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
    
    const commentId = req.params.id;
    const { content } = req.body;
    const userId = req.user._id;
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    comment.addReply(userId, content);
    await comment.save();
    
    // Populate the updated comment
    const updatedComment = await Comment.findById(commentId)
      .populate('user', 'firstName lastName profileImage')
      .populate('replies.user', 'firstName lastName profileImage');
    
    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      data: { comment: updatedComment }
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reply',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get comment statistics
// @route   GET /api/comments/stats
// @access  Private (Admin/Librarian only)
const getCommentStats = async (req, res) => {
  try {
    const [commentStats, ratingDistribution] = await Promise.all([
      Comment.getCommentStats(),
      Comment.getRatingDistribution()
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        commentStats: commentStats[0] || {},
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Get comment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comment statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get rating distribution for a book
// @route   GET /api/comments/rating-distribution/:bookId
// @access  Public
const getRatingDistribution = async (req, res) => {
  try {
    const bookId = req.params.bookId;
    
    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }
    
    const ratingDistribution = await Comment.getRatingDistribution(bookId);
    
    res.status(200).json({
      success: true,
      data: { ratingDistribution }
    });
  } catch (error) {
    console.error('Get rating distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rating distribution',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getCommentsByBook,
  getUserComments,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  dislikeComment,
  removeReaction,
  addReply,
  getCommentStats,
  getRatingDistribution
};
