/**
 * Chat functionality for meeting rooms
 */
class ChatHandler {
  constructor(socket, roomId, userId, userData) {
    this.socket = socket;
    this.roomId = roomId;
    this.userId = userId;
    this.userData = userData;
    this.messages = [];
    this.typingUsers = new Set();
    this.typingTimeout = null;

    this.initializeSocketListeners();
  }

  // Initialize socket event listeners
  initializeSocketListeners() {
    this.socket.on('chat-message', this.handleMessage.bind(this));
    this.socket.on('user-typing', this.handleUserTyping.bind(this));
    this.socket.on('user-stopped-typing', this.handleUserStoppedTyping.bind(this));
    this.socket.on('user-joined-chat', this.handleUserJoined.bind(this));
    this.socket.on('user-left-chat', this.handleUserLeft.bind(this));
  }

  // Join chat room
  join() {
    this.socket.emit('join-chat', this.roomId, this.userData);
  }

  // Leave chat room
  leave() {
    this.socket.emit('leave-chat', this.roomId, this.userData);
  }

  // Send text message
  sendMessage(text) {
    if (!text.trim()) return;

    this.socket.emit('send-message', text, this.roomId, this.userData);
    this.stopTyping();
  }

  // Send file message
  async sendFile(file) {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload file
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const data = await response.json();

      // Send file message
      this.socket.emit('send-file-message', {
        url: data.file.url,
        name: data.file.name,
        size: data.file.size,
        type: data.file.type
      }, this.roomId, this.userData);

      return data.file;
    } catch (error) {
      console.error('Error sending file:', error);
      throw error;
    }
  }

  // Handle received message
  handleMessage(messageData) {
    this.messages.push(messageData);
    this.onMessageCallback?.(messageData);
  }

  // Start typing indicator
  startTyping() {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.socket.emit('typing-start', this.roomId, this.userData);

    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 3000);
  }

  // Stop typing indicator
  stopTyping() {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    this.socket.emit('typing-stop', this.roomId, this.userData);
  }

  // Handle user typing
  handleUserTyping(userData) {
    if (userData.id === this.userId) return;
    
    this.typingUsers.add(userData.id);
    this.onTypingCallback?.(Array.from(this.typingUsers));
  }

  // Handle user stopped typing
  handleUserStoppedTyping(userData) {
    if (userData.id === this.userId) return;
    
    this.typingUsers.delete(userData.id);
    this.onTypingCallback?.(Array.from(this.typingUsers));
  }

  // Handle user joined
  handleUserJoined(userData) {
    if (userData.id === this.userId) return;
    
    const message = {
      id: Date.now(),
      type: 'system',
      text: `${userData.displayName} joined the chat`,
      timestamp: new Date().toISOString()
    };

    this.messages.push(message);
    this.onMessageCallback?.(message);
    this.onUserJoinedCallback?.(userData);
  }

  // Handle user left
  handleUserLeft(userData) {
    if (userData.id === this.userId) return;
    
    const message = {
      id: Date.now(),
      type: 'system',
      text: `${userData.displayName} left the chat`,
      timestamp: new Date().toISOString()
    };

    this.messages.push(message);
    this.onMessageCallback?.(message);
    this.onUserLeftCallback?.(userData);
  }

  // Set message callback
  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  // Set typing callback
  onTyping(callback) {
    this.onTypingCallback = callback;
  }

  // Set user joined callback
  onUserJoined(callback) {
    this.onUserJoinedCallback = callback;
  }

  // Set user left callback
  onUserLeft(callback) {
    this.onUserLeftCallback = callback;
  }

  // Get chat history
  getHistory() {
    return this.messages;
  }

  // Clean up resources
  cleanup() {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.socket.off('chat-message');
    this.socket.off('user-typing');
    this.socket.off('user-stopped-typing');
    this.socket.off('user-joined-chat');
    this.socket.off('user-left-chat');
  }
}

// Export for use in other modules
window.ChatHandler = ChatHandler;