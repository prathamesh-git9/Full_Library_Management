const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Book = require('../models/Book');
const User = require('../models/User');

describe('Books API', () => {
    let authToken;
    let userId;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library_test');
    });

    afterAll(async () => {
        await Book.deleteMany({});
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await Book.deleteMany({});
        await User.deleteMany({});

        // Create test user and get auth token
        const user = new User({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@test.com',
            password: 'password123',
            role: 'admin'
        });
        await user.save();
        userId = user._id;

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@test.com',
                password: 'password123'
            });

        authToken = loginResponse.body.data.token;
    });

    describe('GET /api/books', () => {
        it('should get all books', async () => {
            // Create test books
            const books = [
                {
                    title: 'Test Book 1',
                    author: 'Test Author 1',
                    isbn: '1234567890',
                    copies: 5,
                    availableCopies: 5
                },
                {
                    title: 'Test Book 2',
                    author: 'Test Author 2',
                    isbn: '0987654321',
                    copies: 3,
                    availableCopies: 3
                }
            ];

            await Book.insertMany(books);

            const response = await request(app)
                .get('/api/books')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.books).toHaveLength(2);
        });

        it('should filter books by search term', async () => {
            const books = [
                {
                    title: 'JavaScript Guide',
                    author: 'John Doe',
                    isbn: '1234567890',
                    copies: 5,
                    availableCopies: 5
                },
                {
                    title: 'Python Basics',
                    author: 'Jane Smith',
                    isbn: '0987654321',
                    copies: 3,
                    availableCopies: 3
                }
            ];

            await Book.insertMany(books);

            const response = await request(app)
                .get('/api/books?search=JavaScript')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.books).toHaveLength(1);
            expect(response.body.data.books[0].title).toBe('JavaScript Guide');
        });
    });

    describe('POST /api/books', () => {
        it('should create a new book', async () => {
            const bookData = {
                title: 'New Test Book',
                author: 'Test Author',
                isbn: '1111111111',
                publisher: 'Test Publisher',
                publicationYear: 2023,
                genre: 'Fiction',
                description: 'A test book description',
                copies: 5
            };

            const response = await request(app)
                .post('/api/books')
                .set('Authorization', `Bearer ${authToken}`)
                .send(bookData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.book.title).toBe(bookData.title);
            expect(response.body.data.book.availableCopies).toBe(bookData.copies);
        });

        it('should not create book without required fields', async () => {
            const bookData = {
                title: 'Incomplete Book'
                // Missing required fields
            };

            const response = await request(app)
                .post('/api/books')
                .set('Authorization', `Bearer ${authToken}`)
                .send(bookData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/books/:id', () => {
        it('should get a book by ID', async () => {
            const book = new Book({
                title: 'Test Book',
                author: 'Test Author',
                isbn: '1234567890',
                copies: 5,
                availableCopies: 5
            });
            await book.save();

            const response = await request(app)
                .get(`/api/books/${book._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.book.title).toBe('Test Book');
        });

        it('should return 404 for non-existent book', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .get(`/api/books/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });
});
