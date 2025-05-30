const whiteboards = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected to whiteboard socket:', socket.id);

    // Join whiteboard room
    socket.on('join-whiteboard', (roomId) => {
      socket.join(roomId);
      
      // Send existing whiteboard data to new user
      if (whiteboards.has(roomId)) {
        socket.emit('whiteboard-data', whiteboards.get(roomId));
      } else {
        whiteboards.set(roomId, []);
      }
    });

    // Handle drawing events
    socket.on('draw', (drawData, roomId) => {
      if (!whiteboards.has(roomId)) {
        whiteboards.set(roomId, []);
      }
      whiteboards.get(roomId).push(drawData);
      socket.to(roomId).emit('draw', drawData);
    });

    // Handle clear whiteboard
    socket.on('clear-whiteboard', (roomId) => {
      whiteboards.set(roomId, []);
      io.to(roomId).emit('whiteboard-cleared');
    });

    // Handle undo
    socket.on('undo', (roomId) => {
      if (whiteboards.has(roomId) && whiteboards.get(roomId).length > 0) {
        const boardData = whiteboards.get(roomId);
        boardData.pop();
        io.to(roomId).emit('undo');
      }
    });

    // Handle tool change
    socket.on('tool-change', (tool, roomId) => {
      socket.to(roomId).emit('tool-changed', tool);
    });

    // Handle color change
    socket.on('color-change', (color, roomId) => {
      socket.to(roomId).emit('color-changed', color);
    });

    // Handle brush size change
    socket.on('brush-size-change', (size, roomId) => {
      socket.to(roomId).emit('brush-size-changed', size);
    });

    // Handle save whiteboard
    socket.on('save-whiteboard', (roomId) => {
      if (whiteboards.has(roomId)) {
        socket.emit('whiteboard-data', whiteboards.get(roomId));
      }
    });

    // Leave whiteboard
    socket.on('leave-whiteboard', (roomId) => {
      socket.leave(roomId);
    });

    // Clean up when room is empty
    socket.on('disconnect', () => {
      const rooms = Array.from(socket.rooms);
      rooms.forEach(roomId => {
        const room = io.sockets.adapter.rooms.get(roomId);
        if (!room || room.size === 0) {
          whiteboards.delete(roomId);
        }
      });
    });
  });
}; 