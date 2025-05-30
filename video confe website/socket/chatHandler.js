const { v4: uuidv4 } = require('uuid');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected to chat socket:', socket.id);

    // Join chat room
    socket.on('join-chat', (roomId, userData) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-joined-chat', userData);
    });

    // Handle chat messages
    socket.on('send-message', (message, roomId, userData) => {
      const messageData = {
        id: uuidv4(),
        text: message,
        sender: userData,
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      io.to(roomId).emit('chat-message', messageData);
    });

    // Handle file share messages
    socket.on('send-file-message', (fileData, roomId, userData) => {
      const messageData = {
        id: uuidv4(),
        fileUrl: fileData.url,
        fileName: fileData.name,
        fileSize: fileData.size,
        fileType: fileData.type,
        sender: userData,
        timestamp: new Date().toISOString(),
        type: 'file'
      };
      io.to(roomId).emit('chat-message', messageData);
    });

    // Handle typing indicators
    socket.on('typing-start', (roomId, userData) => {
      socket.to(roomId).emit('user-typing', userData);
    });

    socket.on('typing-stop', (roomId, userData) => {
      socket.to(roomId).emit('user-stopped-typing', userData);
    });

    // Leave chat
    socket.on('leave-chat', (roomId, userData) => {
      socket.leave(roomId);
      socket.to(roomId).emit('user-left-chat', userData);
    });
  });
}; 