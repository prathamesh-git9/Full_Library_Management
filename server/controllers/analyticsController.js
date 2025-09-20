const User = require('../models/User');
const Book = require('../models/Book');
const Borrow = require('../models/Borrow');
const Comment = require('../models/Comment');
const Reservation = require('../models/Reservation');
const mongoose = require('mongoose');

// @desc    Get comprehensive analytics dashboard
// @route   GET /api/analytics/dashboard
// @access  Private (Admin only)
const getAnalyticsDashboard = async (req, res) => {
    try {
        const { period = '30d' } = req.query;

        // Calculate date range
        const now = new Date();
        let startDate;

        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const [
            // Basic statistics
            totalUsers,
            totalBooks,
            totalBorrows,
            totalComments,
            totalReservations,

            // User analytics
            userGrowth,
            userEngagement,
            topUsers,

            // Book analytics
            bookPopularity,
            categoryStats,
            bookPerformance,

            // Borrow analytics
            borrowTrends,
            overdueStats,
            fineAnalytics,

            // Comment analytics
            commentTrends,
            ratingDistribution,

            // Reservation analytics
            reservationTrends,
            fulfillmentRates,

            // Time-based analytics
            hourlyActivity,
            dailyActivity,
            monthlyActivity
        ] = await Promise.all([
            // Basic statistics
            User.countDocuments({ isActive: true }),
            Book.countDocuments({ isActive: true }),
            Borrow.countDocuments({ isActive: true }),
            Comment.countDocuments({ isActive: true, isApproved: true }),
            Reservation.countDocuments({ isActive: true }),

            // User analytics
            getUserGrowth(startDate, now),
            getUserEngagement(startDate, now),
            getTopUsers(startDate, now),

            // Book analytics
            getBookPopularity(startDate, now),
            getCategoryStats(),
            getBookPerformance(startDate, now),

            // Borrow analytics
            getBorrowTrends(startDate, now),
            getOverdueStats(),
            getFineAnalytics(startDate, now),

            // Comment analytics
            getCommentTrends(startDate, now),
            getRatingDistribution(),

            // Reservation analytics
            getReservationTrends(startDate, now),
            getFulfillmentRates(startDate, now),

            // Time-based analytics
            getHourlyActivity(startDate, now),
            getDailyActivity(startDate, now),
            getMonthlyActivity(startDate, now)
        ]);

        res.status(200).json({
            success: true,
            data: {
                period,
                overview: {
                    totalUsers,
                    totalBooks,
                    totalBorrows,
                    totalComments,
                    totalReservations
                },
                userAnalytics: {
                    growth: userGrowth,
                    engagement: userEngagement,
                    topUsers
                },
                bookAnalytics: {
                    popularity: bookPopularity,
                    categories: categoryStats,
                    performance: bookPerformance
                },
                borrowAnalytics: {
                    trends: borrowTrends,
                    overdue: overdueStats,
                    fines: fineAnalytics
                },
                commentAnalytics: {
                    trends: commentTrends,
                    ratings: ratingDistribution
                },
                reservationAnalytics: {
                    trends: reservationTrends,
                    fulfillment: fulfillmentRates
                },
                timeAnalytics: {
                    hourly: hourlyActivity,
                    daily: dailyActivity,
                    monthly: monthlyActivity
                }
            }
        });
    } catch (error) {
        console.error('Get analytics dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics dashboard',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Helper functions for analytics

const getUserGrowth = async (startDate, endDate) => {
    return await User.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                isActive: true
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
    ]);
};

const getUserEngagement = async (startDate, endDate) => {
    return await Borrow.aggregate([
        {
            $match: {
                borrowDate: { $gte: startDate, $lte: endDate },
                isActive: true
            }
        },
        {
            $group: {
                _id: '$user',
                borrowCount: { $sum: 1 },
                totalDays: {
                    $sum: {
                        $divide: [
                            { $subtract: ['$returnDate', '$borrowDate'] },
                            1000 * 60 * 60 * 24
                        ]
                    }
                }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'userDetails'
            }
        },
        {
            $unwind: '$userDetails'
        },
        {
            $project: {
                user: '$userDetails',
                borrowCount: 1,
                averageDays: { $divide: ['$totalDays', '$borrowCount'] }
            }
        },
        {
            $sort: { borrowCount: -1 }
        },
        {
            $limit: 10
        }
    ]);
};

const getTopUsers = async (startDate, endDate) => {
    return await Borrow.aggregate([
        {
            $match: {
                borrowDate: { $gte: startDate, $lte: endDate },
                isActive: true
            }
        },
        {
            $group: {
                _id: '$user',
                totalBorrows: { $sum: 1 },
                totalFines: { $sum: '$fineAmount' }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'userDetails'
            }
        },
        {
            $unwind: '$userDetails'
        },
        {
            $project: {
                user: '$userDetails',
                totalBorrows: 1,
                totalFines: 1
            }
        },
        {
            $sort: { totalBorrows: -1 }
        },
        {
            $limit: 5
        }
    ]);
};

const getBookPopularity = async (startDate, endDate) => {
    return await Borrow.aggregate([
        {
            $match: {
                borrowDate: { $gte: startDate, $lte: endDate },
                isActive: true
            }
        },
        {
            $group: {
                _id: '$book',
                borrowCount: { $sum: 1 },
                uniqueBorrowers: { $addToSet: '$user' }
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
            $project: {
                book: '$bookDetails',
                borrowCount: 1,
                uniqueBorrowerCount: { $size: '$uniqueBorrowers' }
            }
        },
        {
            $sort: { borrowCount: -1 }
        },
        {
            $limit: 10
        }
    ]);
};

const getCategoryStats = async () => {
    return await Book.aggregate([
        {
            $match: { isActive: true }
        },
        {
            $group: {
                _id: '$genre',
                totalBooks: { $sum: 1 },
                totalCopies: { $sum: '$copies' },
                availableCopies: { $sum: '$availableCopies' },
                averageRating: { $avg: '$averageRating' }
            }
        },
        {
            $sort: { totalBooks: -1 }
        }
    ]);
};

const getBookPerformance = async (startDate, endDate) => {
    return await Borrow.aggregate([
        {
            $match: {
                borrowDate: { $gte: startDate, $lte: endDate },
                isActive: true
            }
        },
        {
            $group: {
                _id: '$book',
                totalBorrows: { $sum: 1 },
                totalReturns: {
                    $sum: { $cond: [{ $ne: ['$returnDate', null] }, 1, 0] }
                },
                totalOverdue: {
                    $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
                },
                averageBorrowDays: {
                    $avg: {
                        $divide: [
                            { $subtract: ['$returnDate', '$borrowDate'] },
                            1000 * 60 * 60 * 24
                        ]
                    }
                }
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
            $project: {
                book: '$bookDetails',
                totalBorrows: 1,
                totalReturns: 1,
                totalOverdue: 1,
                averageBorrowDays: { $round: ['$averageBorrowDays', 1] },
                returnRate: {
                    $round: [
                        { $multiply: [{ $divide: ['$totalReturns', '$totalBorrows'] }, 100] },
                        1
                    ]
                }
            }
        },
        {
            $sort: { totalBorrows: -1 }
        },
        {
            $limit: 10
        }
    ]);
};

const getBorrowTrends = async (startDate, endDate) => {
    return await Borrow.aggregate([
        {
            $match: {
                borrowDate: { $gte: startDate, $lte: endDate },
                isActive: true
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$borrowDate' },
                    month: { $month: '$borrowDate' },
                    day: { $dayOfMonth: '$borrowDate' }
                },
                borrows: { $sum: 1 },
                returns: {
                    $sum: { $cond: [{ $ne: ['$returnDate', null] }, 1, 0] }
                }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
    ]);
};

const getOverdueStats = async () => {
    return await Borrow.aggregate([
        {
            $match: {
                status: 'overdue',
                isActive: true
            }
        },
        {
            $group: {
                _id: null,
                totalOverdue: { $sum: 1 },
                totalFines: { $sum: '$fineAmount' },
                averageOverdueDays: {
                    $avg: {
                        $divide: [
                            { $subtract: [new Date(), '$dueDate'] },
                            1000 * 60 * 60 * 24
                        ]
                    }
                }
            }
        }
    ]);
};

const getFineAnalytics = async (startDate, endDate) => {
    return await Borrow.aggregate([
        {
            $match: {
                borrowDate: { $gte: startDate, $lte: endDate },
                isActive: true,
                fineAmount: { $gt: 0 }
            }
        },
        {
            $group: {
                _id: null,
                totalFines: { $sum: '$fineAmount' },
                paidFines: {
                    $sum: { $cond: ['$finePaid', '$fineAmount', 0] }
                },
                unpaidFines: {
                    $sum: { $cond: ['$finePaid', 0, '$fineAmount'] }
                },
                averageFine: { $avg: '$fineAmount' }
            }
        }
    ]);
};

const getCommentTrends = async (startDate, endDate) => {
    return await Comment.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                isActive: true,
                isApproved: true
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                },
                commentCount: { $sum: 1 },
                averageRating: { $avg: '$rating' }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
    ]);
};

const getRatingDistribution = async () => {
    return await Comment.aggregate([
        {
            $match: {
                isActive: true,
                isApproved: true
            }
        },
        {
            $group: {
                _id: '$rating',
                count: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);
};

const getReservationTrends = async (startDate, endDate) => {
    return await Reservation.aggregate([
        {
            $match: {
                reservationDate: { $gte: startDate, $lte: endDate },
                isActive: true
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$reservationDate' },
                    month: { $month: '$reservationDate' },
                    day: { $dayOfMonth: '$reservationDate' }
                },
                reservations: { $sum: 1 },
                fulfilled: {
                    $sum: { $cond: [{ $eq: ['$status', 'fulfilled'] }, 1, 0] }
                },
                expired: {
                    $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
                }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
    ]);
};

const getFulfillmentRates = async (startDate, endDate) => {
    return await Reservation.aggregate([
        {
            $match: {
                reservationDate: { $gte: startDate, $lte: endDate },
                isActive: true
            }
        },
        {
            $group: {
                _id: null,
                totalReservations: { $sum: 1 },
                fulfilled: {
                    $sum: { $cond: [{ $eq: ['$status', 'fulfilled'] }, 1, 0] }
                },
                expired: {
                    $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
                },
                cancelled: {
                    $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                }
            }
        },
        {
            $project: {
                totalReservations: 1,
                fulfilled: 1,
                expired: 1,
                cancelled: 1,
                fulfillmentRate: {
                    $round: [
                        { $multiply: [{ $divide: ['$fulfilled', '$totalReservations'] }, 100] },
                        1
                    ]
                }
            }
        }
    ]);
};

const getHourlyActivity = async (startDate, endDate) => {
    return await Borrow.aggregate([
        {
            $match: {
                borrowDate: { $gte: startDate, $lte: endDate },
                isActive: true
            }
        },
        {
            $group: {
                _id: { $hour: '$borrowDate' },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);
};

const getDailyActivity = async (startDate, endDate) => {
    return await Borrow.aggregate([
        {
            $match: {
                borrowDate: { $gte: startDate, $lte: endDate },
                isActive: true
            }
        },
        {
            $group: {
                _id: { $dayOfWeek: '$borrowDate' },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);
};

const getMonthlyActivity = async (startDate, endDate) => {
    return await Borrow.aggregate([
        {
            $match: {
                borrowDate: { $gte: startDate, $lte: endDate },
                isActive: true
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$borrowDate' },
                    month: { $month: '$borrowDate' }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1 }
        }
    ]);
};

// @desc    Get custom analytics report
// @route   POST /api/analytics/custom-report
// @access  Private (Admin only)
const getCustomReport = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            metrics = [],
            filters = {},
            groupBy = 'day'
        } = req.body;

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }

        // Build aggregation pipeline based on requested metrics
        const pipeline = [];

        // Add match stage for date range
        pipeline.push({
            $match: {
                borrowDate: { $gte: start, $lte: end },
                isActive: true
            }
        });

        // Add filters
        if (filters.userRole) {
            pipeline.push({
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            });
            pipeline.push({
                $match: {
                    'userDetails.role': filters.userRole
                }
            });
        }

        if (filters.bookGenre) {
            pipeline.push({
                $lookup: {
                    from: 'books',
                    localField: 'book',
                    foreignField: '_id',
                    as: 'bookDetails'
                }
            });
            pipeline.push({
                $match: {
                    'bookDetails.genre': filters.bookGenre
                }
            });
        }

        // Add group stage based on groupBy
        let groupStage = { _id: {} };

        switch (groupBy) {
            case 'hour':
                groupStage._id.hour = { $hour: '$borrowDate' };
                break;
            case 'day':
                groupStage._id.day = { $dayOfMonth: '$borrowDate' };
                groupStage._id.month = { $month: '$borrowDate' };
                groupStage._id.year = { $year: '$borrowDate' };
                break;
            case 'week':
                groupStage._id.week = { $week: '$borrowDate' };
                groupStage._id.year = { $year: '$borrowDate' };
                break;
            case 'month':
                groupStage._id.month = { $month: '$borrowDate' };
                groupStage._id.year = { $year: '$borrowDate' };
                break;
        }

        // Add metrics to group stage
        metrics.forEach(metric => {
            switch (metric) {
                case 'borrowCount':
                    groupStage.borrowCount = { $sum: 1 };
                    break;
                case 'returnCount':
                    groupStage.returnCount = {
                        $sum: { $cond: [{ $ne: ['$returnDate', null] }, 1, 0] }
                    };
                    break;
                case 'overdueCount':
                    groupStage.overdueCount = {
                        $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
                    };
                    break;
                case 'totalFines':
                    groupStage.totalFines = { $sum: '$fineAmount' };
                    break;
                case 'averageBorrowDays':
                    groupStage.averageBorrowDays = {
                        $avg: {
                            $divide: [
                                { $subtract: ['$returnDate', '$borrowDate'] },
                                1000 * 60 * 60 * 24
                            ]
                        }
                    };
                    break;
            }
        });

        pipeline.push({ $group: groupStage });
        pipeline.push({ $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } });

        const results = await Borrow.aggregate(pipeline);

        res.status(200).json({
            success: true,
            data: {
                report: results,
                parameters: {
                    startDate,
                    endDate,
                    metrics,
                    filters,
                    groupBy
                }
            }
        });
    } catch (error) {
        console.error('Get custom report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate custom report',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    getAnalyticsDashboard,
    getCustomReport
};
