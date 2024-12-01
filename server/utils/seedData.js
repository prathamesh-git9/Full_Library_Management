const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Book = require('../models/Book');
const config = require('../config');

const seedUsers = async () => {
  try {
    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('Users already exist, skipping user seeding');
      return;
    }

    const users = [
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@library.com',
        password: await bcrypt.hash('admin123', 12),
        role: 'admin',
        studentId: 'ADMIN001',
        preferences: {
          notifications: {
            email: true,
            sms: false
          }
        }
      },
      {
        firstName: 'Librarian',
        lastName: 'Smith',
        email: 'librarian@library.com',
        password: await bcrypt.hash('librarian123', 12),
        role: 'librarian',
        studentId: 'LIB001',
        preferences: {
          notifications: {
            email: true,
            sms: true
          }
        }
      },
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@student.com',
        password: await bcrypt.hash('student123', 12),
        role: 'student',
        studentId: 'STU001',
        preferences: {
          notifications: {
            email: true,
            sms: false
          }
        }
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@student.com',
        password: await bcrypt.hash('student123', 12),
        role: 'student',
        studentId: 'STU002',
        preferences: {
          notifications: {
            email: true,
            sms: true
          }
        }
      },
      {
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@student.com',
        password: await bcrypt.hash('student123', 12),
        role: 'student',
        studentId: 'STU003',
        preferences: {
          notifications: {
            email: false,
            sms: true
          }
        }
      }
    ];

    await User.insertMany(users);
    console.log('✅ Users seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  }
};

const seedBooks = async () => {
  try {
    // Check if books already exist
    const existingBooks = await Book.countDocuments();
    if (existingBooks > 0) {
      console.log('Books already exist, skipping book seeding');
      return;
    }

    const books = [
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '978-0-7432-7356-5',
        publisher: 'Scribner',
        publicationYear: 1925,
        genre: 'Fiction',
        description: 'A classic American novel set in the Jazz Age, following the mysterious Jay Gatsby and his obsession with the beautiful Daisy Buchanan.',
        copies: 5,
        availableCopies: 5,
        coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81QuEGw8VPL.jpg',
        averageRating: 4.2,
        ratingsCount: 0
      },
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        isbn: '978-0-06-112008-4',
        publisher: 'J.B. Lippincott & Co.',
        publicationYear: 1960,
        genre: 'Fiction',
        description: 'A gripping tale of racial injustice and childhood innocence in the American South.',
        copies: 4,
        availableCopies: 4,
        coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81gepf1eMqL.jpg',
        averageRating: 4.5,
        ratingsCount: 0
      },
      {
        title: '1984',
        author: 'George Orwell',
        isbn: '978-0-452-28423-4',
        publisher: 'Secker & Warburg',
        publicationYear: 1949,
        genre: 'Dystopian Fiction',
        description: 'A dystopian social science fiction novel about totalitarian control and surveillance.',
        copies: 3,
        availableCopies: 3,
        coverImage: 'https://images-na.ssl-images-amazon.com/images/I/71kxa1-0mfL.jpg',
        averageRating: 4.3,
        ratingsCount: 0
      },
      {
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        isbn: '978-0-14-143951-8',
        publisher: 'T. Egerton, Whitehall',
        publicationYear: 1813,
        genre: 'Romance',
        description: 'A romantic novel that critiques the British landed gentry of the early 19th century.',
        copies: 6,
        availableCopies: 6,
        coverImage: 'https://images-na.ssl-images-amazon.com/images/I/71Q1tPupKjL.jpg',
        averageRating: 4.4,
        ratingsCount: 0
      },
      {
        title: 'The Catcher in the Rye',
        author: 'J.D. Salinger',
        isbn: '978-0-316-76948-0',
        publisher: 'Little, Brown and Company',
        publicationYear: 1951,
        genre: 'Fiction',
        description: 'A coming-of-age story about teenage rebellion and alienation.',
        copies: 4,
        availableCopies: 4,
        coverImage: 'https://images-na.ssl-images-amazon.com/images/I/91HPG31dTwL.jpg',
        averageRating: 3.8,
        ratingsCount: 0
      },
      {
        title: 'Lord of the Flies',
        author: 'William Golding',
        isbn: '978-0-571-05686-9',
        publisher: 'Faber and Faber',
        publicationYear: 1954,
        genre: 'Allegory',
        description: 'A story about a group of British boys stranded on an uninhabited island and their disastrous attempt to govern themselves.',
        copies: 3,
        availableCopies: 3,
        coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81WUAoL-wFL.jpg',
        averageRating: 3.7,
        ratingsCount: 0
      },
      {
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        isbn: '978-0-547-92822-7',
        publisher: 'George Allen & Unwin',
        publicationYear: 1937,
        genre: 'Fantasy',
        description: 'A fantasy novel about a hobbit who goes on an unexpected journey.',
        copies: 5,
        availableCopies: 5,
        coverImage: 'https://images-na.ssl-images-amazon.com/images/I/712cDO7d73L.jpg',
        averageRating: 4.6,
        ratingsCount: 0
      },
      {
        title: 'Harry Potter and the Philosopher\'s Stone',
        author: 'J.K. Rowling',
        isbn: '978-0-7475-3269-9',
        publisher: 'Bloomsbury',
        publicationYear: 1997,
        genre: 'Fantasy',
        description: 'The first book in the Harry Potter series about a young wizard.',
        copies: 8,
        availableCopies: 8,
        coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81YOuOGFCJL.jpg',
        averageRating: 4.7,
        ratingsCount: 0
      },
      {
        title: 'The Chronicles of Narnia',
        author: 'C.S. Lewis',
        isbn: '978-0-06-447119-0',
        publisher: 'Geoffrey Bles',
        publicationYear: 1950,
        genre: 'Fantasy',
        description: 'A series of fantasy novels about children who discover the magical world of Narnia.',
        copies: 4,
        availableCopies: 4,
        coverImage: 'https://images-na.ssl-images-amazon.com/images/I/81Z8dXz0nVL.jpg',
        averageRating: 4.3,
        ratingsCount: 0
      },
      {
        title: 'The Alchemist',
        author: 'Paulo Coelho',
        isbn: '978-0-06-112241-5',
        publisher: 'HarperCollins',
        publicationYear: 1988,
        genre: 'Philosophical Fiction',
        description: 'A philosophical novel about a young Andalusian shepherd who travels from his homeland in Spain to the Egyptian desert in search of treasure.',
        copies: 3,
        availableCopies: 3,
        coverImage: 'https://images-na.ssl-images-amazon.com/images/I/71aFt4+OTOL.jpg',
        averageRating: 3.9,
        ratingsCount: 0
      }
    ];

    await Book.insertMany(books);
    console.log('✅ Books seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding books:', error);
  }
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await seedUsers();
    await seedBooks();
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Default Login Credentials:');
    console.log('Admin: admin@library.com / admin123');
    console.log('Librarian: librarian@library.com / librarian123');
    console.log('Student: john.doe@student.com / student123');
    console.log('Student: jane.smith@student.com / student123');
    console.log('Student: bob.johnson@student.com / student123');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

module.exports = {
  seedDatabase,
  seedUsers,
  seedBooks
};
