const express = require('express');
const router = express.Router();
const {
    generateBookQRCode,
    generateBookBarcode,
    generateUserQRCode,
    generateLibraryCardBarcode,
    generateBorrowQRCode,
    generateReservationQRCode,
    generateBulkBookQRCodes,
    generateLibraryCard
} = require('../utils/barcodeGenerator');
const { authenticate, requireAdminOrLibrarian } = require('../middleware/auth');
const Book = require('../models/Book');
const User = require('../models/User');
const Borrow = require('../models/Borrow');
const Reservation = require('../models/Reservation');

/**
 * @swagger
 * /api/barcode/book/{bookId}/qr:
 *   get:
 *     summary: Generate QR code for a book
 *     tags: [Barcode]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID
 *     responses:
 *       200:
 *         description: QR code generated successfully
 *       404:
 *         description: Book not found
 */
router.get('/book/:bookId/qr', authenticate, async (req, res) => {
    try {
        const book = await Book.findById(req.params.bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        const qrCode = await generateBookQRCode(book._id, book.title);

        res.status(200).json({
            success: true,
            data: {
                qrCode,
                book: {
                    id: book._id,
                    title: book.title,
                    isbn: book.isbn
                }
            }
        });
    } catch (error) {
        console.error('Generate book QR code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate QR code',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /api/barcode/book/{bookId}/barcode:
 *   get:
 *     summary: Generate barcode for a book
 *     tags: [Barcode]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID
 *     responses:
 *       200:
 *         description: Barcode generated successfully
 *       404:
 *         description: Book not found
 */
router.get('/book/:bookId/barcode', authenticate, async (req, res) => {
    try {
        const book = await Book.findById(req.params.bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        const barcode = generateBookBarcode(book.isbn);

        res.status(200).json({
            success: true,
            data: {
                barcode,
                book: {
                    id: book._id,
                    title: book.title,
                    isbn: book.isbn
                }
            }
        });
    } catch (error) {
        console.error('Generate book barcode error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate barcode',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /api/barcode/user/{userId}/qr:
 *   get:
 *     summary: Generate QR code for a user
 *     tags: [Barcode]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: QR code generated successfully
 *       404:
 *         description: User not found
 */
router.get('/user/:userId/qr', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const qrCode = await generateUserQRCode(user._id, user);

        res.status(200).json({
            success: true,
            data: {
                qrCode,
                user: {
                    id: user._id,
                    name: `${user.firstName} ${user.lastName}`,
                    studentId: user.studentId,
                    email: user.email
                }
            }
        });
    } catch (error) {
        console.error('Generate user QR code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate QR code',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /api/barcode/user/{userId}/library-card:
 *   get:
 *     summary: Generate library card with QR code and barcode
 *     tags: [Barcode]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Library card generated successfully
 *       404:
 *         description: User not found
 */
router.get('/user/:userId/library-card', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const libraryCard = await generateLibraryCard(user);

        res.status(200).json({
            success: true,
            data: libraryCard
        });
    } catch (error) {
        console.error('Generate library card error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate library card',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /api/barcode/borrow/{borrowId}/qr:
 *   get:
 *     summary: Generate QR code for a borrow transaction
 *     tags: [Barcode]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: borrowId
 *         required: true
 *         schema:
 *           type: string
 *         description: Borrow ID
 *     responses:
 *       200:
 *         description: QR code generated successfully
 *       404:
 *         description: Borrow record not found
 */
router.get('/borrow/:borrowId/qr', authenticate, async (req, res) => {
    try {
        const borrow = await Borrow.findById(req.params.borrowId)
            .populate('book', 'title')
            .populate('user', 'firstName lastName');

        if (!borrow) {
            return res.status(404).json({
                success: false,
                message: 'Borrow record not found'
            });
        }

        const qrCode = await generateBorrowQRCode(
            borrow._id,
            borrow.book.title,
            borrow.dueDate
        );

        res.status(200).json({
            success: true,
            data: {
                qrCode,
                borrow: {
                    id: borrow._id,
                    book: borrow.book.title,
                    user: `${borrow.user.firstName} ${borrow.user.lastName}`,
                    dueDate: borrow.dueDate
                }
            }
        });
    } catch (error) {
        console.error('Generate borrow QR code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate QR code',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /api/barcode/reservation/{reservationId}/qr:
 *   get:
 *     summary: Generate QR code for a reservation
 *     tags: [Barcode]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *     responses:
 *       200:
 *         description: QR code generated successfully
 *       404:
 *         description: Reservation not found
 */
router.get('/reservation/:reservationId/qr', authenticate, async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.reservationId)
            .populate('book', 'title')
            .populate('user', 'firstName lastName');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        const qrCode = await generateReservationQRCode(
            reservation._id,
            reservation.book.title,
            reservation.priority
        );

        res.status(200).json({
            success: true,
            data: {
                qrCode,
                reservation: {
                    id: reservation._id,
                    book: reservation.book.title,
                    user: `${reservation.user.firstName} ${reservation.user.lastName}`,
                    priority: reservation.priority
                }
            }
        });
    } catch (error) {
        console.error('Generate reservation QR code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate QR code',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /api/barcode/books/bulk-qr:
 *   post:
 *     summary: Generate QR codes for multiple books
 *     tags: [Barcode]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookIds
 *             properties:
 *               bookIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of book IDs
 *     responses:
 *       200:
 *         description: QR codes generated successfully
 *       400:
 *         description: Invalid request
 */
router.post('/books/bulk-qr', authenticate, requireAdminOrLibrarian, async (req, res) => {
    try {
        const { bookIds } = req.body;

        if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Book IDs array is required'
            });
        }

        const books = await Book.find({
            _id: { $in: bookIds },
            isActive: true
        });

        if (books.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No books found'
            });
        }

        const qrCodes = await generateBulkBookQRCodes(books);

        res.status(200).json({
            success: true,
            data: {
                qrCodes,
                totalGenerated: qrCodes.length
            }
        });
    } catch (error) {
        console.error('Generate bulk QR codes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate QR codes',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;
