const express = require('express');
const router = express.Router();
const {
  getCommentsByBook,
  getUserComments,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  dislikeComment,
  removeReaction,
  addReply,
  getCommentStats,
  getRatingDistribution
} = require('../controllers/commentController');
const { authenticate, requireAdmin, requireAdminOrLibrarian } = require('../middleware/auth');
const {
  validateCreateComment,
  validateUpdateComment,
  validateReply,
  validateCommentQuery,
  validateUserCommentsQuery
} = require('../middleware/commentValidation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - book
 *         - user
 *         - content
 *         - rating
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the comment
 *         book:
 *           type: string
 *           description: Book ID
 *         user:
 *           type: string
 *           description: User ID who made the comment
 *         content:
 *           type: string
 *           description: Comment content
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating from 1 to 5 stars
 *         isApproved:
 *           type: boolean
 *           description: Whether the comment is approved
 *         isEdited:
 *           type: boolean
 *           description: Whether the comment has been edited
 *         editedAt:
 *           type: string
 *           format: date-time
 *           description: When the comment was last edited
 *         likes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               likedAt:
 *                 type: string
 *                 format: date-time
 *         dislikes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               dislikedAt:
 *                 type: string
 *                 format: date-time
 *         replies:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               content:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *               isEdited:
 *                 type: boolean
 *               editedAt:
 *                 type: string
 *                 format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Comment creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /api/comments/book/{bookId}:
 *   get:
 *     summary: Get comments for a book
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Number of comments per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, rating, likeCount, dislikeCount, netScore]
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *       404:
 *         description: Book not found
 */
router.get('/book/:bookId', validateCommentQuery, getCommentsByBook);

/**
 * @swagger
 * /api/comments/user/{userId}:
 *   get:
 *     summary: Get user's comments
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Number of comments per page
 *     responses:
 *       200:
 *         description: User comments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.get('/user/:userId', authenticate, validateUserCommentsQuery, getUserComments);

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookId
 *               - content
 *               - rating
 *             properties:
 *               bookId:
 *                 type: string
 *                 description: Book ID
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: Comment content
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5 stars
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Book not found
 *       409:
 *         description: User already commented on this book
 */
router.post('/', authenticate, validateCreateComment, createComment);

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: Comment content
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5 stars
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Comment not found
 */
router.put('/:id', authenticate, validateUpdateComment, updateComment);

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Comment not found
 */
router.delete('/:id', authenticate, deleteComment);

/**
 * @swagger
 * /api/comments/{id}/like:
 *   post:
 *     summary: Like a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment liked successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 */
router.post('/:id/like', authenticate, likeComment);

/**
 * @swagger
 * /api/comments/{id}/dislike:
 *   post:
 *     summary: Dislike a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment disliked successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 */
router.post('/:id/dislike', authenticate, dislikeComment);

/**
 * @swagger
 * /api/comments/{id}/reaction:
 *   delete:
 *     summary: Remove like/dislike from comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Reaction removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 */
router.delete('/:id/reaction', authenticate, removeReaction);

/**
 * @swagger
 * /api/comments/{id}/reply:
 *   post:
 *     summary: Add reply to comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 500
 *                 description: Reply content
 *     responses:
 *       201:
 *         description: Reply added successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 */
router.post('/:id/reply', authenticate, validateReply, addReply);

/**
 * @swagger
 * /api/comments/stats:
 *   get:
 *     summary: Get comment statistics
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comment statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin/librarian only)
 */
router.get('/stats', authenticate, requireAdminOrLibrarian, getCommentStats);

/**
 * @swagger
 * /api/comments/rating-distribution/{bookId}:
 *   get:
 *     summary: Get rating distribution for a book
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID
 *     responses:
 *       200:
 *         description: Rating distribution retrieved successfully
 *       404:
 *         description: Book not found
 */
router.get('/rating-distribution/:bookId', getRatingDistribution);

module.exports = router;
