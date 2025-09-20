const Notification = require('../models/Notification');
const User = require('../models/User');
const Borrow = require('../models/Borrow');
const { sendEmail } = require('../utils/emailService');
const { validationResult } = require('express-validator');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = { user: userId, isActive: true };

        if (req.query.type) {
            filter.type = req.query.type;
        }

        if (req.query.isRead !== undefined) {
            filter.isRead = req.query.isRead === 'true';
        }

        if (req.query.priority) {
            filter.priority = req.query.priority;
        }

        // Build sort object
        let sort = { createdAt: -1 };
        if (req.query.sortBy) {
            const sortOrder = req.query.sort === 'asc' ? 1 : -1;
            sort = { [req.query.sortBy]: sortOrder };
        }

        const notifications = await Notification.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const total = await Notification.countDocuments(filter);
        const unreadCount = await Notification.getUnreadCount(userId);

        res.status(200).json({
            success: true,
            data: {
                notifications,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalNotifications: total,
                    unreadCount,
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private
const getNotificationById = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Check if user can access this notification
        if (notification.user.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin' && req.user.role !== 'librarian') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.status(200).json({
            success: true,
            data: { notification }
        });
    } catch (error) {
        console.error('Get notification by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Check if user can access this notification
        if (notification.user.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin' && req.user.role !== 'librarian') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        notification.markAsRead();
        await notification.save();

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            data: { notification }
        });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
    try {
        const result = await Notification.markAllAsRead(req.user._id);

        res.status(200).json({
            success: true,
            message: `${result.modifiedCount} notifications marked as read`,
            data: { modifiedCount: result.modifiedCount }
        });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Check if user can delete this notification
        if (notification.user.toString() !== req.user._id.toString() &&
            req.user.role !== 'admin' && req.user.role !== 'librarian') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        notification.isActive = false;
        await notification.save();

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private (Admin/Librarian only)
const createNotification = async (req, res) => {
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

        const { user, type, title, message, priority, relatedEntity, metadata } = req.body;

        // Check if user exists
        const targetUser = await User.findById(user);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'Target user not found'
            });
        }

        const notification = await Notification.createNotification({
            user,
            type,
            title,
            message,
            priority,
            relatedEntity,
            metadata
        });

        // Send email notification if user has email notifications enabled
        if (targetUser.email && targetUser.preferences?.notifications?.email) {
            try {
                await sendEmail(targetUser.email, 'general', [targetUser.firstName, title, message]);
                notification.emailSent = true;
                notification.emailSentAt = new Date();
                await notification.save();
            } catch (emailError) {
                console.error('Failed to send email notification:', emailError);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            data: { notification }
        });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private (Admin/Librarian only)
const getNotificationStats = async (req, res) => {
    try {
        const [notificationStats, typeStats] = await Promise.all([
            Notification.getNotificationStats(),
            Notification.getNotificationsByType()
        ]);

        res.status(200).json({
            success: true,
            data: {
                notificationStats: notificationStats[0] || {},
                typeStats
            }
        });
    } catch (error) {
        console.error('Get notification stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Send due date reminders
// @route   POST /api/notifications/send-due-reminders
// @access  Private (Admin/Librarian only)
const sendDueDateReminders = async (req, res) => {
    try {
        // Find books due in 2 days
        const twoDaysFromNow = new Date();
        twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

        const dueBorrows = await Borrow.find({
            status: 'borrowed',
            dueDate: {
                $gte: new Date(twoDaysFromNow.setHours(0, 0, 0, 0)),
                $lt: new Date(twoDaysFromNow.setHours(23, 59, 59, 999))
            },
            isActive: true
        })
            .populate('user', 'firstName lastName email preferences')
            .populate('book', 'title author');

        const notifications = [];
        const emailResults = [];

        for (const borrow of dueBorrows) {
            // Create notification
            const notification = await Notification.createNotification({
                user: borrow.user._id,
                type: 'due_date',
                title: 'Book Due Date Reminder',
                message: `Your book "${borrow.book.title}" is due on ${new Date(borrow.dueDate).toLocaleDateString()}. Please return it on time to avoid late fees.`,
                priority: 'medium',
                relatedEntity: {
                    type: 'borrow',
                    id: borrow._id
                },
                metadata: {
                    bookTitle: borrow.book.title,
                    dueDate: borrow.dueDate
                }
            });

            notifications.push(notification);

            // Send email if enabled
            if (borrow.user.email && borrow.user.preferences?.notifications?.email) {
                try {
                    const emailResult = await sendEmail(
                        borrow.user.email,
                        'dueDateReminder',
                        [borrow.user.firstName, borrow.book.title, borrow.dueDate]
                    );

                    if (emailResult.success) {
                        notification.emailSent = true;
                        notification.emailSentAt = new Date();
                        await notification.save();
                    }

                    emailResults.push({
                        userEmail: borrow.user.email,
                        success: emailResult.success,
                        error: emailResult.error
                    });
                } catch (emailError) {
                    emailResults.push({
                        userEmail: borrow.user.email,
                        success: false,
                        error: emailError.message
                    });
                }
            }
        }

        res.status(200).json({
            success: true,
            message: `Due date reminders sent to ${notifications.length} users`,
            data: {
                notificationsSent: notifications.length,
                emailResults
            }
        });
    } catch (error) {
        console.error('Send due date reminders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send due date reminders',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Send overdue notices
// @route   POST /api/notifications/send-overdue-notices
// @access  Private (Admin/Librarian only)
const sendOverdueNotices = async (req, res) => {
    try {
        const overdueBorrows = await Borrow.find({
            status: 'overdue',
            isActive: true
        })
            .populate('user', 'firstName lastName email preferences')
            .populate('book', 'title author');

        const notifications = [];
        const emailResults = [];

        for (const borrow of overdueBorrows) {
            const daysOverdue = Math.ceil((new Date() - new Date(borrow.dueDate)) / (1000 * 60 * 60 * 24));
            const fineAmount = daysOverdue * 1.00; // $1 per day

            // Create notification
            const notification = await Notification.createNotification({
                user: borrow.user._id,
                type: 'overdue',
                title: 'Overdue Book Notice',
                message: `Your book "${borrow.book.title}" is overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}. Fine amount: $${fineAmount.toFixed(2)}. Please return the book immediately.`,
                priority: 'high',
                relatedEntity: {
                    type: 'borrow',
                    id: borrow._id
                },
                metadata: {
                    bookTitle: borrow.book.title,
                    daysOverdue,
                    fineAmount
                }
            });

            notifications.push(notification);

            // Send email if enabled
            if (borrow.user.email && borrow.user.preferences?.notifications?.email) {
                try {
                    const emailResult = await sendEmail(
                        borrow.user.email,
                        'overdueNotice',
                        [borrow.user.firstName, borrow.book.title, daysOverdue, fineAmount]
                    );

                    if (emailResult.success) {
                        notification.emailSent = true;
                        notification.emailSentAt = new Date();
                        await notification.save();
                    }

                    emailResults.push({
                        userEmail: borrow.user.email,
                        success: emailResult.success,
                        error: emailResult.error
                    });
                } catch (emailError) {
                    emailResults.push({
                        userEmail: borrow.user.email,
                        success: false,
                        error: emailError.message
                    });
                }
            }
        }

        res.status(200).json({
            success: true,
            message: `Overdue notices sent to ${notifications.length} users`,
            data: {
                notificationsSent: notifications.length,
                emailResults
            }
        });
    } catch (error) {
        console.error('Send overdue notices error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send overdue notices',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    getNotifications,
    getNotificationById,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    getNotificationStats,
    sendDueDateReminders,
    sendOverdueNotices
};
