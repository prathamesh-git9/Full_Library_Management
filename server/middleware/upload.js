const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Ensure upload directory exists
const uploadDir = config.UPLOAD_PATH;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create subdirectories for different file types
const subdirs = ['books', 'covers', 'pdfs', 'profiles'];
subdirs.forEach(subdir => {
  const subdirPath = path.join(uploadDir, subdir);
  if (!fs.existsSync(subdirPath)) {
    fs.mkdirSync(subdirPath, { recursive: true });
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedMimes = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'application/pdf': '.pdf'
  };

  if (allowedMimes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadDir;
    
    // Determine subdirectory based on file type
    if (file.mimetype.startsWith('image/')) {
      if (file.fieldname === 'coverImage') {
        uploadPath = path.join(uploadDir, 'covers');
      } else if (file.fieldname === 'profileImage') {
        uploadPath = path.join(uploadDir, 'profiles');
      } else {
        uploadPath = path.join(uploadDir, 'books');
      }
    } else if (file.mimetype === 'application/pdf') {
      uploadPath = path.join(uploadDir, 'pdfs');
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${name}-${uniqueSuffix}${ext}`;
    
    cb(null, filename);
  }
});

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE, // 10MB default
    files: 5 // Maximum 5 files per request
  }
});

// Specific upload configurations
const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

const uploadMultiple = (fieldName, maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

const uploadFields = (fields) => {
  return upload.fields(fields);
};

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size allowed is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files allowed per request.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  }
  
  if (error.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Utility function to delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Utility function to get file URL
const getFileUrl = (req, filePath) => {
  if (!filePath) return null;
  
  // Remove the upload directory from the path to get relative path
  const relativePath = filePath.replace(uploadDir, '').replace(/\\/g, '/');
  return `${req.protocol}://${req.get('host')}/uploads${relativePath}`;
};

// Utility function to validate file type
const validateFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.mimetype);
};

// Utility function to get file size in MB
const getFileSizeInMB = (file) => {
  return (file.size / (1024 * 1024)).toFixed(2);
};

// Clean up old files (can be used in a cron job)
const cleanupOldFiles = (daysOld = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const cleanupDirectory = (dir) => {
    try {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          cleanupDirectory(filePath);
        } else if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old file: ${filePath}`);
        }
      });
    } catch (error) {
      console.error(`Error cleaning up directory ${dir}:`, error);
    }
  };
  
  subdirs.forEach(subdir => {
    const subdirPath = path.join(uploadDir, subdir);
    cleanupDirectory(subdirPath);
  });
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleUploadError,
  deleteFile,
  getFileUrl,
  validateFileType,
  getFileSizeInMB,
  cleanupOldFiles
};
