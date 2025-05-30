const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const User = require('../models/User');

// Store active rooms and their participants
const rooms = new Map();

// Middleware to authenticate socket connections
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

module.exports = (io) => {
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log('User connected:', socket.user.username);

    // Join room
    socket.on('joinRoom', async ({ roomId }) => {
      try {
        // Verify room exists and user has access
        const room = await Room.findById(roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if room is private and requires password
        if (room.isPrivate && !room.participants.includes(socket.user._id)) {
          socket.emit('error', { message: 'Access denied to private room' });
          return;
        }

        // Join socket room
        socket.join(roomId);

        // Initialize room in memory if not exists
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Map());
        }

        // Add user to room
        rooms.get(roomId).set(socket.id, {
          userId: socket.user._id,
          username: socket.user.username,
          muted: false,
          videoOff: false
        });

        // Notify others in room
        socket.to(roomId).emit('userJoined', {
          userId: socket.user._id,
          username: socket.user.username
        });

        // Send list of connected users to the new participant
        const participants = Array.from(rooms.get(roomId).values());
        socket.emit('participantsList', participants);

        // Add user to room in database if not already present
        if (!room.participants.includes(socket.user._id)) {
          room.participants.push(socket.user._id);
          await room.save();
        }

      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave room
    socket.on('leaveRoom', async ({ roomId }) => {
      try {
        // Remove user from room in memory
        if (rooms.has(roomId)) {
          rooms.get(roomId).delete(socket.id);
          if (rooms.get(roomId).size === 0) {
            rooms.delete(roomId);
          }
        }

        // Remove user from room in database
        const room = await Room.findById(roomId);
        if (room) {
          room.participants = room.participants.filter(
            p => p.toString() !== socket.user._id.toString()
          );
          await room.save();
        }

        // Leave socket room
        socket.leave(roomId);

        // Notify others
        socket.to(roomId).emit('userLeft', {
          userId: socket.user._id,
          username: socket.user.username
        });

      } catch (error) {
        console.error('Error leaving room:', error);
      }
    });

    // WebRTC signaling
    socket.on('offer', ({ offer, to }) => {
      socket.to(to).emit('offer', { offer, from: socket.user._id });
    });

    socket.on('answer', ({ answer, to }) => {
      socket.to(to).emit('answer', { answer, from: socket.user._id });
    });

    socket.on('ice-candidate', ({ candidate, to }) => {
      socket.to(to).emit('ice-candidate', { candidate, from: socket.user._id });
    });

    // User status updates
    socket.on('userMuted', ({ muted }) => {
      const roomId = Array.from(socket.rooms)[1]; // First room is socket.id
      if (rooms.has(roomId)) {
        const userData = rooms.get(roomId).get(socket.id);
        if (userData) {
          userData.muted = muted;
          socket.to(roomId).emit('userStatusChanged', {
            userId: socket.user._id,
            muted
          });
        }
      }
    });

    socket.on('userVideoOff', ({ videoOff }) => {
      const roomId = Array.from(socket.rooms)[1];
      if (rooms.has(roomId)) {
        const userData = rooms.get(roomId).get(socket.id);
        if (userData) {
          userData.videoOff = videoOff;
          socket.to(roomId).emit('userStatusChanged', {
            userId: socket.user._id,
            videoOff
          });
        }
      }
    });

    // Chat messages
    socket.on('chatMessage', ({ message, roomId }) => {
      socket.to(roomId).emit('chatMessage', {
        message,
        from: socket.user._id,
        username: socket.user.username
      });
    });

    // Get participants list
    socket.on('getParticipants', ({ roomId }, callback) => {
      if (rooms.has(roomId)) {
        const participants = Array.from(rooms.get(roomId).values());
        callback(participants);
      } else {
        callback([]);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.user.username);

      // Leave all rooms
      for (const [roomId, participants] of rooms.entries()) {
        if (participants.has(socket.id)) {
          // Remove user from room in memory
          participants.delete(socket.id);
          if (participants.size === 0) {
            rooms.delete(roomId);
          }

          // Remove user from room in database
          const room = await Room.findById(roomId);
          if (room) {
            room.participants = room.participants.filter(
              p => p.toString() !== socket.user._id.toString()
            );
            await room.save();
          }

          // Notify others
          socket.to(roomId).emit('userLeft', {
            userId: socket.user._id,
            username: socket.user.username
          });
        }
      }
    });
  });
}; 