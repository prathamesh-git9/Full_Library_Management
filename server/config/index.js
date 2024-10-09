module.exports = {
  // Server configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  HOST: process.env.HOST || 'localhost',
  
  // Database configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/library_management',
  MONGODB_TEST_URI: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/library_management_test',
  
  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_change_in_production',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',
  
  // Email configuration
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: process.env.EMAIL_PORT || 587,
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@librarymanagement.com',
  
  // File upload configuration
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // Fine configuration
  FINE_PER_DAY: parseFloat(process.env.FINE_PER_DAY) || 1.00,
  MAX_FINE_AMOUNT: parseFloat(process.env.MAX_FINE_AMOUNT) || 50.00,
  BORROW_DURATION_DAYS: parseInt(process.env.BORROW_DURATION_DAYS) || 14,
  RENEWAL_DURATION_DAYS: parseInt(process.env.RENEWAL_DURATION_DAYS) || 7,
  MAX_RENEWALS: parseInt(process.env.MAX_RENEWALS) || 2,
  
  // Frontend URL
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  
  // Admin configuration
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@librarymanagement.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  
  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  SESSION_SECRET: process.env.SESSION_SECRET || 'fallback_session_secret_change_in_production',
  
  // API Documentation
  API_DOCS_URL: process.env.API_DOCS_URL || '/api-docs'
};
