/**
 * Screen sharing functionality for meeting rooms
 */
class ScreenShareManager {
  constructor() {
    this.socket = null;
    this.webRTC = null;
    this.isScreenSharing = false;
    this.onScreenShareStartCallback = null;
    this.onScreenShareStopCallback = null;
  }
  
  /**
   * Initialize screen share manager
   */
  initialize(socket, webRTC) {
    this.socket = socket;
    this.webRTC = webRTC;
    
    // Setup socket event listeners
    this.setupSocketListeners();
  }
  
  /**
   * Set up socket event listeners for screen sharing
   */
  setupSocketListeners() {
    if (!this.socket) return;
    
    // When a user starts screen sharing
    this.socket.on('user-screen-share-started', (data) => {
      // Trigger callback
      if (this.onScreenShareStartCallback) {
        this.onScreenShareStartCallback(data.userId);
      }
    });
    
    // When a user stops screen sharing
    this.socket.on('user-screen-share-stopped', (data) => {
      // Trigger callback
      if (this.onScreenShareStopCallback) {
        this.onScreenShareStopCallback(data.userId);
      }
    });
  }
  
  /**
   * Toggle screen sharing
   */
  async toggleScreenSharing() {
    if (!this.webRTC) return false;
    
    try {
      if (this.isScreenSharing) {
        // Stop screen sharing
        await this.webRTC.stopScreenSharing();
        this.isScreenSharing = false;
      } else {
        // Start screen sharing
        await this.webRTC.startScreenSharing();
        this.isScreenSharing = true;
      }
      
      return this.isScreenSharing;
    } catch (error) {
      console.error('Error toggling screen sharing:', error);
      return false;
    }
  }
  
  /**
   * Set callback for screen share start
   */
  setOnScreenShareStart(callback) {
    this.onScreenShareStartCallback = callback;
  }
  
  /**
   * Set callback for screen share stop
   */
  setOnScreenShareStop(callback) {
    this.onScreenShareStopCallback = callback;
  }
  
  /**
   * Check if screen sharing is active
   */
  isActive() {
    return this.isScreenSharing;
  }
}

// Create global instance
const screenShareManager = new ScreenShareManager();