const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Serve uploaded files with proper error handling
router.get('/:category/:filename', (req, res) => {
  const { category, filename } = req.params;
  
  // Validate category to prevent directory traversal
  const allowedCategories = ['professional-profiles', 'profile-pictures', 'payment-proofs', 'thumbnails', 'chat'];
  if (!allowedCategories.includes(category)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid category' 
    });
  }
  
  // Construct file path
  const filePath = path.join(__dirname, '../uploads', category, filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ 
      success: false, 
      message: 'File not found' 
    });
  }
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  // Remove restrictive CSP headers for images
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Cross-Origin-Resource-Policy');
  
  // Determine content type based on file extension
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  
  // Stream the file
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
  
  // Handle stream errors
  stream.on('error', (error) => {
    console.error('Error streaming file:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Error serving file' 
      });
    }
  });
});

// Handle OPTIONS requests for CORS preflight
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.sendStatus(200);
});

module.exports = router;
