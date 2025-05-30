/**
 * File sharing functionality for meeting rooms
 */
class FileSharingManager {
  constructor() {
    this.socket = null;
    this.roomId = null;
    this.files = [];
    this.onNewFileCallback = null;
  }
  
  /**
   * Initialize file sharing manager
   */
  initialize(socket, roomId) {
    this.socket = socket;
    this.roomId = roomId;
    
    // Fetch existing files
    this.fetchRoomFiles();
    
    // Setup socket event listeners
    this.setupSocketListeners();
  }
  
  /**
   * Set up socket event listeners for file sharing
   */
  setupSocketListeners() {
    if (!this.socket) return;
    
    // When a user shares a file
    this.socket.on('user-file-share', (data) => {
      // Fetch updated file list
      this.fetchRoomFiles();
      
      // Trigger notification callback
      if (this.onNewFileCallback) {
        this.onNewFileCallback(data.fileMetadata, data.userName);
      }
    });
  }
  
  /**
   * Fetch all files in the room
   */
  async fetchRoomFiles() {
    try {
      const token = Auth.getToken();
      
      const response = await fetch(`/api/files/${this.roomId}/files`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch files');
      }
      
      this.files = data.files;
      return this.files;
    } catch (error) {
      console.error('Fetch files error:', error);
      return [];
    }
  }
  
  /**
   * Upload a file to the room
   */
  async uploadFile(file) {
    try {
      const token = Auth.getToken();
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload file
      const response = await fetch(`/api/files/${this.roomId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload file');
      }
      
      // Add to files list
      this.files.push(data.file);
      
      // Notify other participants
      if (this.socket) {
        this.socket.emit('file-share-started', data.file);
      }
      
      return data.file;
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
    }
  }
  
  /**
   * Download a file
   */
  downloadFile(fileUrl, fileName) {
    // Create a link element
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    
    // Add to document and click
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
  }
  
  /**
   * Set callback for new files
   */
  setOnNewFile(callback) {
    this.onNewFileCallback = callback;
  }
  
  /**
   * Get all files
   */
  getAllFiles() {
    return this.files;
  }
  
  /**
   * Get file icon based on file type
   */
  getFileIcon(fileType) {
    if (fileType.includes('image')) {
      return 'fa-image';
    } else if (fileType.includes('pdf')) {
      return 'fa-file-pdf';
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return 'fa-file-word';
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return 'fa-file-excel';
    } else if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
      return 'fa-file-powerpoint';
    } else if (fileType.includes('text')) {
      return 'fa-file-alt';
    } else {
      return 'fa-file';
    }
  }
  
  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else if (bytes < 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    } else {
      return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }
  }
}

// Create global instance
const fileSharingManager = new FileSharingManager();