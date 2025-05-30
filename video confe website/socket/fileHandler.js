const { v4: uuidv4 } = require('uuid');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected to file socket:', socket.id);

    // Handle file transfer initiation
    socket.on('file-transfer-init', (fileInfo, roomId, userId) => {
      const transferId = uuidv4();
      socket.to(roomId).emit('file-transfer-request', {
        ...fileInfo,
        transferId,
        senderId: userId
      });
    });

    // Handle file transfer acceptance
    socket.on('file-transfer-accept', (transferId, roomId, userId) => {
      socket.to(roomId).emit('file-transfer-accepted', transferId, userId);
    });

    // Handle file transfer rejection
    socket.on('file-transfer-reject', (transferId, roomId, userId) => {
      socket.to(roomId).emit('file-transfer-rejected', transferId, userId);
    });

    // Handle file chunks
    socket.on('file-chunk', (chunk, transferId, roomId, userId) => {
      socket.to(roomId).emit('file-chunk-received', chunk, transferId, userId);
    });

    // Handle file transfer completion
    socket.on('file-transfer-complete', (transferId, roomId, userId) => {
      socket.to(roomId).emit('file-transfer-completed', transferId, userId);
    });

    // Handle file transfer error
    socket.on('file-transfer-error', (error, transferId, roomId, userId) => {
      socket.to(roomId).emit('file-transfer-failed', error, transferId, userId);
    });

    // Handle file transfer progress
    socket.on('file-transfer-progress', (progress, transferId, roomId, userId) => {
      socket.to(roomId).emit('file-transfer-progress-update', progress, transferId, userId);
    });

    // Handle file transfer cancellation
    socket.on('file-transfer-cancel', (transferId, roomId, userId) => {
      socket.to(roomId).emit('file-transfer-cancelled', transferId, userId);
    });
  });
}; 