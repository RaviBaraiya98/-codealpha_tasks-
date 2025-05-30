const { v4: uuidv4 } = require('uuid');

// Store active rooms and their participants
const rooms = {};

const handleSocketConnections = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    // Join a room
    socket.on('join-room', ({ roomId, userId, userName }) => {
      console.log(`User ${userName} (${userId}) joining room ${roomId}`);
      
      // Create room if it doesn't exist
      if (!rooms[roomId]) {
        rooms[roomId] = {
          participants: {},
          messages: []
        };
      }
      
      // Add user to room
      rooms[roomId].participants[socket.id] = {
        userId,
        userName,
        socketId: socket.id
      };
      
      // Join the room
      socket.join(roomId);
      
      // Notify others in the room
      socket.to(roomId).emit('user-joined', {
        userId,
        userName,
        socketId: socket.id
      });
      
      // Send list of participants to the new user
      socket.emit('room-participants', {
        roomId,
        participants: rooms[roomId].participants,
        messages: rooms[roomId].messages
      });
      
      // WebRTC signaling
      
      // Send offer to new participant
      socket.on('send-offer', ({ offer, to }) => {
        io.to(to).emit('receive-offer', {
          offer,
          from: socket.id,
          userName: rooms[roomId].participants[socket.id].userName
        });
      });
      
      // Send answer back to offerer
      socket.on('send-answer', ({ answer, to }) => {
        io.to(to).emit('receive-answer', {
          answer,
          from: socket.id
        });
      });
      
      // Handle ICE candidates
      socket.on('send-ice-candidate', ({ candidate, to }) => {
        io.to(to).emit('receive-ice-candidate', {
          candidate,
          from: socket.id
        });
      });
      
      // Chat message handling
      socket.on('send-message', (message) => {
        const messageWithId = {
          ...message,
          id: uuidv4(),
          timestamp: new Date()
        };
        
        // Store message in room history
        rooms[roomId].messages.push(messageWithId);
        
        // Broadcast to all in the room including sender
        io.to(roomId).emit('receive-message', messageWithId);
      });
      
      // Whiteboard handling
      socket.on('whiteboard-draw', (drawData) => {
        socket.to(roomId).emit('whiteboard-draw', drawData);
      });
      
      // Screen sharing signal
      socket.on('screen-share-started', () => {
        socket.to(roomId).emit('user-screen-share-started', { userId: socket.id });
      });
      
      socket.on('screen-share-stopped', () => {
        socket.to(roomId).emit('user-screen-share-stopped', { userId: socket.id });
      });
      
      // File sharing
      socket.on('file-share-started', (fileMetadata) => {
        socket.to(roomId).emit('user-file-share', { 
          userId: socket.id,
          userName: rooms[roomId].participants[socket.id].userName,
          fileMetadata
        });
      });
      
      // Handle user disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        
        if (rooms[roomId]) {
          // Remove user from participants
          delete rooms[roomId].participants[socket.id];
          
          // Notify others that user left
          socket.to(roomId).emit('user-left', { socketId: socket.id });
          
          // Clean up empty rooms
          if (Object.keys(rooms[roomId].participants).length === 0) {
            delete rooms[roomId];
            console.log(`Room ${roomId} deleted - no participants left`);
          }
        }
      });
    });
  });
};

module.exports = { handleSocketConnections };