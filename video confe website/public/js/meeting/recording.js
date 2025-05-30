/**
 * Recording functionality for meeting rooms
 */
class RecordingManager {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.localStream = null;
    this.onRecordingStartCallback = null;
    this.onRecordingStopCallback = null;
    this.recordingStream = null;
    this.recordingStartTime = null;
    this.recordingTimer = null;
  }
  
  /**
   * Initialize recording manager
   */
  initialize(localStream) {
    this.localStream = localStream;
  }
  
  /**
   * Start recording
   */
  async startRecording() {
    if (this.isRecording || !this.localStream) return false;
    
    try {
      // Create a new stream that combines video and audio
      this.recordingStream = this.localStream;
      
      // Create media recorder
      this.mediaRecorder = new MediaRecorder(this.recordingStream, {
        mimeType: this.getSupportedMimeType(),
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });
      
      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        this.saveRecording();
      };
      
      // Start recording
      this.recordedChunks = [];
      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
      this.recordingStartTime = new Date();
      
      // Start timer
      this.startTimer();
      
      // Trigger callback
      if (this.onRecordingStartCallback) {
        this.onRecordingStartCallback();
      }
      
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  }
  
  /**
   * Stop recording
   */
  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) return false;
    
    try {
      // Stop media recorder
      this.mediaRecorder.stop();
      this.isRecording = false;
      
      // Stop timer
      this.stopTimer();
      
      // Trigger callback
      if (this.onRecordingStopCallback) {
        this.onRecordingStopCallback();
      }
      
      return true;
    } catch (error) {
      console.error('Error stopping recording:', error);
      return false;
    }
  }
  
  /**
   * Save recording as a file
   */
  saveRecording() {
    if (this.recordedChunks.length === 0) return;
    
    try {
      // Create blob from recorded chunks
      const blob = new Blob(this.recordedChunks, {
        type: this.getSupportedMimeType()
      });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `recording_${new Date().toISOString()}.webm`;
      
      // Add to document and click
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      // Clear recorded chunks
      this.recordedChunks = [];
    } catch (error) {
      console.error('Error saving recording:', error);
    }
  }
  
  /**
   * Get supported MIME type for recording
   */
  getSupportedMimeType() {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return 'video/webm';
  }
  
  /**
   * Start recording timer
   */
  startTimer() {
    this.stopTimer();
    
    this.recordingTimer = setInterval(() => {
      if (this.onRecordingStartCallback) {
        const elapsedTime = this.getRecordingDuration();
        this.onRecordingStartCallback(elapsedTime);
      }
    }, 1000);
  }
  
  /**
   * Stop recording timer
   */
  stopTimer() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }
  
  /**
   * Get recording duration in formatted string
   */
  getRecordingDuration() {
    if (!this.recordingStartTime) return '00:00';
    
    const now = new Date();
    const diff = now - this.recordingStartTime;
    
    const seconds = Math.floor(diff / 1000) % 60;
    const minutes = Math.floor(diff / (1000 * 60)) % 60;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }
  
  /**
   * Set callback for recording start/update
   */
  setOnRecordingStart(callback) {
    this.onRecordingStartCallback = callback;
  }
  
  /**
   * Set callback for recording stop
   */
  setOnRecordingStop(callback) {
    this.onRecordingStopCallback = callback;
  }
  
  /**
   * Check if recording is active
   */
  isActive() {
    return this.isRecording;
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    this.stopRecording();
    this.recordingStream = null;
    this.localStream = null;
    this.recordedChunks = [];
  }
}

// Create global instance
const recordingManager = new RecordingManager();