/**
 * Whiteboard functionality for collaborative drawing
 */
class WhiteboardHandler {
  constructor(socket, roomId, userId, canvasId) {
    this.socket = socket;
    this.roomId = roomId;
    this.userId = userId;
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.isDrawing = false;
    this.drawHistory = [];
    this.currentPath = [];
    this.tool = 'pen';
    this.color = '#000000';
    this.size = 2;

    this.initializeCanvas();
    this.initializeSocketListeners();
    this.initializeEventListeners();
  }

  // Initialize canvas settings
  initializeCanvas() {
    // Set canvas size to match container
    this.resizeCanvas();

    // Set default styles
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.size;

    // Add window resize listener
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  // Resize canvas to match container
  resizeCanvas() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    this.redrawCanvas();
  }

  // Initialize socket event listeners
  initializeSocketListeners() {
    this.socket.on('draw', this.handleRemoteDraw.bind(this));
    this.socket.on('whiteboard-cleared', this.handleRemoteClear.bind(this));
    this.socket.on('whiteboard-data', this.handleWhiteboardData.bind(this));
    this.socket.on('undo', this.handleRemoteUndo.bind(this));
    this.socket.on('tool-changed', this.handleRemoteToolChange.bind(this));
    this.socket.on('color-changed', this.handleRemoteColorChange.bind(this));
    this.socket.on('brush-size-changed', this.handleRemoteBrushSizeChange.bind(this));
  }

  // Initialize canvas event listeners
  initializeEventListeners() {
    this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    this.canvas.addEventListener('mousemove', this.draw.bind(this));
    this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const mouseEvent = new MouseEvent('mouseup', {});
      this.canvas.dispatchEvent(mouseEvent);
    });
  }

  // Start drawing
  startDrawing(e) {
    this.isDrawing = true;
    const { x, y } = this.getMousePos(e);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.currentPath = [{ x, y, tool: this.tool, color: this.color, size: this.size }];
  }

  // Draw
  draw(e) {
    if (!this.isDrawing) return;

    const { x, y } = this.getMousePos(e);
    
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    
    this.currentPath.push({ x, y });

    // Emit draw event
    this.socket.emit('draw', {
      path: this.currentPath,
      tool: this.tool,
      color: this.color,
      size: this.size
    }, this.roomId);
  }

  // Stop drawing
  stopDrawing() {
    if (!this.isDrawing) return;
    
    this.isDrawing = false;
    this.ctx.closePath();
    
    if (this.currentPath.length > 0) {
      this.drawHistory.push({
        path: this.currentPath,
        tool: this.tool,
        color: this.color,
        size: this.size
      });
    }
    
    this.currentPath = [];
  }

  // Get mouse position relative to canvas
  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  // Handle remote draw event
  handleRemoteDraw(drawData) {
    const { path, tool, color, size } = drawData;
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = size;
    
    this.ctx.moveTo(path[0].x, path[0].y);
    path.forEach(point => {
      this.ctx.lineTo(point.x, point.y);
    });
    
    this.ctx.stroke();
    this.ctx.closePath();

    // Reset to current user's settings
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.size;
  }

  // Clear whiteboard
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawHistory = [];
    this.socket.emit('clear-whiteboard', this.roomId);
  }

  // Handle remote clear event
  handleRemoteClear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawHistory = [];
  }

  // Undo last action
  undo() {
    if (this.drawHistory.length === 0) return;
    
    this.drawHistory.pop();
    this.redrawCanvas();
    this.socket.emit('undo', this.roomId);
  }

  // Handle remote undo event
  handleRemoteUndo() {
    if (this.drawHistory.length === 0) return;
    
    this.drawHistory.pop();
    this.redrawCanvas();
  }

  // Redraw canvas from history
  redrawCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawHistory.forEach(item => {
      const { path, tool, color, size } = item;
      
      this.ctx.beginPath();
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = size;
      
      this.ctx.moveTo(path[0].x, path[0].y);
      path.forEach(point => {
        this.ctx.lineTo(point.x, point.y);
      });
      
      this.ctx.stroke();
      this.ctx.closePath();
    });

    // Reset to current user's settings
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.size;
  }

  // Change drawing tool
  setTool(tool) {
    this.tool = tool;
    this.socket.emit('tool-change', tool, this.roomId);
  }

  // Handle remote tool change
  handleRemoteToolChange(tool) {
    // Handle tool change UI if needed
  }

  // Change color
  setColor(color) {
    this.color = color;
    this.ctx.strokeStyle = color;
    this.socket.emit('color-change', color, this.roomId);
  }

  // Handle remote color change
  handleRemoteColorChange(color) {
    // Handle color change UI if needed
  }

  // Change brush size
  setBrushSize(size) {
    this.size = size;
    this.ctx.lineWidth = size;
    this.socket.emit('brush-size-change', size, this.roomId);
  }

  // Handle remote brush size change
  handleRemoteBrushSizeChange(size) {
    // Handle brush size change UI if needed
  }

  // Handle initial whiteboard data
  handleWhiteboardData(data) {
    this.drawHistory = data;
    this.redrawCanvas();
  }

  // Save whiteboard
  save() {
    return this.canvas.toDataURL('image/png');
  }

  // Clean up resources
  cleanup() {
    window.removeEventListener('resize', this.resizeCanvas);
    this.socket.off('draw');
    this.socket.off('whiteboard-cleared');
    this.socket.off('whiteboard-data');
    this.socket.off('undo');
    this.socket.off('tool-changed');
    this.socket.off('color-changed');
    this.socket.off('brush-size-changed');
  }
}

// Export for use in other modules
window.WhiteboardHandler = WhiteboardHandler;