const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../models/User');

describe('Authentication API', () => {
    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library_test');
    });

    afterAll(async () => {
        // Clean up and close connection
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clean up before each test
        await User.deleteMany({});
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@test.com',
                password: 'password123',
                role: 'student',
                studentId: 'STU001'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(userData.email);
            expect(response.body.data.token).toBeDefined();
        });

        it('should not register user with duplicate email', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@test.com',
                password: 'password123',
                role: 'student'
            };

            // Register first user
            await request(app)
                .post('/api/auth/register')
                .send(userData);

            // Try to register with same email
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should validate required fields', async () => {
            const userData = {
                firstName: 'John',
                // Missing required fields
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create a test user
            const user = new User({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@test.com',
                password: 'password123',
                role: 'student',
                studentId: 'STU001'
            });
            await user.save();
        });

        it('should login with valid credentials', async () => {
            const loginData = {
                email: 'john.doe@test.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(loginData.email);
            expect(response.body.data.token).toBeDefined();
        });

        it('should not login with invalid credentials', async () => {
            const loginData = {
                email: 'john.doe@test.com',
                password: 'wrongpassword'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});
