const mongoose = require('mongoose');
require('dotenv').config();
const { seedDatabase } = require('../server/utils/seedData');

const runSeed = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('📡 Connected to MongoDB');

        // Run seeding
        await seedDatabase();

        // Close connection
        await mongoose.connection.close();
        console.log('📡 Database connection closed');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

runSeed();
