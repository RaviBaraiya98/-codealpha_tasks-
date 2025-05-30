const express = require('express');
const { check } = require('express-validator');
const roomController = require('../controllers/roomController');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const createRoomValidation = [
  check('name')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Room name must be between 3 and 50 characters'),
  check('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean'),
  check('password')
    .optional()
    .isLength({ min: 4 })
    .withMessage('Password must be at least 4 characters long')
];

const joinRoomValidation = [
  check('password')
    .optional()
    .isString()
    .withMessage('Password must be a string')
];

// Routes
router.post('/create', auth, createRoomValidation, roomController.createRoom);
router.post('/:roomId/join', auth, joinRoomValidation, roomController.joinRoom);
router.post('/:roomId/leave', auth, roomController.leaveRoom);
router.get('/:roomId', auth, roomController.getRoomDetails);
router.get('/active', auth, roomController.listActiveRooms);
router.delete('/:roomId', auth, roomController.deleteRoom);

module.exports = router;