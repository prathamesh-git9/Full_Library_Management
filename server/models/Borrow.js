const mongoose = require('mongoose');
const config = require('../config');

const borrowSchema = new mongoose.Schema({
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
  borrowDate: {
    type: Date,
    default: Date.now,
    required: [true, 'Borrow date is required']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  returnDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['borrowed', 'returned', 'overdue'],
    default: 'borrowed'
  },
  fineAmount: {
    type: Number,
    default: 0,
    min: [0, 'Fine amount cannot be negative']
  },
  finePaid: {
    type: Boolean,
    default: false
  },
  finePaidDate: {
    type: Date,
    default: null
  },
  renewals: {
    type: Number,
    default: 0,
    min: [0, 'Renewals cannot be negative'],
    max: [config.MAX_RENEWALS, `Maximum renewals allowed is ${config.MAX_RENEWALS}`]
  },
  renewalHistory: [{
    renewalDate: {
      type: Date,
      default: Date.now
    },
    newDueDate: Date,
    renewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  borrowedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  returnedBy: {
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

// Virtual for days overdue
borrowSchema.virtual('daysOverdue').get(function() {
  if (this.status === 'returned' || this.status === 'borrowed') {
    return 0;
  }
  
  const now = new Date();
  const dueDate = new Date(this.dueDate);
  const diffTime = now - dueDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
});

// Virtual for calculated fine
borrowSchema.virtual('calculatedFine').get(function() {
  if (this.status === 'returned' || this.finePaid) {
    return 0;
  }
  
  const daysOverdue = this.daysOverdue;
  if (daysOverdue <= 0) {
    return 0;
  }
  
  const fine = daysOverdue * config.FINE_PER_DAY;
  return Math.min(fine, config.MAX_FINE_AMOUNT);
});

// Virtual for can renew
borrowSchema.virtual('canRenew').get(function() {
  return this.status === 'borrowed' && 
         this.renewals < config.MAX_RENEWALS &&
         new Date() < new Date(this.dueDate);
});

// Indexes for better query performance
borrowSchema.index({ user: 1, status: 1 });
borrowSchema.index({ book: 1, status: 1 });
borrowSchema.index({ status: 1 });
borrowSchema.index({ dueDate: 1 });
borrowSchema.index({ borrowDate: -1 });
borrowSchema.index({ isActive: 1 });
borrowSchema.index({ fineAmount: 1 });
borrowSchema.index({ user: 1, book: 1, status: 1 });

// Compound index for unique active borrows
borrowSchema.index(
  { user: 1, book: 1, status: 1 },
  { 
    unique: true, 
    partialFilterExpression: { 
      status: 'borrowed',
      isActive: true
    }
  }
);

// Pre-save middleware to calculate due date
borrowSchema.pre('save', function(next) {
  if (this.isNew && !this.dueDate) {
    const borrowDate = new Date(this.borrowDate);
    this.dueDate = new Date(borrowDate.getTime() + (config.BORROW_DURATION_DAYS * 24 * 60 * 60 * 1000));
  }
  next();
});

// Pre-save middleware to update status based on dates
borrowSchema.pre('save', function(next) {
  if (this.status === 'borrowed' && !this.returnDate) {
    const now = new Date();
    const dueDate = new Date(this.dueDate);
    
    if (now > dueDate) {
      this.status = 'overdue';
      // Calculate fine if overdue
      const daysOverdue = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
      this.fineAmount = Math.min(daysOverdue * config.FINE_PER_DAY, config.MAX_FINE_AMOUNT);
    }
  }
  next();
});

// Instance method to calculate fine
borrowSchema.methods.calculateFine = function() {
  if (this.status === 'returned' || this.finePaid) {
    return 0;
  }
  
  const now = new Date();
  const dueDate = new Date(this.dueDate);
  
  if (now <= dueDate) {
    return 0;
  }
  
  const daysOverdue = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
  const fine = daysOverdue * config.FINE_PER_DAY;
  
  return Math.min(fine, config.MAX_FINE_AMOUNT);
};

// Instance method to renew book
borrowSchema.methods.renewBook = function(renewedBy) {
  if (!this.canRenew) {
    throw new Error('Book cannot be renewed');
  }
  
  const oldDueDate = new Date(this.dueDate);
  const newDueDate = new Date(oldDueDate.getTime() + (config.RENEWAL_DURATION_DAYS * 24 * 60 * 60 * 1000));
  
  this.dueDate = newDueDate;
  this.renewals += 1;
  
  // Add to renewal history
  this.renewalHistory.push({
    renewalDate: new Date(),
    newDueDate: newDueDate,
    renewedBy: renewedBy
  });
  
  return this;
};

// Instance method to return book
borrowSchema.methods.returnBook = function(returnedBy, notes = '') {
  if (this.status === 'returned') {
    throw new Error('Book is already returned');
  }
  
  this.returnDate = new Date();
  this.status = 'returned';
  this.returnedBy = returnedBy;
  this.notes = notes;
  
  // Calculate final fine if overdue
  if (this.status === 'overdue') {
    this.fineAmount = this.calculateFine();
  }
  
  return this;
};

// Static method to find overdue borrows
borrowSchema.statics.findOverdueBorrows = function() {
  const now = new Date();
  return this.find({
    status: 'borrowed',
    dueDate: { $lt: now },
    isActive: true
  }).populate('user', 'firstName lastName email')
    .populate('book', 'title author isbn');
};

// Static method to find borrows by user
borrowSchema.statics.findBorrowsByUser = function(userId, status = null) {
  const query = { user: userId, isActive: true };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('book', 'title author isbn coverImage')
    .sort({ borrowDate: -1 });
};

// Static method to find borrows by book
borrowSchema.statics.findBorrowsByBook = function(bookId, status = null) {
  const query = { book: bookId, isActive: true };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('user', 'firstName lastName email studentId')
    .sort({ borrowDate: -1 });
};

// Static method to get borrow statistics
borrowSchema.statics.getBorrowStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalFine: { $sum: '$fineAmount' }
      }
    }
  ]);
};

// Static method to get overdue statistics
borrowSchema.statics.getOverdueStats = function() {
  const now = new Date();
  return this.aggregate([
    {
      $match: {
        status: 'borrowed',
        dueDate: { $lt: now },
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalOverdue: { $sum: 1 },
        totalFineAmount: { $sum: '$fineAmount' },
        averageDaysOverdue: {
          $avg: {
            $ceil: {
              $divide: [
                { $subtract: [now, '$dueDate'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      }
    }
  ]);
};

// Static method to get user borrow history
borrowSchema.statics.getUserBorrowHistory = function(userId, limit = 10) {
  return this.find({ user: userId, isActive: true })
    .populate('book', 'title author isbn coverImage')
    .sort({ borrowDate: -1 })
    .limit(limit);
};

// Static method to get popular books by borrows
borrowSchema.statics.getPopularBooksByBorrows = function(limit = 10) {
  return this.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: '$book',
        totalBorrows: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' }
      }
    },
    {
      $addFields: {
        uniqueUserCount: { $size: '$uniqueUsers' }
      }
    },
    {
      $lookup: {
        from: 'books',
        localField: '_id',
        foreignField: '_id',
        as: 'bookDetails'
      }
    },
    {
      $unwind: '$bookDetails'
    },
    {
      $sort: { totalBorrows: -1, uniqueUserCount: -1 }
    },
    {
      $limit: limit
    },
    {
      $project: {
        book: '$bookDetails',
        totalBorrows: 1,
        uniqueUserCount: 1
      }
    }
  ]);
};

module.exports = mongoose.model('Borrow', borrowSchema);
