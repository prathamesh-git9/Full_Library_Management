const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  isbn: {
    type: String,
    required: [true, 'ISBN is required'],
    unique: true,
    trim: true,
    match: [/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/, 'Please enter a valid ISBN']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: [
      'Fiction',
      'Non-Fiction',
      'Science',
      'Technology',
      'History',
      'Biography',
      'Philosophy',
      'Religion',
      'Art',
      'Music',
      'Literature',
      'Poetry',
      'Drama',
      'Reference',
      'Textbook',
      'Children',
      'Young Adult',
      'Mystery',
      'Romance',
      'Fantasy',
      'Science Fiction',
      'Horror',
      'Thriller',
      'Comedy',
      'Travel',
      'Cooking',
      'Health',
      'Sports',
      'Business',
      'Economics',
      'Politics',
      'Education',
      'Psychology',
      'Sociology',
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Medicine',
      'Engineering',
      'Computer Science',
      'Other'
    ]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  totalCopies: {
    type: Number,
    required: [true, 'Total copies is required'],
    min: [1, 'Total copies must be at least 1'],
    max: [1000, 'Total copies cannot exceed 1000']
  },
  availableCopies: {
    type: Number,
    default: function() {
      return this.totalCopies;
    },
    min: [0, 'Available copies cannot be negative'],
    validate: {
      validator: function(value) {
        return value <= this.totalCopies;
      },
      message: 'Available copies cannot exceed total copies'
    }
  },
  publishedYear: {
    type: Number,
    min: [1000, 'Published year must be after 1000'],
    max: [new Date().getFullYear() + 1, 'Published year cannot be in the future']
  },
  publisher: {
    type: String,
    trim: true,
    maxlength: [100, 'Publisher name cannot exceed 100 characters']
  },
  language: {
    type: String,
    default: 'English',
    trim: true,
    maxlength: [50, 'Language cannot exceed 50 characters']
  },
  pages: {
    type: Number,
    min: [1, 'Pages must be at least 1'],
    max: [10000, 'Pages cannot exceed 10000']
  },
  coverImage: {
    type: String,
    default: null
  },
  pdfFile: {
    type: String,
    default: null
  },
  edition: {
    type: String,
    trim: true,
    maxlength: [50, 'Edition cannot exceed 50 characters']
  },
  volume: {
    type: String,
    trim: true,
    maxlength: [50, 'Volume cannot exceed 50 characters']
  },
  series: {
    type: String,
    trim: true,
    maxlength: [100, 'Series name cannot exceed 100 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  location: {
    shelf: {
      type: String,
      trim: true,
      maxlength: [20, 'Shelf cannot exceed 20 characters']
    },
    section: {
      type: String,
      trim: true,
      maxlength: [50, 'Section cannot exceed 50 characters']
    },
    floor: {
      type: Number,
      min: [1, 'Floor must be at least 1'],
      max: [10, 'Floor cannot exceed 10']
    }
  },
  price: {
    type: Number,
    min: [0, 'Price cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  statistics: {
    totalBorrows: {
      type: Number,
      default: 0
    },
    totalReservations: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Average rating cannot be negative'],
      max: [5, 'Average rating cannot exceed 5']
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for availability status
bookSchema.virtual('isAvailable').get(function() {
  return this.availableCopies > 0;
});

// Virtual for availability percentage
bookSchema.virtual('availabilityPercentage').get(function() {
  return Math.round((this.availableCopies / this.totalCopies) * 100);
});

// Indexes for better query performance
bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ category: 1 });
bookSchema.index({ author: 1 });
bookSchema.index({ isbn: 1 });
bookSchema.index({ isActive: 1 });
bookSchema.index({ 'location.shelf': 1, 'location.section': 1 });
bookSchema.index({ publishedYear: 1 });
bookSchema.index({ 'statistics.averageRating': -1 });
bookSchema.index({ createdAt: -1 });

// Pre-save middleware to ensure available copies don't exceed total copies
bookSchema.pre('save', function(next) {
  if (this.availableCopies > this.totalCopies) {
    this.availableCopies = this.totalCopies;
  }
  next();
});

// Pre-save middleware to update lastModifiedBy
bookSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastModifiedBy = this.addedBy; // This should be set by the controller
  }
  next();
});

// Instance method to check if book is available
bookSchema.methods.isBookAvailable = function() {
  return this.availableCopies > 0 && this.isActive;
};

// Instance method to borrow a copy
bookSchema.methods.borrowCopy = function() {
  if (this.availableCopies > 0) {
    this.availableCopies -= 1;
    this.statistics.totalBorrows += 1;
    return true;
  }
  return false;
};

// Instance method to return a copy
bookSchema.methods.returnCopy = function() {
  if (this.availableCopies < this.totalCopies) {
    this.availableCopies += 1;
    return true;
  }
  return false;
};

// Instance method to reserve a copy
bookSchema.methods.reserveCopy = function() {
  this.statistics.totalReservations += 1;
};

// Instance method to cancel reservation
bookSchema.methods.cancelReservation = function() {
  if (this.statistics.totalReservations > 0) {
    this.statistics.totalReservations -= 1;
  }
};

// Instance method to update rating
bookSchema.methods.updateRating = function(newRating) {
  const totalRatings = this.statistics.totalRatings;
  const currentAverage = this.statistics.averageRating;
  
  // Calculate new average
  const newTotal = (currentAverage * totalRatings) + newRating;
  this.statistics.totalRatings += 1;
  this.statistics.averageRating = newTotal / this.statistics.totalRatings;
};

// Static method to find available books
bookSchema.statics.findAvailableBooks = function() {
  return this.find({ 
    availableCopies: { $gt: 0 },
    isActive: true 
  });
};

// Static method to search books
bookSchema.statics.searchBooks = function(query, options = {}) {
  const searchQuery = {
    $and: [
      { isActive: true },
      {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { author: { $regex: query, $options: 'i' } },
          { isbn: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      }
    ]
  };

  // Add additional filters
  if (options.category) {
    searchQuery.$and.push({ category: options.category });
  }
  if (options.available !== undefined) {
    if (options.available) {
      searchQuery.$and.push({ availableCopies: { $gt: 0 } });
    } else {
      searchQuery.$and.push({ availableCopies: 0 });
    }
  }
  if (options.minRating) {
    searchQuery.$and.push({ 'statistics.averageRating': { $gte: options.minRating } });
  }

  return this.find(searchQuery);
};

// Static method to get popular books
bookSchema.statics.getPopularBooks = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'statistics.totalBorrows': -1, 'statistics.averageRating': -1 })
    .limit(limit);
};

// Static method to get recently added books
bookSchema.statics.getRecentlyAddedBooks = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get book statistics
bookSchema.statics.getBookStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalBooks: { $sum: 1 },
        totalCopies: { $sum: '$totalCopies' },
        availableCopies: { $sum: '$availableCopies' },
        totalBorrows: { $sum: '$statistics.totalBorrows' },
        averageRating: { $avg: '$statistics.averageRating' }
      }
    }
  ]);
};

// Static method to get category statistics
bookSchema.statics.getCategoryStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalCopies: { $sum: '$totalCopies' },
        availableCopies: { $sum: '$availableCopies' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

module.exports = mongoose.model('Book', bookSchema);
