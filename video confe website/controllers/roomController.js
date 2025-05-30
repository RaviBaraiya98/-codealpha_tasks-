const Room = require('../models/Room');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Create a new room
const createRoom = async (req, res) => {
  try {
    const { name, isPrivate, password } = req.body;
    const userId = req.user.userId;
    
    // Generate unique room ID
    const roomId = uuidv4();
    
    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    // Create room
    const room = new Room({
      name,
      createdBy: userId,
      isPrivate,
      password: hashedPassword,
      participants: [userId]
    });
    
    await room.save();
    
    // Add room to user's created rooms
    await User.findByIdAndUpdate(userId, {
      $push: { createdRooms: room._id }
    });
    
    return res.status(201).json({
      success: true,
      room: {
        id: room._id,
        name: room.name,
        isPrivate: room.isPrivate,
        hasPassword: !!room.password,
        participants: room.participants
      }
    });
  } catch (error) {
    console.error('Create room error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating room'
    });
  }
};

// Get room by ID
const getRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Find room by roomId
    const room = await Room.findOne({ roomId }).populate('createdBy', 'username email');
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }
    
    // Check if room is private and requires password
    if (room.isPrivate) {
      const { password } = req.body;
      
      // If room has a password and no password provided or incorrect password
      if (room.password && (!password || room.password !== password)) {
        return res.status(401).json({ 
          success: false, 
          message: 'Password required for this room',
          requiresPassword: true
        });
      }
    }
    
    // Return room data
    return res.status(200).json({
      success: true,
      room: {
        id: room._id,
        roomId: room.roomId,
        name: room.name,
        createdBy: room.createdBy,
        isPrivate: room.isPrivate,
        startTime: room.startTime,
        participants: room.participants.filter(p => !p.leftAt).length,
        hasPassword: !!room.password
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching room',
      error: error.message
    });
  }
};

// Join room
const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { password } = req.body;
    const userId = req.user.userId;
    
    // Find room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Check if room is active
    if (room.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Room is not active'
      });
    }
    
    // Check password for private rooms
    if (room.isPrivate && room.password) {
      if (!password) {
        return res.status(401).json({
          success: false,
          message: 'Password required',
          requiresPassword: true
        });
      }
      
      const isPasswordValid = await bcrypt.compare(password, room.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }
    }
    
    // Add user to room if not already present
    if (!room.isParticipant(userId)) {
      room.addParticipant(userId);
      await room.save();
      
      // Add room to user's joined rooms
      await User.findByIdAndUpdate(userId, {
        $addToSet: { joinedRooms: room._id }
      });
    }
    
    return res.status(200).json({
      success: true,
      room: {
        id: room._id,
        name: room.name,
        isPrivate: room.isPrivate,
        participants: room.participants
      }
    });
  } catch (error) {
    console.error('Join room error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error joining room'
    });
  }
};

// Leave room
const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;
    
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Remove user from room
    room.removeParticipant(userId);
    await room.save();
    
    // Remove room from user's joined rooms
    await User.findByIdAndUpdate(userId, {
      $pull: { joinedRooms: room._id }
    });
    
    // End room if no participants left
    if (room.participants.length === 0) {
      room.endRoom();
      await room.save();
    }
    
    return res.status(200).json({
      success: true,
      message: 'Left room successfully'
    });
  } catch (error) {
    console.error('Leave room error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error leaving room'
    });
  }
};

// Get active rooms (for the homepage)
const getActiveRooms = async (req, res) => {
  try {
    // Find all non-ended public rooms
    const rooms = await Room.find({
      endTime: null,
      isPrivate: false
    })
    .populate('createdBy', 'username')
    .select('roomId name createdBy startTime participants');
    
    // Transform data for response
    const activeRooms = rooms.map(room => {
      const activeParticipants = room.participants.filter(p => !p.leftAt).length;
      
      return {
        roomId: room.roomId,
        name: room.name,
        createdBy: room.createdBy.username,
        startTime: room.startTime,
        participants: activeParticipants
      };
    });
    
    return res.status(200).json({
      success: true,
      rooms: activeRooms
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching active rooms',
      error: error.message
    });
  }
};

// Get room details
const getRoomDetails = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;
    
    const room = await Room.findById(roomId)
      .populate('createdBy', 'username displayName avatar')
      .populate('participants', 'username displayName avatar');
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Check if user is participant or creator
    if (!room.isParticipant(userId) && room.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this room'
      });
    }
    
    return res.status(200).json({
      success: true,
      room: {
        id: room._id,
        name: room.name,
        createdBy: room.createdBy,
        isPrivate: room.isPrivate,
        status: room.status,
        participants: room.participants
      }
    });
  } catch (error) {
    console.error('Get room details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting room details'
    });
  }
};

// List active rooms
const listActiveRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ status: 'active' })
      .populate('createdBy', 'username displayName avatar')
      .select('name createdBy isPrivate participants status');
    
    return res.status(200).json({
      success: true,
      rooms: rooms.map(room => ({
        id: room._id,
        name: room.name,
        createdBy: room.createdBy,
        isPrivate: room.isPrivate,
        participantCount: room.participants.length,
        status: room.status
      }))
    });
  } catch (error) {
    console.error('List active rooms error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error listing active rooms'
    });
  }
};

// Update room settings
const updateRoomSettings = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { settings } = req.body;
    const userId = req.user.userId;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is room creator
    if (room.creator.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only room creator can update settings'
      });
    }

    // Update settings
    room.settings = { ...room.settings, ...settings };
    await room.save();

    return res.status(200).json({
      success: true,
      settings: room.settings
    });
  } catch (error) {
    console.error('Update room settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating room settings'
    });
  }
};

// Delete room
const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;
    
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Check if user is creator
    if (room.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this room'
      });
    }
    
    // End room and remove from users' joined rooms
    room.endRoom();
    await room.save();
    
    await User.updateMany(
      { joinedRooms: room._id },
      { $pull: { joinedRooms: room._id } }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting room'
    });
  }
};

module.exports = {
  createRoom,
  getRoomById,
  joinRoom,
  leaveRoom,
  getActiveRooms,
  getRoomDetails,
  listActiveRooms,
  updateRoomSettings,
  deleteRoom
};