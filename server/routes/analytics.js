const express = require('express');
const router = express.Router();
const {
    getAnalyticsDashboard,
    getCustomReport
} = require('../controllers/analyticsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get comprehensive analytics dashboard
 *     tags: [Analytics]
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
 *         description: Analytics dashboard data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access only)
 */
router.get('/dashboard', authenticate, requireAdmin, getAnalyticsDashboard);

/**
 * @swagger
 * /api/analytics/custom-report:
 *   post:
 *     summary: Generate custom analytics report
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *               - endDate
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Report start date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Report end date
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [borrowCount, returnCount, overdueCount, totalFines, averageBorrowDays]
 *                 description: Metrics to include in report
 *               filters:
 *                 type: object
 *                 properties:
 *                   userRole:
 *                     type: string
 *                     enum: [student, librarian, admin]
 *                   bookGenre:
 *                     type: string
 *                 description: Filters to apply
 *               groupBy:
 *                 type: string
 *                 enum: [hour, day, week, month]
 *                 default: day
 *                 description: Grouping period
 *     responses:
 *       200:
 *         description: Custom report generated successfully
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access only)
 */
router.post('/custom-report', authenticate, requireAdmin, getCustomReport);

module.exports = router;
