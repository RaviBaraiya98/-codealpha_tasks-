// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Socket.IO Configuration
const SOCKET_URL = 'http://localhost:3000';

// Feature Flags
const FEATURES = {
  screenSharing: true,
  chat: true,
  recording: false,
  whiteboard: false,
  fileSharing: false
};

// Media Constraints
const DEFAULT_MEDIA_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user'
  }
};

// Export configurations
window.CONFIG = {
  API_BASE_URL,
  SOCKET_URL,
  FEATURES,
  DEFAULT_MEDIA_CONSTRAINTS
};

// Global configuration object
window.CONFIG = {
    API_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3001/api'
        : '/api',
    
    SOCKET_URL: window.location.hostname === 'localhost'
        ? 'http://localhost:3001'
        : window.location.origin,
    
    RTC_CONFIG: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
        ]
    },
    
    // Media constraints
    MEDIA_CONSTRAINTS: {
        audio: true,
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
        }
    },
    
    // Screen sharing constraints
    SCREEN_CONSTRAINTS: {
        video: {
            cursor: 'always'
        },
        audio: false
    },
    
    // UI settings
    UI: {
        MAX_PARTICIPANTS_GRID: 9,
        CHAT_MESSAGE_LIMIT: 100,
        TOAST_DURATION: 3000
    }
};
// No backend or socket.io required for static hosting! 