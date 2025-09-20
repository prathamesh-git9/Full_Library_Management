const Book = require('../models/Book');
const User = require('../models/User');
const Borrow = require('../models/Borrow');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');

// @desc    Advanced search with filters and sorting
// @route   GET /api/search/books
// @access  Public
const searchBooks = async (req, res) => {
    try {
        const {
            query = '',
            genre = '',
            author = '',
            year = '',
            rating = '',
            availability = '',
            sortBy = 'relevance',
            sortOrder = 'desc',
            page = 1,
            limit = 20
        } = req.query;

        // Build search criteria
        const searchCriteria = { isActive: true };

        // Text search
        if (query) {
            searchCriteria.$or = [
                { title: { $regex: query, $options: 'i' } },
                { author: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { isbn: { $regex: query, $options: 'i' } }
            ];
        }

        // Genre filter
        if (genre) {
            searchCriteria.genre = { $regex: genre, $options: 'i' };
        }

        // Author filter
        if (author) {
            searchCriteria.author = { $regex: author, $options: 'i' };
        }

        // Year filter
        if (year) {
            searchCriteria.publicationYear = parseInt(year);
        }

        // Rating filter
        if (rating) {
            const minRating = parseFloat(rating);
            searchCriteria.averageRating = { $gte: minRating };
        }

        // Availability filter
        if (availability === 'available') {
            searchCriteria.availableCopies = { $gt: 0 };
        } else if (availability === 'unavailable') {
            searchCriteria.availableCopies = 0;
        }

        // Build sort criteria
        let sortCriteria = {};
        switch (sortBy) {
            case 'title':
                sortCriteria.title = sortOrder === 'asc' ? 1 : -1;
                break;
            case 'author':
                sortCriteria.author = sortOrder === 'asc' ? 1 : -1;
                break;
            case 'year':
                sortCriteria.publicationYear = sortOrder === 'asc' ? 1 : -1;
                break;
            case 'rating':
                sortCriteria.averageRating = sortOrder === 'asc' ? 1 : -1;
                break;
            case 'popularity':
                sortCriteria.ratingsCount = sortOrder === 'asc' ? 1 : -1;
                break;
            case 'relevance':
            default:
                // For relevance, we'll use text score if there's a query
                if (query) {
                    sortCriteria = { score: { $meta: 'textScore' } };
                } else {
                    sortCriteria.createdAt = -1;
                }
                break;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute search
        let searchQuery = Book.find(searchCriteria);

        // Add text search if query exists
        if (query) {
            searchQuery = searchQuery.find(
                { $text: { $search: query } },
                { score: { $meta: 'textScore' } }
            );
        }

        const books = await searchQuery
            .sort(sortCriteria)
            .skip(skip)
            .limit(parseInt(limit))
            .select('-__v');

        const total = await Book.countDocuments(searchCriteria);

        res.status(200).json({
            success: true,
            data: {
                books,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalBooks: total,
                    hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
                    hasPrev: parseInt(page) > 1
                },
                searchParams: {
                    query,
                    genre,
                    author,
                    year,
                    rating,
                    availability,
                    sortBy,
                    sortOrder
                }
            }
        });
    } catch (error) {
        console.error('Search books error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search books',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Get book recommendations for user
// @route   GET /api/search/recommendations
// @access  Private
const getBookRecommendations = async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 10 } = req.query;

        // Get user's borrowing history
        const userBorrows = await Borrow.find({
            user: userId,
            isActive: true,
            status: 'returned'
        }).populate('book');

        if (userBorrows.length === 0) {
            // If no borrowing history, return popular books
            const popularBooks = await Book.find({ isActive: true })
                .sort({ ratingsCount: -1, averageRating: -1 })
                .limit(parseInt(limit));

            return res.status(200).json({
                success: true,
                data: {
                    recommendations: popularBooks,
                    type: 'popular'
                }
            });
        }

        // Get user's preferred genres
        const userGenres = {};
        userBorrows.forEach(borrow => {
            if (borrow.book && borrow.book.genre) {
                userGenres[borrow.book.genre] = (userGenres[borrow.book.genre] || 0) + 1;
            }
        });

        // Get user's preferred authors
        const userAuthors = {};
        userBorrows.forEach(borrow => {
            if (borrow.book && borrow.book.author) {
                userAuthors[borrow.book.author] = (userAuthors[borrow.book.author] || 0) + 1;
            }
        });

        // Get books user has already borrowed
        const borrowedBookIds = userBorrows.map(borrow => borrow.book._id);

        // Build recommendation criteria
        const recommendationCriteria = {
            isActive: true,
            _id: { $nin: borrowedBookIds },
            availableCopies: { $gt: 0 }
        };

        // Get recommendations based on preferred genres
        const genreRecommendations = await Book.find({
            ...recommendationCriteria,
            genre: { $in: Object.keys(userGenres) }
        })
            .sort({ averageRating: -1, ratingsCount: -1 })
            .limit(Math.ceil(parseInt(limit) / 2));

        // Get recommendations based on preferred authors
        const authorRecommendations = await Book.find({
            ...recommendationCriteria,
            author: { $in: Object.keys(userAuthors) }
        })
            .sort({ averageRating: -1, ratingsCount: -1 })
            .limit(Math.ceil(parseInt(limit) / 2));

        // Get collaborative filtering recommendations
        const collaborativeRecommendations = await getCollaborativeRecommendations(userId, parseInt(limit));

        // Combine and deduplicate recommendations
        const allRecommendations = [
            ...genreRecommendations,
            ...authorRecommendations,
            ...collaborativeRecommendations
        ];

        const uniqueRecommendations = allRecommendations.filter((book, index, self) =>
            index === self.findIndex(b => b._id.toString() === book._id.toString())
        );

        // Sort by relevance score
        const scoredRecommendations = uniqueRecommendations.map(book => {
            let score = 0;

            // Genre match score
            if (userGenres[book.genre]) {
                score += userGenres[book.genre] * 2;
            }

            // Author match score
            if (userAuthors[book.author]) {
                score += userAuthors[book.author] * 3;
            }

            // Rating score
            score += (book.averageRating || 0) * 1.5;

            // Popularity score
            score += Math.log(book.ratingsCount + 1) * 0.5;

            return { ...book.toObject(), relevanceScore: score };
        });

        scoredRecommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

        res.status(200).json({
            success: true,
            data: {
                recommendations: scoredRecommendations.slice(0, parseInt(limit)),
                type: 'personalized',
                userPreferences: {
                    topGenres: Object.entries(userGenres)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)
                        .map(([genre, count]) => ({ genre, count })),
                    topAuthors: Object.entries(userAuthors)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)
                        .map(([author, count]) => ({ author, count }))
                }
            }
        });
    } catch (error) {
        console.error('Get book recommendations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get book recommendations',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Helper function for collaborative filtering
const getCollaborativeRecommendations = async (userId, limit) => {
    try {
        // Find users with similar borrowing patterns
        const userBorrows = await Borrow.find({
            user: userId,
            isActive: true,
            status: 'returned'
        }).populate('book');

        if (userBorrows.length === 0) return [];

        const userBookIds = userBorrows.map(borrow => borrow.book._id);

        // Find other users who borrowed similar books
        const similarUsers = await Borrow.aggregate([
            {
                $match: {
                    user: { $ne: userId },
                    book: { $in: userBookIds },
                    isActive: true,
                    status: 'returned'
                }
            },
            {
                $group: {
                    _id: '$user',
                    commonBooks: { $sum: 1 }
                }
            },
            {
                $match: {
                    commonBooks: { $gte: 2 } // At least 2 books in common
                }
            },
            {
                $sort: { commonBooks: -1 }
            },
            {
                $limit: 10
            }
        ]);

        if (similarUsers.length === 0) return [];

        const similarUserIds = similarUsers.map(user => user._id);

        // Get books that similar users borrowed but current user hasn't
        const recommendations = await Borrow.aggregate([
            {
                $match: {
                    user: { $in: similarUserIds },
                    book: { $nin: userBookIds },
                    isActive: true,
                    status: 'returned'
                }
            },
            {
                $group: {
                    _id: '$book',
                    borrowCount: { $sum: 1 }
                }
            },
            {
                $sort: { borrowCount: -1 }
            },
            {
                $limit: limit
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
                $match: {
                    'bookDetails.isActive': true,
                    'bookDetails.availableCopies': { $gt: 0 }
                }
            },
            {
                $replaceRoot: { newRoot: '$bookDetails' }
            }
        ]);

        return recommendations;
    } catch (error) {
        console.error('Collaborative filtering error:', error);
        return [];
    }
};

// @desc    Get search suggestions/autocomplete
// @route   GET /api/search/suggestions
// @access  Public
const getSearchSuggestions = async (req, res) => {
    try {
        const { query = '', type = 'all' } = req.query;

        if (!query || query.length < 2) {
            return res.status(200).json({
                success: true,
                data: { suggestions: [] }
            });
        }

        const suggestions = [];

        if (type === 'all' || type === 'books') {
            // Book title suggestions
            const bookTitles = await Book.find({
                title: { $regex: query, $options: 'i' },
                isActive: true
            })
                .select('title')
                .limit(5);

            suggestions.push(...bookTitles.map(book => ({
                type: 'book',
                text: book.title,
                category: 'Books'
            })));
        }

        if (type === 'all' || type === 'authors') {
            // Author suggestions
            const authors = await Book.distinct('author', {
                author: { $regex: query, $options: 'i' },
                isActive: true
            });

            suggestions.push(...authors.slice(0, 5).map(author => ({
                type: 'author',
                text: author,
                category: 'Authors'
            })));
        }

        if (type === 'all' || type === 'genres') {
            // Genre suggestions
            const genres = await Book.distinct('genre', {
                genre: { $regex: query, $options: 'i' },
                isActive: true
            });

            suggestions.push(...genres.slice(0, 5).map(genre => ({
                type: 'genre',
                text: genre,
                category: 'Genres'
            })));
        }

        res.status(200).json({
            success: true,
            data: { suggestions }
        });
    } catch (error) {
        console.error('Get search suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get search suggestions',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// @desc    Get trending books
// @route   GET /api/search/trending
// @access  Public
const getTrendingBooks = async (req, res) => {
    try {
        const { period = '7d', limit = 10 } = req.query;

        // Calculate date range
        const now = new Date();
        let startDate;

        switch (period) {
            case '1d':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        // Get trending books based on recent borrows
        const trendingBooks = await Borrow.aggregate([
            {
                $match: {
                    borrowDate: { $gte: startDate },
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
                $match: {
                    'bookDetails.isActive': true
                }
            },
            {
                $project: {
                    book: '$bookDetails',
                    borrowCount: 1,
                    uniqueBorrowerCount: { $size: '$uniqueBorrowers' },
                    trendScore: {
                        $add: [
                            '$borrowCount',
                            { $multiply: [{ $size: '$uniqueBorrowers' }, 0.5] }
                        ]
                    }
                }
            },
            {
                $sort: { trendScore: -1 }
            },
            {
                $limit: parseInt(limit)
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                trendingBooks,
                period,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Get trending books error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get trending books',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

module.exports = {
    searchBooks,
    getBookRecommendations,
    getSearchSuggestions,
    getTrendingBooks
};
