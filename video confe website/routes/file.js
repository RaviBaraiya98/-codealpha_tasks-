const express = require('express');
const router = express.Router();
const { uploadFile, getFile, getRoomFiles, downloadFile, deleteFile } = require('../controllers/fileController');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Routes that require authentication
router.post('/:roomId', authenticate, upload.single('file'), uploadFile);
router.get('/:roomId/files', authenticate, getRoomFiles);

// Route to get file (no auth for direct download)
router.get('/:roomId/:filename', getFile);

// New routes
router.post('/upload', authenticate, uploadFile);
router.get('/download/:filename', authenticate, downloadFile);
router.delete('/:filename', authenticate, deleteFile);

module.exports = router;