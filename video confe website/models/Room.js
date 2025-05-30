const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    default: null
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['active', 'ended'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for faster queries
roomSchema.index({ createdBy: 1 });
roomSchema.index({ status: 1 });

// Method to check if user is participant
roomSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => p.toString() === userId.toString());
};

// Method to add participant
roomSchema.methods.addParticipant = function(userId) {
  if (!this.isParticipant(userId)) {
    this.participants.push(userId);
  }
};

// Method to remove participant
roomSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(
    p => p.toString() !== userId.toString()
  );
};

// Method to end room
roomSchema.methods.endRoom = function() {
  this.status = 'ended';
};

module.exports = mongoose.model('Room', roomSchema);