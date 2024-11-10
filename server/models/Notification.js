const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: [
      'due_date',
      'overdue',
      'fine',
      'reservation',
      'reservation_available',
      'welcome',
      'password_reset',
      'book_added',
      'book_updated',
      'system_announcement',
      'general'
    ]
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ['book', 'borrow', 'reservation', 'user', 'comment']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date,
    default: null
  },
  smsSent: {
    type: Boolean,
    default: false
  },
  smsSentAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date,
    default: null
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

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInSeconds = Math.floor((now - this.createdAt) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return this.createdAt.toLocaleDateString();
});

// Indexes for better query performance
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ isActive: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// TTL index for expired notifications
notificationSchema.index({ expiresAt: 1 }, { 
  expireAfterSeconds: 0,
  partialFilterExpression: { expiresAt: { $ne: null } }
});

// Pre-save middleware to set expiration date for certain types
notificationSchema.pre('save', function(next) {
  if (this.isNew) {
    // Set expiration date based on notification type
    switch (this.type) {
      case 'due_date':
        this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        break;
      case 'overdue':
        this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        break;
      case 'reservation_available':
        this.expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
        break;
      case 'password_reset':
        this.expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        break;
      default:
        this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default
    }
  }
  next();
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this;
};

// Instance method to mark as unread
notificationSchema.methods.markAsUnread = function() {
  this.isRead = false;
  this.readAt = null;
  return this;
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const query = {
    user: userId,
    isActive: true
  };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.isRead !== undefined) {
    query.isRead = options.isRead;
  }
  
  if (options.priority) {
    query.priority = options.priority;
  }
  
  const sort = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder === 'asc' ? 1 : -1;
  
  return this.find(query)
    .sort({ [sort]: sortOrder })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    user: userId,
    isRead: false,
    isActive: true
  });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { user: userId, isRead: false, isActive: true },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
};

// Static method to create notification
notificationSchema.statics.createNotification = function(data) {
  return this.create({
    user: data.user,
    type: data.type,
    title: data.title,
    message: data.message,
    priority: data.priority || 'medium',
    relatedEntity: data.relatedEntity,
    metadata: data.metadata || {}
  });
};

// Static method to get notification statistics
notificationSchema.statics.getNotificationStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalNotifications: { $sum: 1 },
        unreadNotifications: {
          $sum: { $cond: ['$isRead', 0, 1] }
        },
        emailSent: {
          $sum: { $cond: ['$emailSent', 1, 0] }
        },
        smsSent: {
          $sum: { $cond: ['$smsSent', 1, 0] }
        }
      }
    }
  ]);
};

// Static method to get notifications by type
notificationSchema.statics.getNotificationsByType = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        unreadCount: {
          $sum: { $cond: ['$isRead', 0, 1] }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Static method to cleanup expired notifications
notificationSchema.statics.cleanupExpired = function() {
  return this.updateMany(
    { 
      expiresAt: { $lt: new Date() },
      isActive: true 
    },
    { 
      isActive: false 
    }
  );
};

// Static method to send bulk notifications
notificationSchema.statics.sendBulkNotifications = async function(notifications) {
  const results = [];
  
  for (const notificationData of notifications) {
    try {
      const notification = await this.createNotification(notificationData);
      results.push({
        success: true,
        notificationId: notification._id,
        user: notificationData.user
      });
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        user: notificationData.user
      });
    }
  }
  
  return results;
};

module.exports = mongoose.model('Notification', notificationSchema);
