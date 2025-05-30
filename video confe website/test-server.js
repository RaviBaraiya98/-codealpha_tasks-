const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const compression = require('compression');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disabled for development
}));
app.use(compression());

// Serve static files with proper MIME types
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Basic route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
