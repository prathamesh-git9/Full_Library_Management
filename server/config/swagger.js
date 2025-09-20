const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Library Management System API',
            version: '1.0.0',
            description: 'A comprehensive library management system API with authentication, book management, borrowing, reservations, and notifications.',
            contact: {
                name: 'Library Management Team',
                email: 'admin@library.com',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000/api',
                description: 'Development server',
            },
            {
                url: 'https://api.library.com/api',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'token',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    required: ['firstName', 'lastName', 'email', 'password', 'role'],
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'The auto-generated id of the user',
                        },
                        firstName: {
                            type: 'string',
                            description: 'User first name',
                        },
                        lastName: {
                            type: 'string',
                            description: 'User last name',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address',
                        },
                        password: {
                            type: 'string',
                            minLength: 6,
                            description: 'User password (hashed)',
                        },
                        role: {
                            type: 'string',
                            enum: ['student', 'librarian', 'admin'],
                            description: 'User role',
                        },
                        studentId: {
                            type: 'string',
                            description: 'Student ID (for students)',
                        },
                        profileImage: {
                            type: 'string',
                            description: 'URL to user profile image',
                        },
                        preferences: {
                            type: 'object',
                            properties: {
                                notifications: {
                                    type: 'object',
                                    properties: {
                                        email: { type: 'boolean' },
                                        sms: { type: 'boolean' },
                                    },
                                },
                            },
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'Whether the user account is active',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'User creation timestamp',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last update timestamp',
                        },
                    },
                },
                Book: {
                    type: 'object',
                    required: ['title', 'author', 'isbn', 'copies'],
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'The auto-generated id of the book',
                        },
                        title: {
                            type: 'string',
                            description: 'Book title',
                        },
                        author: {
                            type: 'string',
                            description: 'Book author',
                        },
                        isbn: {
                            type: 'string',
                            description: 'International Standard Book Number',
                        },
                        publisher: {
                            type: 'string',
                            description: 'Book publisher',
                        },
                        publicationYear: {
                            type: 'integer',
                            description: 'Year of publication',
                        },
                        genre: {
                            type: 'string',
                            description: 'Book genre/category',
                        },
                        description: {
                            type: 'string',
                            description: 'Book description',
                        },
                        copies: {
                            type: 'integer',
                            minimum: 1,
                            description: 'Total number of copies',
                        },
                        availableCopies: {
                            type: 'integer',
                            minimum: 0,
                            description: 'Number of available copies',
                        },
                        coverImage: {
                            type: 'string',
                            description: 'URL to book cover image',
                        },
                        pdfUrl: {
                            type: 'string',
                            description: 'URL to book PDF file',
                        },
                        averageRating: {
                            type: 'number',
                            minimum: 0,
                            maximum: 5,
                            description: 'Average rating from user reviews',
                        },
                        ratingsCount: {
                            type: 'integer',
                            minimum: 0,
                            description: 'Total number of ratings',
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'Whether the book is active',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Book creation timestamp',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last update timestamp',
                        },
                    },
                },
                Borrow: {
                    type: 'object',
                    required: ['user', 'book', 'borrowDate', 'dueDate'],
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'The auto-generated id of the borrow record',
                        },
                        user: {
                            type: 'string',
                            description: 'User ID who borrowed the book',
                        },
                        book: {
                            type: 'string',
                            description: 'Book ID that was borrowed',
                        },
                        borrowDate: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Date when the book was borrowed',
                        },
                        dueDate: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Date when the book is due',
                        },
                        returnDate: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Date when the book was returned',
                        },
                        fineAmount: {
                            type: 'number',
                            minimum: 0,
                            description: 'Fine amount for overdue return',
                        },
                        finePaid: {
                            type: 'boolean',
                            description: 'Whether the fine has been paid',
                        },
                        status: {
                            type: 'string',
                            enum: ['borrowed', 'returned', 'overdue'],
                            description: 'Current status of the borrow',
                        },
                        renewals: {
                            type: 'integer',
                            minimum: 0,
                            description: 'Number of times the book has been renewed',
                        },
                        notes: {
                            type: 'string',
                            description: 'Additional notes about the borrow',
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'Whether the borrow record is active',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Borrow creation timestamp',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last update timestamp',
                        },
                    },
                },
                Reservation: {
                    type: 'object',
                    required: ['user', 'book', 'reservationDate', 'expiryDate'],
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'The auto-generated id of the reservation',
                        },
                        user: {
                            type: 'string',
                            description: 'User ID who made the reservation',
                        },
                        book: {
                            type: 'string',
                            description: 'Book ID that was reserved',
                        },
                        reservationDate: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Date when the reservation was made',
                        },
                        expiryDate: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Date when the reservation expires',
                        },
                        status: {
                            type: 'string',
                            enum: ['active', 'fulfilled', 'expired', 'cancelled'],
                            description: 'Current status of the reservation',
                        },
                        priority: {
                            type: 'integer',
                            minimum: 1,
                            description: 'Priority in the reservation queue',
                        },
                        fulfilledAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Date when the reservation was fulfilled',
                        },
                        fulfilledBy: {
                            type: 'string',
                            description: 'User ID who fulfilled the reservation',
                        },
                        notes: {
                            type: 'string',
                            description: 'Additional notes about the reservation',
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'Whether the reservation is active',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Reservation creation timestamp',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last update timestamp',
                        },
                    },
                },
                Comment: {
                    type: 'object',
                    required: ['book', 'user', 'content', 'rating'],
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'The auto-generated id of the comment',
                        },
                        book: {
                            type: 'string',
                            description: 'Book ID',
                        },
                        user: {
                            type: 'string',
                            description: 'User ID who made the comment',
                        },
                        content: {
                            type: 'string',
                            minLength: 10,
                            maxLength: 1000,
                            description: 'Comment content',
                        },
                        rating: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 5,
                            description: 'Rating from 1 to 5 stars',
                        },
                        isApproved: {
                            type: 'boolean',
                            description: 'Whether the comment is approved',
                        },
                        isEdited: {
                            type: 'boolean',
                            description: 'Whether the comment has been edited',
                        },
                        editedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'When the comment was last edited',
                        },
                        likes: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    user: { type: 'string' },
                                    likedAt: { type: 'string', format: 'date-time' },
                                },
                            },
                            description: 'Users who liked the comment',
                        },
                        dislikes: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    user: { type: 'string' },
                                    dislikedAt: { type: 'string', format: 'date-time' },
                                },
                            },
                            description: 'Users who disliked the comment',
                        },
                        replies: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    user: { type: 'string' },
                                    content: { type: 'string' },
                                    createdAt: { type: 'string', format: 'date-time' },
                                    isEdited: { type: 'boolean' },
                                    editedAt: { type: 'string', format: 'date-time' },
                                },
                            },
                            description: 'Replies to the comment',
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'Whether the comment is active',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Comment creation timestamp',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last update timestamp',
                        },
                    },
                },
                Notification: {
                    type: 'object',
                    required: ['user', 'type', 'title', 'message'],
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'The auto-generated id of the notification',
                        },
                        user: {
                            type: 'string',
                            description: 'User ID who will receive the notification',
                        },
                        type: {
                            type: 'string',
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
                                'general',
                            ],
                            description: 'Type of notification',
                        },
                        title: {
                            type: 'string',
                            maxLength: 200,
                            description: 'Notification title',
                        },
                        message: {
                            type: 'string',
                            maxLength: 1000,
                            description: 'Notification message',
                        },
                        isRead: {
                            type: 'boolean',
                            description: 'Whether the notification has been read',
                        },
                        readAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'When the notification was read',
                        },
                        priority: {
                            type: 'string',
                            enum: ['low', 'medium', 'high', 'urgent'],
                            description: 'Notification priority',
                        },
                        emailSent: {
                            type: 'boolean',
                            description: 'Whether email notification was sent',
                        },
                        emailSentAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'When email notification was sent',
                        },
                        relatedEntity: {
                            type: 'object',
                            properties: {
                                type: {
                                    type: 'string',
                                    enum: ['book', 'borrow', 'reservation', 'user', 'comment'],
                                },
                                id: { type: 'string' },
                            },
                            description: 'Related entity information',
                        },
                        metadata: {
                            type: 'object',
                            description: 'Additional metadata',
                        },
                        expiresAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'When the notification expires',
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'Whether the notification is active',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Notification creation timestamp',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last update timestamp',
                        },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                        },
                        message: {
                            type: 'string',
                            description: 'Error message',
                        },
                        error: {
                            type: 'string',
                            description: 'Detailed error information (development only)',
                        },
                    },
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true,
                        },
                        message: {
                            type: 'string',
                            description: 'Success message',
                        },
                        data: {
                            type: 'object',
                            description: 'Response data',
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
            {
                cookieAuth: [],
            },
        ],
    },
    apis: ['./server/routes/*.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

const swaggerOptions = {
    customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #1f2937; }
    .swagger-ui .scheme-container { background: #f9fafb; padding: 20px; border-radius: 8px; }
  `,
    customSiteTitle: 'Library Management System API',
    customfavIcon: '/favicon.ico',
};

module.exports = {
    swaggerUi,
    specs,
    swaggerOptions,
};
