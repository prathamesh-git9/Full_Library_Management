const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const { authenticate, requireAdminOrLibrarian } = require('../middleware/auth');
const { validationResult } = require('express-validator');

/**
 * @swagger
 * components:
 *   schemas:
 *     Reservation:
 *       type: object
 *       required:
 *         - user
 *         - book
 *         - reservationDate
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the reservation
 *         user:
 *           type: string
 *           description: User ID who made the reservation
 *         book:
 *           type: string
 *           description: Book ID that was reserved
 *         reservationDate:
 *           type: string
 *           format: date-time
 *           description: Date when the reservation was made
 *         expiryDate:
 *           type: string
 *           format: date-time
 *           description: Date when the reservation expires
 *         status:
 *           type: string
 *           enum: [active, fulfilled, expired, cancelled]
 *           description: Current status of the reservation
 *         priority:
 *           type: integer
 *           description: Priority in the reservation queue
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Reservation creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Get all reservations
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of records per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, fulfilled, expired, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: book
 *         schema:
 *           type: string
 *         description: Filter by book ID
 *     responses:
 *       200:
 *         description: List of reservations retrieved successfully
 *       401:
 *         description: Unauthorized
 */
// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Private (Admin/Librarian only)
router.get('/', authenticate, requireAdminOrLibrarian, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = { isActive: true };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.user) filter.user = req.query.user;
    if (req.query.book) filter.book = req.query.book;
    
    const reservations = await Reservation.find(filter)
      .populate('user', 'firstName lastName email studentId')
      .populate('book', 'title author isbn coverImage')
      .populate('fulfilledBy', 'firstName lastName email')
      .sort({ reservationDate: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Reservation.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        reservations,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalReservations: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reservations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     summary: Get reservation by ID
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *     responses:
 *       200:
 *         description: Reservation retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reservation not found
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('user', 'firstName lastName email studentId')
      .populate('book', 'title author isbn coverImage')
      .populate('fulfilledBy', 'firstName lastName email');
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }
    
    // Check if user can access this reservation
    if (req.user.role !== 'admin' && req.user.role !== 'librarian' && 
        reservation.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { reservation }
    });
  } catch (error) {
    console.error('Get reservation by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reservation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Create a new reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookId
 *             properties:
 *               bookId:
 *                 type: string
 *                 description: ID of the book to reserve
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *       400:
 *         description: Invalid input or book available
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: User already has an active reservation for this book
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user._id;
    
    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: 'Book ID is required'
      });
    }
    
    const reservation = await Reservation.createReservation(userId, bookId);
    
    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('user', 'firstName lastName email studentId')
      .populate('book', 'title author isbn coverImage');
    
    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: { reservation: populatedReservation }
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    
    if (error.message === 'Book not found') {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }
    
    if (error.message === 'Book is available for immediate borrowing') {
      return res.status(400).json({
        success: false,
        message: 'Book is available for immediate borrowing'
      });
    }
    
    if (error.message === 'User already has an active reservation for this book') {
      return res.status(409).json({
        success: false,
        message: 'You already have an active reservation for this book'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create reservation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/reservations/{id}:
 *   delete:
 *     summary: Cancel a reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *     responses:
 *       200:
 *         description: Reservation cancelled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reservation not found
 *       400:
 *         description: Cannot cancel (reservation already fulfilled or expired)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }
    
    // Check if user can cancel this reservation
    if (req.user.role !== 'admin' && req.user.role !== 'librarian' && 
        reservation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    if (reservation.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active reservations can be cancelled'
      });
    }
    
    reservation.cancelReservation();
    await reservation.save();
    
    // Update book statistics
    const book = await Book.findById(reservation.book);
    if (book) {
      book.cancelReservation();
      await book.save();
    }
    
    // Update priorities for remaining reservations
    await Reservation.updateMany(
      {
        book: reservation.book,
        status: 'active',
        isActive: true,
        priority: { $gt: reservation.priority }
      },
      {
        $inc: { priority: -1 }
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel reservation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
