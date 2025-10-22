const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  nodeId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  address: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['connected', 'disconnected'],
    default: 'disconnected'
  },
  lastUploadStatus: { 
    type: String, 
    enum: ['pending', 'success', 'failed'],
    default: 'pending' 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Node', nodeSchema);