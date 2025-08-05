const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../uploads');
const chatUploadsDir = path.join(uploadDir, 'chat');
const thumbnailsDir = path.join(uploadDir, 'thumbnails');

[uploadDir, chatUploadsDir, thumbnailsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, chatUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    // Audio
    'audio/mpeg',
    'audio/mp4',
    'audio/ogg',
    'audio/wav',
    // Video
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime'
  ];

  const maxFileSize = 50 * 1024 * 1024; // 50MB

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 5 // Max 5 files per upload
  }
});

/**
 * Get file type category from mime type
 */
const getFileTypeCategory = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'file';
};

/**
 * Generate file URL for serving
 */
const generateFileUrl = (filename) => {
  return `/api/chat/files/${filename}`;
};

/**
 * Generate thumbnail URL for images
 */
const generateThumbnailUrl = (filename) => {
  return `/api/chat/thumbnails/${filename}`;
};

/**
 * Create thumbnail for image files
 */
const createThumbnail = async (filePath, thumbnailPath, maxWidth = 300, maxHeight = 300) => {
  // This is a placeholder - in production, you'd use a library like Sharp or Jimp
  // For now, we'll just copy the file
  try {
    fs.copyFileSync(filePath, thumbnailPath);
    return true;
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    return false;
  }
};

/**
 * Process uploaded file and create attachment record
 */
const processFileUpload = async (file, userId) => {
  try {
    const fileType = getFileTypeCategory(file.mimetype);
    const fileUrl = generateFileUrl(file.filename);
    
    const attachment = {
      fileName: file.filename,
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      filePath: file.path,
      fileUrl: fileUrl,
      uploadedBy: userId
    };

    // Create thumbnail for images
    if (fileType === 'image') {
      const thumbnailFilename = `thumb_${file.filename}`;
      const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
      
      const thumbnailCreated = await createThumbnail(file.path, thumbnailPath);
      if (thumbnailCreated) {
        attachment.thumbnailPath = thumbnailPath;
        attachment.thumbnailUrl = generateThumbnailUrl(thumbnailFilename);
      }
    }

    return attachment;
  } catch (error) {
    console.error('Error processing file upload:', error);
    throw error;
  }
};

/**
 * Delete uploaded file
 */
const deleteFile = async (filePath, thumbnailPath = null) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    if (thumbnailPath && fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Upload file to specific directory
 */
const uploadFile = async (file, directory = 'general') => {
  try {
    // Create directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../uploads', directory);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Write file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Generate URL
    const fileUrl = `/api/uploads/${directory}/${filename}`;

    return {
      filename,
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      filePath,
      url: fileUrl
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

module.exports = {
  upload,
  processFileUpload,
  deleteFile,
  uploadFile,
  getFileTypeCategory,
  generateFileUrl,
  generateThumbnailUrl,
  chatUploadsDir,
  thumbnailsDir
}; 