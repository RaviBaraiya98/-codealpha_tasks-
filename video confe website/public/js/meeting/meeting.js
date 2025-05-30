/**
 * Main meeting logic
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Get room ID from URL
  const pathParts = window.location.pathname.split('/');
  const roomId = pathParts[pathParts.length - 1];
  
  // Check if user is authenticated
  if (!Auth.isAuthenticated()) {
    // Redirect to login page
    window.location.href = `/login?redirect=/meeting/${roomId}`;
    return;
  }
  
  // Get user data
  const currentUser = Auth.getCurrentUser();
  
  // Check if socket.io is loaded
  if (typeof io === 'undefined') {
    toast.error('Failed to load required libraries. Please try again.');
    return;
  }
  
  // Initialize socket connection
  const socket = io();
  let isConnected = false;
  
  // Handle socket connection
  socket.on('connect', async () => {
    console.log('Connected to server');
    isConnected = true;
    
    try {
      // Get room info
      const roomData = await getRoomInfo(roomId);
      
      // Join room
      await joinRoom(roomId);
      
      // Initialize meeting UI
      await meetingUI.initialize(roomId, roomData, currentUser);
      
      // Initialize WebRTC
      try {
        const localStream = await webRTC.initialize(socket, roomId, currentUser.id, currentUser.username);
        
        // Add local video to UI
        meetingUI.addLocalVideo(localStream);
        
        // Set callback for new streams
        webRTC.setOnStream((peerId, stream) => {
          // Find participant name
          let peerName = 'Participant';
          if (webRTC.socket) {
            const participants = socket.participants || {};
            const peer = participants[peerId];
            if (peer) {
              peerName = peer.userName;
            }
          }
          
          // Add remote video
          meetingUI.addRemoteVideo(peerId, stream, peerName);
        });
        
        // Set callback for participant updates
        webRTC.setOnParticipantUpdate((participants) => {
          meetingUI.updateParticipantsList(participants);
        });
        
        // Join the room with socket
        socket.emit('join-room', {
          roomId,
          userId: currentUser.id,
          userName: currentUser.username
        });
        
        // Initialize chat
        chatManager.initialize(socket, currentUser.id, currentUser.username);
        
        // Set callback for new messages
        chatManager.setOnNewMessage((message) => {
          meetingUI.addChatMessage(message);
        });
        
        // Initialize screen sharing
        screenShareManager.initialize(socket, webRTC);
        
        // Set callbacks for screen sharing
        screenShareManager.setOnScreenShareStart((userId) => {
          toast.info('A participant is sharing their screen');
        });
        
        screenShareManager.setOnScreenShareStop((userId) => {
          toast.info('Screen sharing ended');
        });
        
        // Initialize file sharing
        fileSharingManager.initialize(socket, roomId);
        
        // Set callback for new files
        fileSharingManager.setOnNewFile((fileMetadata, userName) => {
          toast.info(`${userName} shared a file: ${fileMetadata.name}`);
          meetingUI.updateFilesList();
        });
        
        // Initial file list update
        fileSharingManager.fetchRoomFiles().then(() => {
          meetingUI.updateFilesList();
        });
        
        // Initialize recording
        recordingManager.initialize(localStream);
        
        // Set callbacks for recording
        recordingManager.setOnRecordingStart((duration) => {
          meetingUI.updateRecordingButton(true);
          
          if (duration) {
            const recordBtn = document.getElementById('recordBtn');
            if (recordBtn) {
              // Update tooltip with duration
              recordBtn.setAttribute('title', `Recording: ${duration}`);
            }
          }
        });
        
        recordingManager.setOnRecordingStop(() => {
          meetingUI.updateRecordingButton(false);
          
          const recordBtn = document.getElementById('recordBtn');
          if (recordBtn) {
            recordBtn.setAttribute('title', 'Record Meeting');
          }
        });
        
        // Hide connection error if shown
        meetingUI.hideConnectionError();
        
      } catch (error) {
        console.error('WebRTC initialization error:', error);
        
        // Show specific error message based on error type
        if (error.name === 'NotAllowedError') {
          meetingUI.showConnectionError('Camera or microphone access denied. Please allow access and try again.');
        } else if (error.name === 'NotFoundError') {
          meetingUI.showConnectionError('No camera or microphone found. Please connect a device and try again.');
        } else {
          meetingUI.showConnectionError('Failed to access media devices. Please check your camera and microphone.');
        }
      }
      
    } catch (error) {
      console.error('Room initialization error:', error);
      toast.error(error.message || 'Failed to join meeting');
      
      // Redirect to home after a delay
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    }
  });
  
  // Handle socket disconnection
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    isConnected = false;
    
    meetingUI.showConnectionError('Lost connection to the meeting. Trying to reconnect...');
  });
  
  // Handle socket reconnection
  socket.on('reconnect', () => {
    console.log('Reconnected to server');
    isConnected = true;
    
    // Hide connection error
    meetingUI.hideConnectionError();
    
    // Rejoin room
    socket.emit('join-room', {
      roomId,
      userId: currentUser.id,
      userName: currentUser.username
    });
  });
  
  // Handle socket error
  socket.on('error', (error) => {
    console.error('Socket error:', error);
    meetingUI.showConnectionError('Connection error. Please try again.');
  });
  
  // Check connection status after a delay
  setTimeout(() => {
    if (!isConnected) {
      meetingUI.showConnectionError('Unable to connect to the meeting. Please check your internet connection.');
    }
  }, 10000);
  
  /**
   * Get room info
   */
  async function getRoomInfo(roomId) {
    try {
      const token = Auth.getToken();
      
      const response = await fetch(`/api/room/${roomId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get room info');
      }
      
      return data.room;
    } catch (error) {
      console.error('Get room info error:', error);
      throw error;
    }
  }
  
  /**
   * Join room
   */
  async function joinRoom(roomId) {
    try {
      const token = Auth.getToken();
      
      const response = await fetch(`/api/room/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to join room');
      }
      
      return data;
    } catch (error) {
      console.error('Join room error:', error);
      throw error;
    }
  }
});