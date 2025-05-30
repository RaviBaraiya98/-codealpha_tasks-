// Initialize Socket.IO connection
const socket = io(window.CONFIG.SOCKET_URL, {
  auth: {
    token: Auth.getToken()
  }
});

// WebRTC configuration
const peerConnections = {};
let localStream = null;
let screenStream = null;

// Meeting class to handle video conferencing functionality
class Meeting {
  constructor() {
    this.localStream = null;
    this.peerConnections = {};
    this.screenStream = null;
    this.isScreenSharing = false;
    this.isMuted = false;
    this.isVideoOff = false;
    this.chatMessages = [];
    this.socket = null;
    this.roomId = null;
    this.participants = new Map();
  }

  // Initialize meeting
  async init(roomId) {
    this.roomId = roomId;
    await this.initializeMedia();
    this.initializeSocket();
    this.setupEventListeners();
  }

  // Initialize media streams
  async initializeMedia() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(window.CONFIG.MEDIA_CONSTRAINTS);
      this.updateLocalVideo();

      // Join room
      this.socket.emit('joinRoom', { roomId });

    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Could not access camera or microphone');
    }
  }

  // Initialize socket connection
  initializeSocket() {
    this.socket = io(window.CONFIG.SOCKET_URL);
    
    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
      this.socket.emit('join-room', this.roomId);
    });

    this.socket.on('user-joined', async (userId) => {
      console.log('User joined:', userId);
      await this.createPeerConnection(userId);
    });

    this.socket.on('user-left', (userId) => {
      console.log('User left:', userId);
      this.removeParticipant(userId);
    });

    this.socket.on('offer', async (data) => {
      await this.handleOffer(data);
    });

    this.socket.on('answer', async (data) => {
      await this.handleAnswer(data);
    });

    this.socket.on('ice-candidate', async (data) => {
      await this.handleIceCandidate(data);
    });

    this.socket.on('chat-message', (message) => {
      this.handleChatMessage(message);
    });
  }

  // Create peer connection
  async createPeerConnection(userId) {
    const peerConnection = new RTCPeerConnection(window.CONFIG.RTC_CONFIG);
    this.peerConnections[userId] = peerConnection;

    // Add local stream
    this.localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, this.localStream);
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: userId
        });
      }
    };

    // Handle incoming streams
    peerConnection.ontrack = (event) => {
      this.handleRemoteStream(userId, event.streams[0]);
    };

    // Create and send offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    this.socket.emit('offer', {
      offer,
      to: userId
    });
  }

  // Handle incoming offer
  async handleOffer(data) {
    const peerConnection = new RTCPeerConnection(window.CONFIG.RTC_CONFIG);
    this.peerConnections[data.from] = peerConnection;

    this.localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, this.localStream);
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: data.from
        });
      }
    };

    peerConnection.ontrack = (event) => {
      this.handleRemoteStream(data.from, event.streams[0]);
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    this.socket.emit('answer', {
      answer,
      to: data.from
    });
  }

  // Handle incoming answer
  async handleAnswer(data) {
    const peerConnection = this.peerConnections[data.from];
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  }

  // Handle ICE candidates
  async handleIceCandidate(data) {
    const peerConnection = this.peerConnections[data.from];
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  }

  // Handle remote stream
  handleRemoteStream(userId, stream) {
    this.participants.set(userId, stream);
    this.updateParticipantsList();
  }

  // Remove participant
  removeParticipant(userId) {
    if (this.peerConnections[userId]) {
      this.peerConnections[userId].close();
      delete this.peerConnections[userId];
    }
    this.participants.delete(userId);
    this.updateParticipantsList();
  }

  // Toggle mute
  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.isMuted = !audioTrack.enabled;
        this.updateMuteButton();
        this.socket.emit('userMuted', { muted: !audioTrack.enabled });
      }
    }
  }

  // Toggle video
  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.isVideoOff = !videoTrack.enabled;
        this.updateVideoButton();
        this.socket.emit('userVideoOff', { videoOff: !videoTrack.enabled });
      }
    }
  }

  // Toggle screen sharing
  async toggleScreenShare() {
    try {
      if (!this.isScreenSharing) {
        this.screenStream = await navigator.mediaDevices.getDisplayMedia(window.CONFIG.SCREEN_CONSTRAINTS);
        this.screenStream.getVideoTracks()[0].onended = () => {
          this.stopScreenShare();
        };
        this.isScreenSharing = true;
        this.updateScreenShareButton();
        
        // Replace video track in all peer connections
        Object.values(this.peerConnections).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(this.screenStream.getVideoTracks()[0]);
          }
        });

        // Update local video
        const localVideo = document.querySelector('.video-element[data-id="local"]');
        if (localVideo) {
          localVideo.srcObject = this.screenStream;
        }
      } else {
        await this.stopScreenShare();
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
      toast.error('Failed to share screen');
    }
  }

  // Stop screen sharing
  async stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
      this.isScreenSharing = false;
      this.updateScreenShareButton();

      // Restore video track in all peer connections
      const videoTrack = this.localStream.getVideoTracks()[0];
      Object.values(this.peerConnections).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Restore local video
      const localVideo = document.querySelector('.video-element[data-id="local"]');
      if (localVideo) {
        localVideo.srcObject = this.localStream;
      }
    }
  }

  // Send chat message
  sendChatMessage(message) {
    if (message.trim()) {
      const chatMessage = {
        id: Date.now(),
        sender: Auth.getCurrentUser().username,
        text: message,
        timestamp: new Date().toISOString()
      };
      
      this.socket.emit('chat-message', {
        roomId: this.roomId,
        message: chatMessage
      });
      
      this.handleChatMessage(chatMessage);
    }
  }

  // Handle incoming chat message
  handleChatMessage(message) {
    this.chatMessages.push(message);
    this.updateChatUI();
  }

  // Update local video display
  updateLocalVideo() {
    const localVideo = document.getElementById('localVideo');
    if (localVideo && this.localStream) {
      localVideo.srcObject = this.localStream;
    }
  }

  // Update participants list
  updateParticipantsList() {
    const participantsList = document.getElementById('participantsList');
    if (participantsList) {
      participantsList.innerHTML = '';
      this.participants.forEach((stream, userId) => {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        participantsList.appendChild(video);
      });
    }
  }

  // Update chat UI
  updateChatUI() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
      chatMessages.innerHTML = '';
      this.chatMessages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        messageElement.innerHTML = `
          <div class="message-header">
            <span class="sender">${message.sender}</span>
            <span class="timestamp">${new Date(message.timestamp).toLocaleTimeString()}</span>
          </div>
          <div class="message-text">${message.text}</div>
        `;
        chatMessages.appendChild(messageElement);
      });
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  // Update mute button UI
  updateMuteButton() {
    const muteButton = document.getElementById('muteButton');
    if (muteButton) {
      muteButton.innerHTML = this.isMuted ? 
        '<i class="fas fa-microphone-slash"></i>' : 
        '<i class="fas fa-microphone"></i>';
    }
  }

  // Update video button UI
  updateVideoButton() {
    const videoButton = document.getElementById('videoButton');
    if (videoButton) {
      videoButton.innerHTML = this.isVideoOff ? 
        '<i class="fas fa-video-slash"></i>' : 
        '<i class="fas fa-video"></i>';
    }
  }

  // Update screen share button UI
  updateScreenShareButton() {
    const screenShareButton = document.getElementById('screenShareButton');
    if (screenShareButton) {
      screenShareButton.innerHTML = this.isScreenSharing ? 
        '<i class="fas fa-stop-circle"></i>' : 
        '<i class="fas fa-desktop"></i>';
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Mute button
    const muteButton = document.getElementById('muteButton');
    if (muteButton) {
      muteButton.addEventListener('click', () => this.toggleMute());
    }

    // Video button
    const videoButton = document.getElementById('videoButton');
    if (videoButton) {
      videoButton.addEventListener('click', () => this.toggleVideo());
    }

    // Screen share button
    const screenShareButton = document.getElementById('screenShareButton');
    if (screenShareButton) {
      screenShareButton.addEventListener('click', () => this.toggleScreenShare());
    }

    // Chat form
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
          this.sendChatMessage(messageInput.value);
          messageInput.value = '';
        }
      });
    }

    // Leave meeting button
    const leaveButton = document.getElementById('leaveButton');
    if (leaveButton) {
      leaveButton.addEventListener('click', () => {
        this.leaveMeeting();
      });
    }
  }

  // Leave meeting
  leaveMeeting() {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
    }

    // Close all peer connections
    Object.values(this.peerConnections).forEach(pc => pc.close());

    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
    }

    // Leave room
    this.socket.emit('leaveRoom', { roomId: this.roomId });
    window.location.href = '/';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Get room ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('roomId');
  
  if (!roomId) {
    alert('Room ID is required');
    window.location.href = '/';
    return;
  }

  // Elements
  const videoGrid = document.getElementById('videoGrid');
  const micBtn = document.getElementById('micBtn');
  const videoBtn = document.getElementById('videoBtn');
  const screenBtn = document.getElementById('screenBtn');
  const leaveBtn = document.getElementById('leaveBtn');
  const roomName = document.getElementById('roomName');
  const participantsList = document.getElementById('participantsList');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendChatBtn = document.getElementById('sendChatBtn');

  // Set room name
  if (roomName) {
    roomName.textContent = `Room: ${roomId}`;
  }

  // Initialize meeting
  window.meeting = new Meeting();
  await window.meeting.init(roomId);

  // Handle page unload
  window.addEventListener('beforeunload', () => {
    window.meeting.leaveMeeting();
  });
}); 