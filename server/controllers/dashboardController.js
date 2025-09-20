const User = require('../models/User');
const Book = require('../models/Book');
const Borrow = require('../models/Borrow');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');

// @desc    Get student dashboard data
// @route   GET /api/dashboard/student
// @access  Private (Student only)
const getStudentDashboard = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get current borrowed books
        const currentBorrows = await Borrow.find({
            user: userId,
            status: 'borrowed',
            isActive: true
        })
            .populate('book', 'title author coverImage isbn')
            .sort({ dueDate: 1 });

        // Get overdue books
        const overdueBorrows = await Borrow.find({
            user: userId,
            status: 'overdue',
            isActive: true
        })
            .populate('book', 'title author coverImage isbn');

        // Get recent borrow history
        const recentBorrows = await Borrow.find({
            user: userId,
            isActive: true
        })
            .populate('book', 'title author coverImage isbn')
            .sort({ borrowDate: -1 })
            .limit(10);

        // Calculate total fines
        const totalFines = await Borrow.aggregate([
            {
                $match: {
                    user: mongoose.Types.ObjectId(userId),
                    isActive: true,
                    fineAmount: { $gt: 0 },
                    finePaid: false
                }
            },
            {
                $group: {
                    _id: null,
                    totalFines: { $sum: '$fineAmount' }
                }
            }
        ]);

        // Get user's comments/ratings
        const userComments = await Comment.find({
            user: userId,
            isActive: true
        })
            .populate('book', 'title author coverImage')
            .sort({ createdAt: -1 })
            .limit(5);

        // Get reading statistics
        const readingStats = await Borrow.aggregate([
            {
                $match: {
                    user: mongoose.Types.ObjectId(userId),
                    isActive: true,
                    status: 'returned'
                }
            },
            {
                $group: {
                    _id: null,
                    totalBooksRead: { $sum: 1 },
                    totalBorrowDays: {
                        $sum: {
                            $divide: [
                                { $subtract: ['$returnDate', '$borrowDate'] },
                                1000 * 60 * 60 * 24
                            ]
                        }
                    }
                }
            }
        ]);

        // Get favorite categories
        const favoriteCategories = await Borrow.aggregate([
            {
                $match: {
                    user: mongoose.Types.ObjectId(userId),
                    isActive: true,
                    status: 'returned'
                }
            },
            {
                $lookup: {
                    from: 'books',
                    localField: 'book',
                    foreignField: '_id',
                    as: 'bookDetails'
                }
            },
            {
                $unwind: '$bookDetails'
            },
            {
                $group: {
                    _id: '$bookDetails.category',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 5
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                currentBorrows,
                overdueBorrows,
                recentBorrows,
                totalFines: totalFines[0]?.totalFines || 0,
                userComments,
                readingStats: readingStats[0] || { totalBooksRead: 0, totalBorrowDays: 0 },
                favoriteCategories
            }
        });
    } catch (error) {
        console.error('Get student dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch student dashboard data',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Get admin dashboard data
// @route   GET /api/dashboard/admin
// @access  Private (Admin only)
const getAdminDashboard = async (req, res) => {
    try {
        // Get system overview statistics
        const [
            totalUsers,
            totalBooks,
            totalBorrows,
            totalComments,
            overdueStats,
            userStats,
            bookStats,
            categoryStats,
            recentActivity,
            topBooks,
            monthlyStats
        ] = await Promise.all([
            // Total users
            User.countDocuments({ isActive: true }),

            // Total books
            Book.countDocuments({ isActive: true }),

            // Total borrows
            Borrow.countDocuments({ isActive: true }),

            // Total comments
            Comment.countDocuments({ isActive: true, isApproved: true }),

            // Overdue statistics
            Borrow.getOverdueStats(),

            // User statistics by role
            User.getUserStats(),

            // Book statistics
            Book.getBookStats(),

            // Category statistics
            Book.getCategoryStats(),

            // Recent activity (last 10 borrows)
            Borrow.find({ isActive: true })
                .populate('user', 'firstName lastName email')
                .populate('book', 'title author')
                .sort({ createdAt: -1 })
                .limit(10),

            // Top books by borrows
            Borrow.getPopularBooksByBorrows(10),

            // Monthly statistics for the last 6 months
            getMonthlyStatistics()
        ]);

        // Get fine statistics
        const fineStats = await Borrow.aggregate([
            {
                $match: {
                    isActive: true,
                    fineAmount: { $gt: 0 }
                }
            },
            {
                $group: {
                    _id: null,
                    totalFines: { $sum: '$fineAmount' },
                    paidFines: {
                        $sum: {
                            $cond: ['$finePaid', '$fineAmount', 0]
                        }
                    },
                    unpaidFines: {
                        $sum: {
                            $cond: ['$finePaid', 0, '$fineAmount']
                        }
                    }
                }
            }
        ]);

        // Get user growth over time
        const userGrowth = await User.aggregate([
            {
                $match: { isActive: true }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            },
            {
                $limit: 12
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    totalBooks,
                    totalBorrows,
                    totalComments,
                    overdueCount: overdueStats[0]?.totalOverdue || 0,
                    totalFines: fineStats[0]?.totalFines || 0,
                    unpaidFines: fineStats[0]?.unpaidFines || 0
                },
                userStats,
                bookStats: bookStats[0] || {},
                categoryStats,
                overdueStats: overdueStats[0] || {},
                fineStats: fineStats[0] || {},
                recentActivity,
                topBooks,
                monthlyStats,
                userGrowth
            }
        });
    } catch (error) {
        console.error('Get admin dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch admin dashboard data',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Get librarian dashboard data
// @route   GET /api/dashboard/librarian
// @access  Private (Librarian only)
const getLibrarianDashboard = async (req, res) => {
    try {
        // Get books that need attention
        const [
            overdueBooks,
            lowStockBooks,
            pendingReservations,
            recentReturns,
            todayBorrows,
            weeklyStats
        ] = await Promise.all([
            // Overdue books
            Borrow.find({
                status: 'overdue',
                isActive: true
            })
                .populate('user', 'firstName lastName email studentId')
                .populate('book', 'title author isbn')
                .sort({ dueDate: 1 }),

            // Books with low stock (less than 3 copies)
            Book.find({
                availableCopies: { $lt: 3 },
                isActive: true
            })
                .sort({ availableCopies: 1 }),

            // Pending reservations
            getPendingReservations(),

            // Recent returns (last 7 days)
            Borrow.find({
                status: 'returned',
                returnDate: {
                    $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                },
                isActive: true
            })
                .populate('user', 'firstName lastName email')
                .populate('book', 'title author')
                .sort({ returnDate: -1 })
                .limit(20),

            // Today's borrows
            Borrow.find({
                borrowDate: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59, 999))
                },
                isActive: true
            })
                .populate('user', 'firstName lastName email')
                .populate('book', 'title author')
                .sort({ borrowDate: -1 }),

            // Weekly statistics
            getWeeklyStatistics()
        ]);

        res.status(200).json({
            success: true,
            data: {
                overdueBooks,
                lowStockBooks,
                pendingReservations,
                recentReturns,
                todayBorrows,
                weeklyStats
            }
        });
    } catch (error) {
        console.error('Get librarian dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch librarian dashboard data',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Helper function to get monthly statistics
const getMonthlyStatistics = async () => {
    const months = [];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);

        const [borrows, returns, newUsers, newBooks] = await Promise.all([
            Borrow.countDocuments({
                borrowDate: { $gte: monthStart, $lte: monthEnd },
                isActive: true
            }),
            Borrow.countDocuments({
                returnDate: { $gte: monthStart, $lte: monthEnd },
                isActive: true
            }),
            User.countDocuments({
                createdAt: { $gte: monthStart, $lte: monthEnd },
                isActive: true
            }),
            Book.countDocuments({
                createdAt: { $gte: monthStart, $lte: monthEnd },
                isActive: true
            })
        ]);

        months.push({
            month: monthStart.toISOString().substring(0, 7),
            borrows,
            returns,
            newUsers,
            newBooks
        });
    }

    return months;
};

// Helper function to get weekly statistics
const getWeeklyStatistics = async () => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const [borrows, returns, newUsers, fines] = await Promise.all([
        Borrow.countDocuments({
            borrowDate: { $gte: weekStart, $lte: weekEnd },
            isActive: true
        }),
        Borrow.countDocuments({
            returnDate: { $gte: weekStart, $lte: weekEnd },
            isActive: true
        }),
        User.countDocuments({
            createdAt: { $gte: weekStart, $lte: weekEnd },
            isActive: true
        }),
        Borrow.aggregate([
            {
                $match: {
                    borrowDate: { $gte: weekStart, $lte: weekEnd },
                    isActive: true,
                    fineAmount: { $gt: 0 }
                }
            },
            {
                $group: {
                    _id: null,
                    totalFines: { $sum: '$fineAmount' }
                }
            }
        ])
    ]);

    return {
        weekStart: weekStart.toISOString().substring(0, 10),
        weekEnd: weekEnd.toISOString().substring(0, 10),
        borrows,
        returns,
        newUsers,
        totalFines: fines[0]?.totalFines || 0
    };
};

// Helper function to get pending reservations
const getPendingReservations = async () => {
    // This would be implemented when we create the Reservation model
    // For now, return empty array
    return [];
};

// @desc    Get user analytics
// @route   GET /api/dashboard/analytics
// @access  Private (Admin only)
const getUserAnalytics = async (req, res) => {
    try {
        const { period = '30d' } = req.query;

        let dateFilter = {};
        const now = new Date();

        switch (period) {
            case '7d':
                dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
                break;
            case '30d':
                dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
                break;
            case '90d':
                dateFilter = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
                break;
            case '1y':
                dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
                break;
        }

        const [
            activeUsers,
            topBorrowers,
            userEngagement,
            readingPatterns
        ] = await Promise.all([
            // Active users (users who borrowed books in the period)
            Borrow.aggregate([
                {
                    $match: {
                        borrowDate: dateFilter,
                        isActive: true
                    }
                },
                {
                    $group: {
                        _id: '$user',
                        borrowCount: { $sum: 1 }
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
                        borrowCount: 1
                    }
                },
                {
                    $sort: { borrowCount: -1 }
                },
                {
                    $limit: 10
                }
            ]),

            // Top borrowers
            Borrow.aggregate([
                {
                    $match: {
                        isActive: true,
                        status: 'returned'
                    }
                },
                {
                    $group: {
                        _id: '$user',
                        totalBorrows: { $sum: 1 },
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
                        totalBorrows: 1,
                        averageDays: { $divide: ['$totalDays', '$totalBorrows'] }
                    }
                },
                {
                    $sort: { totalBorrows: -1 }
                },
                {
                    $limit: 10
                }
            ]),

            // User engagement (comments, ratings)
            Comment.aggregate([
                {
                    $match: {
                        createdAt: dateFilter,
                        isActive: true
                    }
                },
                {
                    $group: {
                        _id: '$user',
                        commentCount: { $sum: 1 },
                        averageRating: { $avg: '$rating' }
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
                        commentCount: 1,
                        averageRating: { $round: ['$averageRating', 1] }
                    }
                },
                {
                    $sort: { commentCount: -1 }
                },
                {
                    $limit: 10
                }
            ]),

            // Reading patterns by time of day
            Borrow.aggregate([
                {
                    $match: {
                        borrowDate: dateFilter,
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
            ])
        ]);

        res.status(200).json({
            success: true,
            data: {
                period,
                activeUsers,
                topBorrowers,
                userEngagement,
                readingPatterns
            }
        });
    } catch (error) {
        console.error('Get user analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user analytics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    getStudentDashboard,
    getAdminDashboard,
    getLibrarianDashboard,
    getUserAnalytics
};
