const mongoose = require('mongoose');
const config = require('../config');

const reservationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: [true, 'Book is required']
    },
    reservationDate: {
        type: Date,
        default: Date.now,
        required: [true, 'Reservation date is required']
    },
    expiryDate: {
        type: Date,
        required: [true, 'Expiry date is required']
    },
    status: {
        type: String,
        enum: ['active', 'fulfilled', 'expired', 'cancelled'],
        default: 'active'
    },
    priority: {
        type: Number,
        default: 1,
        min: [1, 'Priority must be at least 1']
    },
    fulfilledAt: {
        type: Date,
        default: null
    },
    fulfilledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for days until expiry
reservationSchema.virtual('daysUntilExpiry').get(function () {
    if (this.status !== 'active') return 0;

    const now = new Date();
    const expiryDate = new Date(this.expiryDate);
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
});

// Virtual for is expired
reservationSchema.virtual('isExpired').get(function () {
    return this.status === 'active' && new Date() > new Date(this.expiryDate);
});

// Indexes for better query performance
reservationSchema.index({ user: 1, status: 1 });
reservationSchema.index({ book: 1, status: 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ expiryDate: 1 });
reservationSchema.index({ reservationDate: -1 });
reservationSchema.index({ isActive: 1 });
reservationSchema.index({ priority: 1 });

// Compound index for unique active reservations
reservationSchema.index(
    { user: 1, book: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: 'active',
            isActive: true
        }
    }
);

// Pre-save middleware to calculate expiry date
reservationSchema.pre('save', function (next) {
    if (this.isNew && !this.expiryDate) {
        const reservationDate = new Date(this.reservationDate);
        this.expiryDate = new Date(reservationDate.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days
    }
    next();
});

// Pre-save middleware to update status based on expiry
reservationSchema.pre('save', function (next) {
    if (this.status === 'active' && this.isExpired) {
        this.status = 'expired';
    }
    next();
});

// Instance method to fulfill reservation
reservationSchema.methods.fulfillReservation = function (fulfilledBy) {
    if (this.status !== 'active') {
        throw new Error('Only active reservations can be fulfilled');
    }

    this.status = 'fulfilled';
    this.fulfilledAt = new Date();
    this.fulfilledBy = fulfilledBy;

    return this;
};

// Instance method to cancel reservation
reservationSchema.methods.cancelReservation = function () {
    if (this.status !== 'active') {
        throw new Error('Only active reservations can be cancelled');
    }

    this.status = 'cancelled';

    return this;
};

// Static method to find active reservations
reservationSchema.statics.findActiveReservations = function () {
    return this.find({
        status: 'active',
        isActive: true
    })
        .populate('user', 'firstName lastName email studentId')
        .populate('book', 'title author isbn coverImage')
        .sort({ priority: 1, reservationDate: 1 });
};

// Static method to find reservations by user
reservationSchema.statics.findReservationsByUser = function (userId, status = null) {
    const query = { user: userId, isActive: true };
    if (status) {
        query.status = status;
    }

    return this.find(query)
        .populate('book', 'title author isbn coverImage')
        .sort({ reservationDate: -1 });
};

// Static method to find reservations by book
reservationSchema.statics.findReservationsByBook = function (bookId, status = null) {
    const query = { book: bookId, isActive: true };
    if (status) {
        query.status = status;
    }

    return this.find(query)
        .populate('user', 'firstName lastName email studentId')
        .sort({ priority: 1, reservationDate: 1 });
};

// Static method to get reservation queue for a book
reservationSchema.statics.getReservationQueue = function (bookId) {
    return this.find({
        book: bookId,
        status: 'active',
        isActive: true
    })
        .populate('user', 'firstName lastName email studentId')
        .sort({ priority: 1, reservationDate: 1 });
};

// Static method to create reservation
reservationSchema.statics.createReservation = async function (userId, bookId) {
    // Check if book exists and is available
    const Book = mongoose.model('Book');
    const book = await Book.findById(bookId);

    if (!book) {
        throw new Error('Book not found');
    }

    if (book.isBookAvailable()) {
        throw new Error('Book is available for immediate borrowing');
    }

    // Check if user already has an active reservation for this book
    const existingReservation = await this.findOne({
        user: userId,
        book: bookId,
        status: 'active',
        isActive: true
    });

    if (existingReservation) {
        throw new Error('User already has an active reservation for this book');
    }

    // Get the next priority number
    const lastReservation = await this.findOne({
        book: bookId,
        status: 'active',
        isActive: true
    }).sort({ priority: -1 });

    const nextPriority = (lastReservation?.priority || 0) + 1;

    // Create reservation
    const reservation = await this.create({
        user: userId,
        book: bookId,
        priority: nextPriority
    });

    // Update book statistics
    book.reserveCopy();
    await book.save();

    return reservation;
};

// Static method to process reservation queue when book becomes available
reservationSchema.statics.processReservationQueue = async function (bookId) {
    const Book = mongoose.model('Book');
    const Borrow = mongoose.model('Borrow');
    const Notification = mongoose.model('Notification');

    const book = await Book.findById(bookId);
    if (!book || !book.isBookAvailable()) {
        return null;
    }

    // Get the next reservation in queue
    const nextReservation = await this.findOne({
        book: bookId,
        status: 'active',
        isActive: true
    }).sort({ priority: 1, reservationDate: 1 });

    if (!nextReservation) {
        return null;
    }

    // Fulfill the reservation
    nextReservation.fulfillReservation();
    await nextReservation.save();

    // Create borrow record
    const borrow = await Borrow.create({
        user: nextReservation.user,
        book: bookId,
        borrowedBy: nextReservation.user
    });

    // Update book availability
    book.borrowCopy();
    await book.save();

    // Create notification for user
    await Notification.createNotification({
        user: nextReservation.user,
        type: 'reservation_available',
        title: 'Reserved Book Available',
        message: `Your reserved book "${book.title}" is now available for pickup. You have 3 days to collect it.`,
        priority: 'high',
        relatedEntity: {
            type: 'reservation',
            id: nextReservation._id
        },
        metadata: {
            bookTitle: book.title,
            borrowId: borrow._id
        }
    });

    // Update priorities for remaining reservations
    await this.updateMany(
        {
            book: bookId,
            status: 'active',
            isActive: true,
            priority: { $gt: nextReservation.priority }
        },
        {
            $inc: { priority: -1 }
        }
    );

    return {
        reservation: nextReservation,
        borrow: borrow
    };
};

// Static method to get reservation statistics
reservationSchema.statics.getReservationStats = function () {
    return this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
};

// Static method to get expired reservations
reservationSchema.statics.getExpiredReservations = function () {
    return this.find({
        status: 'active',
        expiryDate: { $lt: new Date() },
        isActive: true
    })
        .populate('user', 'firstName lastName email')
        .populate('book', 'title author isbn');
};

// Static method to cleanup expired reservations
reservationSchema.statics.cleanupExpiredReservations = async function () {
    const expiredReservations = await this.getExpiredReservations();

    for (const reservation of expiredReservations) {
        reservation.status = 'expired';
        await reservation.save();

        // Update book statistics
        const Book = mongoose.model('Book');
        const book = await Book.findById(reservation.book);
        if (book) {
            book.cancelReservation();
            await book.save();
        }

        // Update priorities for remaining reservations
        await this.updateMany(
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
    }

    return expiredReservations.length;
};

module.exports = mongoose.model('Reservation', reservationSchema);
