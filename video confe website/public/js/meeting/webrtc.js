/**
 * WebRTC functionality for peer-to-peer connections
 */
class WebRTCHandler {
  constructor(socket, roomId, userId) {
    this.socket = socket;
    this.roomId = roomId;
    this.userId = userId;
    this.peers = new Map();
    this.localStream = null;
    this.screenStream = null;
    this.isScreenSharing = false;

    // ICE servers configuration
    this.configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    this.initializeSocketListeners();
  }

  // Initialize socket event listeners
  initializeSocketListeners() {
    this.socket.on('user-connected', this.handleUserConnected.bind(this));
    this.socket.on('user-disconnected', this.handleUserDisconnected.bind(this));
    this.socket.on('offer', this.handleOffer.bind(this));
    this.socket.on('answer', this.handleAnswer.bind(this));
    this.socket.on('ice-candidate', this.handleIceCandidate.bind(this));
  }

  // Initialize local media stream
  async initializeLocalStream(videoEnabled = true, audioEnabled = true) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled,
        audio: audioEnabled
      });
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  // Create new peer connection
  createPeerConnection(userId) {
    try {
      const peerConnection = new RTCPeerConnection(this.configuration);

      // Add local stream tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream);
      });

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('ice-candidate', event.candidate, this.roomId, this.userId, userId);
        }
      };

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams;
        this.handleRemoteStream(userId, remoteStream);
      };

      this.peers.set(userId, peerConnection);
      return peerConnection;
    } catch (error) {
      console.error('Error creating peer connection:', error);
      throw error;
    }
  }

  // Handle user connected event
  async handleUserConnected(userId) {
    try {
      if (userId === this.userId) return;
      
      const peerConnection = this.createPeerConnection(userId);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      this.socket.emit('offer', offer, this.roomId, this.userId, userId);
    } catch (error) {
      console.error('Error handling user connected:', error);
    }
  }

  // Handle user disconnected event
  handleUserDisconnected(userId) {
    if (this.peers.has(userId)) {
      this.peers.get(userId).close();
      this.peers.delete(userId);
      this.removeRemoteStream(userId);
    }
  }

  // Handle received offer
  async handleOffer(offer, userId) {
    try {
      if (userId === this.userId) return;

      const peerConnection = this.createPeerConnection(userId);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      this.socket.emit('answer', answer, this.roomId, this.userId, userId);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  // Handle received answer
  async handleAnswer(answer, userId) {
    try {
      if (userId === this.userId) return;

      const peerConnection = this.peers.get(userId);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  // Handle received ICE candidate
  async handleIceCandidate(candidate, userId) {
    try {
      if (userId === this.userId) return;

      const peerConnection = this.peers.get(userId);
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  // Start screen sharing
  async startScreenShare() {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });

      // Replace video track with screen track
      const videoTrack = this.screenStream.getVideoTracks()[0];
      this.peers.forEach(peerConnection => {
        const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      this.isScreenSharing = true;
      this.socket.emit('start-screen-share', this.roomId, this.userId);

      // Handle screen share stop
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      return this.screenStream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }

  // Stop screen sharing
  async stopScreenShare() {
    try {
      if (this.screenStream) {
        this.screenStream.getTracks().forEach(track => track.stop());
        this.screenStream = null;
      }

      // Replace screen track with video track
      const videoTrack = this.localStream.getVideoTracks()[0];
      this.peers.forEach(peerConnection => {
        const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      this.isScreenSharing = false;
      this.socket.emit('stop-screen-share', this.roomId, this.userId);
    } catch (error) {
      console.error('Error stopping screen share:', error);
      throw error;
    }
  }

  // Toggle video
  async toggleVideo(enabled) {
    this.localStream.getVideoTracks().forEach(track => {
      track.enabled = enabled;
    });
    this.socket.emit('toggle-video', this.roomId, this.userId, enabled);
  }

  // Toggle audio
  async toggleAudio(enabled) {
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = enabled;
    });
    this.socket.emit('toggle-audio', this.roomId, this.userId, enabled);
  }

  // Clean up resources
  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
    }
    this.peers.forEach(peerConnection => {
      peerConnection.close();
    });
    this.peers.clear();
  }

  // Virtual methods to be implemented by the UI layer
  handleRemoteStream(userId, stream) {
    // To be implemented by UI
  }

  removeRemoteStream(userId) {
    // To be implemented by UI
  }
}

// Export for use in other modules
window.WebRTCHandler = WebRTCHandler;