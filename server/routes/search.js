const express = require('express');
const router = express.Router();
const {
    searchBooks,
    getBookRecommendations,
    getSearchSuggestions,
    getTrendingBooks
} = require('../controllers/searchController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * /api/search/books:
 *   get:
 *     summary: Advanced book search with filters
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter by author
 *       - in: query
 *         name: year
 *         schema:
 *           type: string
 *         description: Filter by publication year
 *       - in: query
 *         name: rating
 *         schema:
 *           type: string
 *         description: Minimum rating filter
 *       - in: query
 *         name: availability
 *         schema:
 *           type: string
 *           enum: [available, unavailable]
 *         description: Filter by availability
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevance, title, author, year, rating, popularity]
 *           default: relevance
 *         description: Sort criteria
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get('/books', searchBooks);

/**
 * @swagger
 * /api/search/recommendations:
 *   get:
 *     summary: Get personalized book recommendations
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of recommendations
 *     responses:
 *       200:
 *         description: Book recommendations retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/recommendations', authenticate, getBookRecommendations);

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Get search suggestions/autocomplete
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, books, authors, genres]
 *           default: all
 *         description: Type of suggestions
 *     responses:
 *       200:
 *         description: Search suggestions retrieved successfully
 */
router.get('/suggestions', getSearchSuggestions);

/**
 * @swagger
 * /api/search/trending:
 *   get:
 *     summary: Get trending books
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1d, 7d, 30d]
 *           default: 7d
 *         description: Trending period
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of trending books
 *     responses:
 *       200:
 *         description: Trending books retrieved successfully
 */
router.get('/trending', getTrendingBooks);

module.exports = router;
