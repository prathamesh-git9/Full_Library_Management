const express = require('express');
const router = express.Router();
const {
  getStudentDashboard,
  getAdminDashboard,
  getLibrarianDashboard,
  getUserAnalytics
} = require('../controllers/dashboardController');
const { authenticate, requireAdmin, requireAdminOrLibrarian, requireStudent } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardData:
 *       type: object
 *       properties:
 *         currentBorrows:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Borrow'
 *         overdueBorrows:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Borrow'
 *         recentBorrows:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Borrow'
 *         totalFines:
 *           type: number
 *         userComments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comment'
 *         readingStats:
 *           type: object
 *           properties:
 *             totalBooksRead:
 *               type: integer
 *             totalBorrowDays:
 *               type: number
 *         favoriteCategories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               count:
 *                 type: integer
 */

/**
 * @swagger
 * /api/dashboard/student:
 *   get:
 *     summary: Get student dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DashboardData'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (student access only)
 */
router.get('/student', authenticate, requireStudent, getStudentDashboard);

/**
 * @swagger
 * /api/dashboard/admin:
 *   get:
 *     summary: Get admin dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: integer
 *                         totalBooks:
 *                           type: integer
 *                         totalBorrows:
 *                           type: integer
 *                         totalComments:
 *                           type: integer
 *                         overdueCount:
 *                           type: integer
 *                         totalFines:
 *                           type: number
 *                         unpaidFines:
 *                           type: number
 *                     userStats:
 *                       type: array
 *                     bookStats:
 *                       type: object
 *                     categoryStats:
 *                       type: array
 *                     overdueStats:
 *                       type: object
 *                     fineStats:
 *                       type: object
 *                     recentActivity:
 *                       type: array
 *                     topBooks:
 *                       type: array
 *                     monthlyStats:
 *                       type: array
 *                     userGrowth:
 *                       type: array
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access only)
 */
router.get('/admin', authenticate, requireAdmin, getAdminDashboard);

/**
 * @swagger
 * /api/dashboard/librarian:
 *   get:
 *     summary: Get librarian dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Librarian dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     overdueBooks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Borrow'
 *                     lowStockBooks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Book'
 *                     pendingReservations:
 *                       type: array
 *                     recentReturns:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Borrow'
 *                     todayBorrows:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Borrow'
 *                     weeklyStats:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (librarian access only)
 */
router.get('/librarian', authenticate, requireAdminOrLibrarian, getLibrarianDashboard);

/**
 * @swagger
 * /api/dashboard/analytics:
 *   get:
 *     summary: Get user analytics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Analytics period
 *     responses:
 *       200:
 *         description: User analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: string
 *                     activeUsers:
 *                       type: array
 *                     topBorrowers:
 *                       type: array
 *                     userEngagement:
 *                       type: array
 *                     readingPatterns:
 *                       type: array
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access only)
 */
router.get('/analytics', authenticate, requireAdmin, getUserAnalytics);

module.exports = router;
