const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload file to room
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { roomId } = req.params;
    const userId = req.user.id;
    
    // Find room
    const room = await Room.findOne({ roomId });
    
    if (!room) {
      // Delete the uploaded file if room doesn't exist
      fs.unlinkSync(req.file.path);
      
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Add file to room's shared files
    const fileData = {
      name: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      type: req.file.mimetype,
      uploadedBy: userId,
      uploadedAt: new Date()
    };
    
    room.sharedFiles.push(fileData);
    await room.save();
    
    // Generate URL for file access
    const fileUrl = `/api/files/${roomId}/${path.basename(req.file.path)}`;
    
    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        name: fileData.name,
        size: fileData.size,
        type: fileData.type,
        url: fileUrl,
        uploadedAt: fileData.uploadedAt
      }
    });
  } catch (error) {
    // Delete file if upload process fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred while uploading file',
      error: error.message
    });
  }
};

// Get file from room
const getFile = async (req, res) => {
  try {
    const { roomId, filename } = req.params;
    
    // Find room
    const room = await Room.findOne({ roomId });
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Find file in room's shared files
    const file = room.sharedFiles.find(file => 
      path.basename(file.path) === filename
    );
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Check if file exists in the filesystem
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }
    
    // Set appropriate content type
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    
    // Stream file to response
    const fileStream = fs.createReadStream(file.path);
    fileStream.pipe(res);
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving file',
      error: error.message
    });
  }
};

// Get all files from a room
const getRoomFiles = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Find room
    const room = await Room.findOne({ roomId })
      .populate('sharedFiles.uploadedBy', 'username');
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Format files data
    const files = room.sharedFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      url: `/api/files/${roomId}/${path.basename(file.path)}`,
      uploadedBy: file.uploadedBy.username,
      uploadedAt: file.uploadedAt
    }));
    
    return res.status(200).json({
      success: true,
      files
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching room files',
      error: error.message
    });
  }
};

// Upload file
exports.uploadFile = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const fileData = {
        url: `/uploads/${req.file.filename}`,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      };

      res.status(201).json({
        success: true,
        file: fileData
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading file'
      });
    }
  }
];

// Download file
exports.downloadFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.download(filePath);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading file'
    });
  }
};

// Delete file
exports.deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file'
    });
  }
};

module.exports = { uploadFile, getFile, getRoomFiles, upload, downloadFile, deleteFile };