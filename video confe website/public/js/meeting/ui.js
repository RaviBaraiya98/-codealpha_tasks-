/**
 * UI functionality for meeting rooms
 */
class MeetingUI {
  constructor() {
    // Main elements
    this.videoGrid = document.getElementById('videoGrid');
    this.participantsList = document.getElementById('participantsList');
    this.chatMessages = document.getElementById('chatMessages');
    this.chatInput = document.getElementById('chatInput');
    this.sendMessageBtn = document.getElementById('sendMessageBtn');
    this.filesList = document.getElementById('filesList');
    this.fileUpload = document.getElementById('fileUpload');
    this.roomInfoBar = document.getElementById('roomInfoBar');
    this.roomName = document.getElementById('roomName');
    this.copyRoomLinkBtn = document.getElementById('copyRoomLinkBtn');
    
    // Control buttons
    this.micBtn = document.getElementById('micBtn');
    this.videoBtn = document.getElementById('videoBtn');
    this.screenShareBtn = document.getElementById('screenShareBtn');
    this.whiteboardBtn = document.getElementById('whiteboardBtn');
    this.recordBtn = document.getElementById('recordBtn');
    this.fileBtn = document.getElementById('fileBtn');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.leaveBtn = document.getElementById('leaveBtn');
    
    // Sidebar tabs
    this.sidebarTabs = document.querySelectorAll('.sidebar-tab');
    this.tabContents = document.querySelectorAll('.tab-content');
    
    // Modals
    this.whiteboardModal = document.getElementById('whiteboardModal');
    this.closeWhiteboardBtn = document.getElementById('closeWhiteboardBtn');
    this.whiteboardCanvas = document.getElementById('whiteboardCanvas');
    this.whiteboardTools = document.querySelectorAll('.whiteboard-tools .tool-btn');
    this.whiteboardColors = document.querySelectorAll('.whiteboard-colors .color-option');
    
    this.settingsModal = document.getElementById('settingsModal');
    this.audioSelect = document.getElementById('audioSelect');
    this.videoSelect = document.getElementById('videoSelect');
    this.speakerSelect = document.getElementById('speakerSelect');
    this.noiseSuppressionCheckbox = document.getElementById('noiseSuppressionCheckbox');
    this.echoCancellationCheckbox = document.getElementById('echoCancellationCheckbox');
    this.applySettingsBtn = document.getElementById('applySettingsBtn');
    
    this.connectionModal = document.getElementById('connectionModal');
    this.connectionMessage = document.getElementById('connectionMessage');
    this.retryConnectionBtn = document.getElementById('retryConnectionBtn');
    this.leaveConnectionBtn = document.getElementById('leaveConnectionBtn');
    
    // State
    this.localVideoElement = null;
    this.localUser = null;
    this.roomData = null;
    this.participants = {};
    this.videoElements = {};
    this.isMicOn = true;
    this.isVideoOn = true;
    this.isScreenSharing = false;
    this.isRecording = false;
    this.mediaDevices = {
      audioinput: [],
      videoinput: [],
      audiooutput: []
    };
  }
  
  /**
   * Initialize meeting UI
   */
  async initialize(roomId, roomData, localUser) {
    this.roomData = roomData;
    this.localUser = localUser;
    
    // Set room info
    this.roomName.textContent = roomData.name;
    
    // Set up copy link button
    this.copyRoomLinkBtn.addEventListener('click', () => this.copyRoomLink(roomId));
    
    // Set up sidebar tabs
    this.setupSidebarTabs();
    
    // Set up control buttons
    this.setupControlButtons();
    
    // Get available media devices
    await this.getMediaDevices();
    
    // Set up settings modal
    this.setupSettingsModal();
    
    // Set up whiteboard
    this.setupWhiteboard();
    
    // Set up file upload
    this.setupFileUpload();
    
    // Set up chat input
    this.setupChatInput();
  }
  
  /**
   * Set up sidebar tabs
   */
  setupSidebarTabs() {
    this.sidebarTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        this.sidebarTabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Show corresponding content
        const tabName = tab.getAttribute('data-tab');
        this.tabContents.forEach(content => {
          content.classList.add('hidden');
          if (content.id === `${tabName}Tab`) {
            content.classList.remove('hidden');
          }
        });
      });
    });
  }
  
  /**
   * Set up control buttons
   */
  setupControlButtons() {
    // Microphone toggle
    this.micBtn.addEventListener('click', () => {
      const isOn = webRTC.toggleAudio();
      this.updateMicButton(isOn);
    });
    
    // Video toggle
    this.videoBtn.addEventListener('click', () => {
      const isOn = webRTC.toggleVideo();
      this.updateVideoButton(isOn);
    });
    
    // Screen sharing toggle
    this.screenShareBtn.addEventListener('click', () => {
      screenShareManager.toggleScreenSharing()
        .then(isSharing => {
          this.updateScreenShareButton(isSharing);
        })
        .catch(error => {
          console.error('Screen sharing error:', error);
          toast.error('Failed to share screen');
        });
    });
    
    // Whiteboard toggle
    this.whiteboardBtn.addEventListener('click', () => {
      this.toggleWhiteboardModal();
    });
    
    // Recording toggle
    this.recordBtn.addEventListener('click', () => {
      if (this.isRecording) {
        recordingManager.stopRecording();
      } else {
        recordingManager.startRecording();
      }
      this.updateRecordingButton(!this.isRecording);
    });
    
    // File button
    this.fileBtn.addEventListener('click', () => {
      // Switch to files tab
      this.sidebarTabs.forEach(t => t.classList.remove('active'));
      const filesTab = document.querySelector('.sidebar-tab[data-tab="files"]');
      if (filesTab) filesTab.classList.add('active');
      
      // Show files content
      this.tabContents.forEach(content => {
        content.classList.add('hidden');
        if (content.id === 'filesTab') {
          content.classList.remove('hidden');
        }
      });
    });
    
    // Settings toggle
    this.settingsBtn.addEventListener('click', () => {
      this.settingsModal.style.display = 'flex';
    });
    
    // Leave meeting
    this.leaveBtn.addEventListener('click', () => {
      this.leaveMeeting();
    });
    
    // Close modals
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.whiteboardModal.style.display = 'none';
        this.settingsModal.style.display = 'none';
      });
    });
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
      if (e.target === this.whiteboardModal) {
        this.whiteboardModal.style.display = 'none';
      }
      if (e.target === this.settingsModal) {
        this.settingsModal.style.display = 'none';
      }
    });
    
    // Connection modal retry button
    this.retryConnectionBtn.addEventListener('click', () => {
      window.location.reload();
    });
    
    // Connection modal leave button
    this.leaveConnectionBtn.addEventListener('click', () => {
      window.location.href = '/';
    });
  }
  
  /**
   * Set up whiteboard
   */
  setupWhiteboard() {
    // Initialize whiteboard tools
    this.whiteboardTools.forEach(tool => {
      tool.addEventListener('click', () => {
        // Remove active class from all tools
        this.whiteboardTools.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tool
        tool.classList.add('active');
        
        // Set current tool
        const toolName = tool.getAttribute('data-tool');
        
        if (toolName === 'clear') {
          // Clear whiteboard
          whiteboardManager.clear();
        } else {
          // Set tool
          whiteboardManager.setTool(toolName);
        }
      });
    });
    
    // Initialize whiteboard colors
    this.whiteboardColors.forEach(color => {
      color.addEventListener('click', () => {
        // Remove active class from all colors
        this.whiteboardColors.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked color
        color.classList.add('active');
        
        // Set current color
        const colorValue = color.getAttribute('data-color');
        whiteboardManager.setColor(colorValue);
      });
    });
  }
  
  /**
   * Toggle whiteboard modal
   */
  toggleWhiteboardModal() {
    if (this.whiteboardModal.style.display === 'flex') {
      this.whiteboardModal.style.display = 'none';
    } else {
      this.whiteboardModal.style.display = 'flex';
      
      // Initialize whiteboard if not already
      if (this.whiteboardCanvas) {
        whiteboardManager.initialize(this.whiteboardCanvas, socket);
      }
    }
  }
  
  /**
   * Set up settings modal
   */
  setupSettingsModal() {
    // Populate device selectors
    this.populateMediaDevices();
    
    // Apply settings button
    this.applySettingsBtn.addEventListener('click', () => {
      this.applySettings();
    });
  }
  
  /**
   * Get available media devices
   */
  async getMediaDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // Group devices by kind
      devices.forEach(device => {
        if (device.kind in this.mediaDevices) {
          this.mediaDevices[device.kind].push(device);
        }
      });
      
      return this.mediaDevices;
    } catch (error) {
      console.error('Error getting media devices:', error);
      return this.mediaDevices;
    }
  }
  
  /**
   * Populate media device selectors
   */
  populateMediaDevices() {
    // Clear existing options
    this.audioSelect.innerHTML = '';
    this.videoSelect.innerHTML = '';
    this.speakerSelect.innerHTML = '';
    
    // Add audio input devices
    this.mediaDevices.audioinput.forEach(device => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.text = device.label || `Microphone ${this.audioSelect.length + 1}`;
      this.audioSelect.appendChild(option);
    });
    
    // Add video input devices
    this.mediaDevices.videoinput.forEach(device => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.text = device.label || `Camera ${this.videoSelect.length + 1}`;
      this.videoSelect.appendChild(option);
    });
    
    // Add audio output devices
    this.mediaDevices.audiooutput.forEach(device => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.text = device.label || `Speaker ${this.speakerSelect.length + 1}`;
      this.speakerSelect.appendChild(option);
    });
  }
  
  /**
   * Apply media settings
   */
  async applySettings() {
    try {
      // Get selected devices
      const audioDeviceId = this.audioSelect.value;
      const videoDeviceId = this.videoSelect.value;
      const speakerDeviceId = this.speakerSelect.value;
      
      // Apply audio constraints
      if (audioDeviceId) {
        await webRTC.changeAudioDevice(audioDeviceId);
      }
      
      // Apply video constraints
      if (videoDeviceId) {
        await webRTC.changeVideoDevice(videoDeviceId);
      }
      
      // Apply speaker (if supported)
      if (speakerDeviceId && 'setSinkId' in HTMLMediaElement.prototype) {
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
          audio.setSinkId(speakerDeviceId).catch(e => {
            console.error('Error setting audio output device:', e);
          });
        });
      }
      
      // Close modal
      this.settingsModal.style.display = 'none';
      
      // Show success message
      toast.success('Settings applied successfully');
    } catch (error) {
      console.error('Error applying settings:', error);
      toast.error('Failed to apply settings');
    }
  }
  
  /**
   * Set up file upload
   */
  setupFileUpload() {
    this.fileUpload.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      
      if (file) {
        try {
          // Show loading state
          toast.info(`Uploading ${file.name}...`);
          
          // Upload file
          await fileSharingManager.uploadFile(file);
          
          // Clear input
          this.fileUpload.value = '';
          
          // Show success message
          toast.success('File uploaded successfully');
          
          // Update files list
          this.updateFilesList();
        } catch (error) {
          console.error('File upload error:', error);
          toast.error('Failed to upload file');
        }
      }
    });
  }
  
  /**
   * Set up chat input
   */
  setupChatInput() {
    // Send message on button click
    this.sendMessageBtn.addEventListener('click', () => {
      this.sendChatMessage();
    });
    
    // Send message on enter key
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendChatMessage();
      }
    });
  }
  
  /**
   * Send chat message
   */
  sendChatMessage() {
    const message = this.chatInput.value.trim();
    
    if (message) {
      chatManager.sendMessage(message);
      this.chatInput.value = '';
    }
  }
  
  /**
   * Add a new chat message to the UI
   */
  addChatMessage(message) {
    const isOwnMessage = message.senderId === this.localUser.id;
    const messageTime = message.timestamp ? new Date(message.timestamp) : new Date();
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isOwnMessage ? 'own' : ''}`;
    
    messageElement.innerHTML = `
      <div class="message-header">
        <span class="message-sender">${isOwnMessage ? 'You' : message.senderName}</span>
        <span class="message-time">${this.formatTime(messageTime)}</span>
      </div>
      <div class="message-content">${this.formatMessageText(message.text)}</div>
    `;
    
    this.chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }
  
  /**
   * Format message text (convert URLs to links, etc.)
   */
  formatMessageText(text) {
    // Replace URLs with clickable links
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlRegex, function(url) {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
  }
  
  /**
   * Format time for chat messages
   */
  formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  /**
   * Update participants list in UI
   */
  updateParticipantsList(participants) {
    if (!this.participantsList) return;
    
    // Store participants
    this.participants = participants;
    
    // Clear list
    this.participantsList.innerHTML = '';
    
    // Add participants
    Object.values(participants).forEach(participant => {
      const isLocal = participant.socketId === socket.id;
      
      const participantElement = document.createElement('div');
      participantElement.className = 'participant';
      participantElement.innerHTML = `
        <div class="participant-info" style="display: flex; align-items: center; padding: 8px 12px; margin-bottom: 4px;">
          <div class="participant-avatar" style="width: 32px; height: 32px; border-radius: 50%; background-color: var(--primary-light); color: white; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
            ${participant.userName.charAt(0).toUpperCase()}
          </div>
          <div class="participant-name" style="font-weight: 500;">
            ${participant.userName} ${isLocal ? '(You)' : ''}
          </div>
        </div>
      `;
      
      this.participantsList.appendChild(participantElement);
    });
  }
  
  /**
   * Add local video to the grid
   */
  addLocalVideo(stream) {
    // Create container
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    videoContainer.dataset.userId = this.localUser.id;
    
    // Create video element
    const videoElement = document.createElement('video');
    videoElement.className = 'video-element';
    videoElement.muted = true; // Mute local video
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    
    // Add video overlay
    const videoOverlay = document.createElement('div');
    videoOverlay.className = 'video-overlay';
    videoOverlay.innerHTML = `
      <div class="user-name">${this.localUser.username} (You)</div>
      <div class="video-status">
        <div class="mic-status"><i class="fas fa-microphone"></i></div>
        <div class="cam-status"><i class="fas fa-video"></i></div>
      </div>
    `;
    
    // Add to container
    videoContainer.appendChild(videoElement);
    videoContainer.appendChild(videoOverlay);
    
    // Add to video grid
    this.videoGrid.appendChild(videoContainer);
    
    // Set stream
    videoElement.srcObject = stream;
    
    // Store reference
    this.localVideoElement = videoElement;
    
    return videoElement;
  }
  
  /**
   * Add remote video to the grid
   */
  addRemoteVideo(userId, stream, userName) {
    // Check if already exists
    const existingContainer = document.querySelector(`.video-container[data-peer-id="${userId}"]`);
    if (existingContainer) {
      const videoElement = existingContainer.querySelector('video');
      if (videoElement) {
        videoElement.srcObject = stream;
        return videoElement;
      }
    }
    
    // Create container
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    videoContainer.dataset.peerId = userId;
    
    // Create video element
    const videoElement = document.createElement('video');
    videoElement.className = 'video-element';
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    
    // Add video overlay
    const videoOverlay = document.createElement('div');
    videoOverlay.className = 'video-overlay';
    videoOverlay.innerHTML = `
      <div class="user-name">${userName || 'Participant'}</div>
      <div class="video-status">
        <div class="mic-status"><i class="fas fa-microphone"></i></div>
        <div class="cam-status"><i class="fas fa-video"></i></div>
      </div>
    `;
    
    // Add to container
    videoContainer.appendChild(videoElement);
    videoContainer.appendChild(videoOverlay);
    
    // Add to video grid
    this.videoGrid.appendChild(videoContainer);
    
    // Set stream
    videoElement.srcObject = stream;
    
    // Store reference
    this.videoElements[userId] = videoElement;
    
    return videoElement;
  }
  
  /**
   * Remove a video from the grid
   */
  removeVideo(userId) {
    const videoContainer = document.querySelector(`.video-container[data-peer-id="${userId}"]`);
    
    if (videoContainer) {
      videoContainer.remove();
    }
    
    // Remove from references
    if (this.videoElements[userId]) {
      delete this.videoElements[userId];
    }
  }
  
  /**
   * Update microphone button state
   */
  updateMicButton(isOn) {
    this.isMicOn = isOn;
    
    if (isOn) {
      this.micBtn.classList.add('active');
      this.micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    } else {
      this.micBtn.classList.remove('active');
      this.micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
    }
    
    // Update local video overlay
    if (this.localVideoElement) {
      const micStatus = this.localVideoElement.parentElement.querySelector('.mic-status');
      if (micStatus) {
        if (isOn) {
          micStatus.innerHTML = '<i class="fas fa-microphone"></i>';
          micStatus.classList.remove('muted');
        } else {
          micStatus.innerHTML = '<i class="fas fa-microphone-slash"></i>';
          micStatus.classList.add('muted');
        }
      }
    }
  }
  
  /**
   * Update video button state
   */
  updateVideoButton(isOn) {
    this.isVideoOn = isOn;
    
    if (isOn) {
      this.videoBtn.classList.add('active');
      this.videoBtn.innerHTML = '<i class="fas fa-video"></i>';
    } else {
      this.videoBtn.classList.remove('active');
      this.videoBtn.innerHTML = '<i class="fas fa-video-slash"></i>';
    }
    
    // Update local video overlay
    if (this.localVideoElement) {
      const camStatus = this.localVideoElement.parentElement.querySelector('.cam-status');
      if (camStatus) {
        if (isOn) {
          camStatus.innerHTML = '<i class="fas fa-video"></i>';
          camStatus.classList.remove('muted');
        } else {
          camStatus.innerHTML = '<i class="fas fa-video-slash"></i>';
          camStatus.classList.add('muted');
        }
      }
    }
  }
  
  /**
   * Update screen share button state
   */
  updateScreenShareButton(isSharing) {
    this.isScreenSharing = isSharing;
    
    if (isSharing) {
      this.screenShareBtn.classList.add('active');
      toast.info('Screen sharing started');
    } else {
      this.screenShareBtn.classList.remove('active');
      
      if (this.isScreenSharing) {
        toast.info('Screen sharing stopped');
      }
    }
  }
  
  /**
   * Update recording button state
   */
  updateRecordingButton(isRecording) {
    this.isRecording = isRecording;
    
    if (isRecording) {
      this.recordBtn.classList.add('active');
      this.recordBtn.innerHTML = '<i class="fas fa-stop-circle"></i>';
      toast.info('Recording started');
    } else {
      this.recordBtn.classList.remove('active');
      this.recordBtn.innerHTML = '<i class="fas fa-record-vinyl"></i>';
      
      if (this.isRecording) {
        toast.info('Recording stopped. Download will start automatically.');
      }
    }
  }
  
  /**
   * Update files list in UI
   */
  updateFilesList() {
    if (!this.filesList) return;
    
    // Get files
    const files = fileSharingManager.getAllFiles();
    
    // Clear list
    this.filesList.innerHTML = '';
    
    if (files.length === 0) {
      this.filesList.innerHTML = '<p>No files shared yet.</p>';
      return;
    }
    
    // Add files
    files.forEach(file => {
      const fileElement = document.createElement('div');
      fileElement.className = 'file-item';
      
      const fileIcon = fileSharingManager.getFileIcon(file.type);
      const fileSize = fileSharingManager.formatFileSize(file.size);
      
      fileElement.innerHTML = `
        <div class="file-icon">
          <i class="fas ${fileIcon}"></i>
        </div>
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-meta">
            <span>${fileSize}</span>
            <span>Shared by: ${file.uploadedBy}</span>
          </div>
        </div>
        <div class="file-actions">
          <button class="btn btn-sm download-file-btn">
            <i class="fas fa-download"></i>
          </button>
        </div>
      `;
      
      this.filesList.appendChild(fileElement);
      
      // Add download handler
      const downloadBtn = fileElement.querySelector('.download-file-btn');
      downloadBtn.addEventListener('click', () => {
        fileSharingManager.downloadFile(file.url, file.name);
      });
    });
  }
  
  /**
   * Show connection error
   */
  showConnectionError(message) {
    this.connectionMessage.textContent = message || 'Failed to connect to the meeting.';
    this.connectionModal.style.display = 'flex';
  }
  
  /**
   * Hide connection error
   */
  hideConnectionError() {
    this.connectionModal.style.display = 'none';
  }
  
  /**
   * Copy room link to clipboard
   */
  copyRoomLink(roomId) {
    const roomUrl = `${window.location.origin}/meeting/${roomId}`;
    
    // Use modern clipboard API if available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(roomUrl)
        .then(() => {
          toast.success('Meeting link copied to clipboard');
        })
        .catch(err => {
          console.error('Failed to copy link:', err);
          toast.error('Failed to copy link');
          
          // Fallback to legacy method
          this.copyToClipboardLegacy(roomUrl);
        });
    } else {
      // Fallback for browsers without clipboard API
      this.copyToClipboardLegacy(roomUrl);
    }
  }
  
  /**
   * Legacy method to copy to clipboard
   */
  copyToClipboardLegacy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        toast.success('Meeting link copied to clipboard');
      } else {
        toast.error('Failed to copy link');
      }
    } catch (err) {
      console.error('Failed to copy link:', err);
      toast.error('Failed to copy link');
    }
    
    document.body.removeChild(textArea);
  }
  
  /**
   * Leave meeting
   */
  async leaveMeeting() {
    try {
      const token = Auth.getToken();
      const roomId = this.roomData.roomId;
      
      // Call leave API
      const response = await fetch(`/api/room/${roomId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Clean up resources
      webRTC.cleanup();
      recordingManager.cleanup();
      
      // Redirect to home
      window.location.href = '/';
    } catch (error) {
      console.error('Error leaving meeting:', error);
      
      // Just redirect anyway
      window.location.href = '/';
    }
  }
}

// Create global instance
const meetingUI = new MeetingUI();