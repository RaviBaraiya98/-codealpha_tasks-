const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// All routes in this file require authentication
router.use(authenticate);

// Routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;