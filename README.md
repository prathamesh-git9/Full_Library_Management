# 📚 Library Management System

A comprehensive, full-stack library management system built with Node.js, Express.js, React, and MongoDB. This system provides complete functionality for managing books, users, borrowing, reservations, and notifications.

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Librarian, Student)
- Secure password hashing with bcrypt
- Password reset functionality
- Session management

### 📖 Book Management
- Complete CRUD operations for books
- Book search and filtering
- Category and genre management
- Book ratings and reviews
- PDF upload and online reading
- Book statistics and analytics

### 👥 User Management
- User registration and profile management
- Student ID management
- User preferences and settings
- User activity tracking

### 📚 Borrowing System
- Book borrowing and returning
- Due date tracking
- Automatic fine calculation
- Book renewal system
- Overdue notifications

### 📋 Reservations
- Book reservation system
- Priority queue management
- Reservation notifications
- Automatic fulfillment

### 🔔 Notifications
- Email notifications for due dates
- Overdue notices
- Reservation availability alerts
- System announcements
- Real-time notification system

### 📊 Dashboards
- Student dashboard with personal stats
- Admin dashboard with system analytics
- Librarian dashboard for daily operations
- Comprehensive reporting

### 🎨 Modern UI/UX
- Responsive React frontend
- TailwindCSS styling
- Dark/light theme support
- Mobile-friendly design
- Intuitive navigation

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Nodemailer** - Email service
- **Multer** - File uploads
- **Swagger** - API documentation

### Frontend
- **React 18** - UI library
- **Redux Toolkit** - State management
- **React Router** - Routing
- **TailwindCSS** - Styling
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Lucide React** - Icons

### DevOps & Tools
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Jest** - Testing framework
- **React Testing Library** - Component testing
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/prathamesh-git9/Full_Library_Management.git
   cd Full_Library_Management
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/library_management
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   JWT_COOKIE_EXPIRE=7
   
   # Server
   NODE_ENV=development
   PORT=5000
   
   # Library Settings
   FINE_PER_DAY=1.00
   BORROW_DURATION_DAYS=14
   RENEWAL_DURATION_DAYS=7
   MAX_RENEWALS=2
   
   # Client
   CLIENT_URL=http://localhost:3000
   
   # Admin
   ADMIN_EMAIL=admin@library.com
   ADMIN_PASSWORD=admin123
   
   # Email (Optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=noreply@library.com
   ```

5. **Seed the database**
   ```bash
   npm run seed
   ```

6. **Start the development servers**
   
   Backend (Terminal 1):
   ```bash
   npm run dev
   ```
   
   Frontend (Terminal 2):
   ```bash
   cd client
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

1. **Clone and navigate to the project**
   ```bash
   git clone https://github.com/prathamesh-git9/Full_Library_Management.git
   cd Full_Library_Management
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Update .env with your production values
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Seed the database**
   ```bash
   docker-compose exec backend npm run seed
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs

### Manual Docker Build

1. **Build and run MongoDB**
   ```bash
   docker run -d --name library-mongodb -p 27017:27017 mongo:7.0
   ```

2. **Build and run the backend**
   ```bash
   docker build -t library-backend .
   docker run -d --name library-backend -p 5000:5000 --link library-mongodb:mongodb library-backend
   ```

3. **Build and run the frontend**
   ```bash
   cd client
   docker build -t library-frontend .
   docker run -d --name library-frontend -p 3000:3000 library-frontend
   ```

## 📋 Default Login Credentials

After seeding the database, you can use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@library.com | admin123 |
| Librarian | librarian@library.com | librarian123 |
| Student | john.doe@student.com | student123 |
| Student | jane.smith@student.com | student123 |
| Student | bob.johnson@student.com | student123 |

## 🧪 Testing

### Backend Tests
```bash
npm test
```

### Frontend Tests
```bash
cd client
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

## 📚 API Documentation

The API documentation is available at `/api-docs` when the server is running. It includes:

- Complete endpoint documentation
- Request/response schemas
- Authentication requirements
- Example requests and responses
- Interactive testing interface

## 🏗️ Project Structure

```
Full_Library_Management/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   ├── store/         # Redux store
│   │   └── utils/         # Utility functions
│   ├── public/            # Static assets
│   └── package.json
├── server/                # Express backend
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   └── utils/           # Utility functions
├── scripts/             # Database scripts
├── uploads/            # File uploads
├── docker-compose.yml  # Docker configuration
├── Dockerfile         # Backend Docker image
└── README.md
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/library_management` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRE` | JWT expiration time | `7d` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `FINE_PER_DAY` | Daily fine amount | `1.00` |
| `BORROW_DURATION_DAYS` | Default borrow duration | `14` |
| `CLIENT_URL` | Frontend URL | `http://localhost:3000` |

### Library Settings

You can customize library behavior through environment variables:

- **Fine System**: Configure daily fine rates and grace periods
- **Borrow Duration**: Set default and maximum borrow periods
- **Renewal Policy**: Configure renewal limits and duration
- **Notification Settings**: Email and SMS notification preferences

## 🚀 Deployment

### Production Deployment

1. **Set production environment variables**
2. **Use a production MongoDB instance**
3. **Configure email service for notifications**
4. **Set up SSL certificates**
5. **Use a reverse proxy (Nginx)**
6. **Enable logging and monitoring**

### Cloud Deployment

The application is ready for deployment on:
- **AWS** (EC2, RDS, S3)
- **Google Cloud Platform**
- **Azure**
- **Heroku**
- **DigitalOcean**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/prathamesh-git9/Full_Library_Management/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/) - Web framework
- [React](https://reactjs.org/) - UI library
- [MongoDB](https://www.mongodb.com/) - Database
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [Redux Toolkit](https://redux-toolkit.js.org/) - State management

## 📈 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Integration with external book APIs
- [ ] Multi-language support
- [ ] Advanced reporting features
- [ ] Barcode scanning
- [ ] RFID integration
- [ ] Advanced search with Elasticsearch

---

**Made with ❤️ by the Library Management Team**
