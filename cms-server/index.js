const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require("socket.io");
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const Node = require('./models/Node');

const PORT = process.env.PORT || 8000;
const DB_URI = 'mongodb://localhost:27017/node-management';
const UPLOAD_DIR = path.join(__dirname, 'temp_uploads');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({ dest: UPLOAD_DIR });

mongoose.connect(DB_URI)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.error(err));

const notifyClients = () => {
  io.emit('nodes_updated');
};

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

app.post('/register', async (req, res) => {
  const { nodeId, address } = req.body;
  if (!nodeId || !address) {
    return res.status(400).json({ error: 'nodeId and address are required' });
  }

  try {
    const node = await Node.findOneAndUpdate(
      { nodeId },
      { address, status: 'connected', lastUploadStatus: 'pending' },
      { upsert: true, new: true }
    );
    console.log(`Node registered/updated: ${node.nodeId}`);
    notifyClients();
    res.status(200).json(node);
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/disconnect', async (req, res) => {
  const { nodeId } = req.body;
  if (!nodeId) {
    return res.status(400).json({ error: 'nodeId is required' });
  }

  try {
    const node = await Node.findOneAndUpdate(
      { nodeId },
      { status: 'disconnected' },
      { new: true }
    );

    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    notifyClients();
    res.status(200).json(node);
  } catch (err) {
    console.error('Disconnect error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/nodes', async (req, res) => {
  try {
    const nodes = await Node.find().sort({ createdAt: 1 });
    res.status(200).json(nodes);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/upload-to-all', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { path: filePath, originalname: fileName } = req.file;

  try {
    const connectedNodes = await Node.find({ status: 'connected' });
    if (!connectedNodes.length) {
      return res.status(404).json({ message: 'No connected nodes found' });
    }

    console.log(`Distributing '${fileName}' to ${connectedNodes.length} nodes...`);

    const uploadPromises = connectedNodes.map(async (node) => {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath), fileName);

      try {
        await axios.post(`${node.address}/upload`, formData, {
          headers: formData.getHeaders(),
        });
        await Node.findByIdAndUpdate(node._id, { lastUploadStatus: 'success' });
        return { nodeId: node.nodeId, status: 'success' };
      } catch (err) {
        console.warn(`Failed to upload to ${node.nodeId}: ${err.message}`);
        await Node.findByIdAndUpdate(node._id, { lastUploadStatus: 'failed' });
        return { nodeId: node.nodeId, status: 'failed', reason: err.message };
      }
    });

    const results = await Promise.allSettled(uploadPromises);

    notifyClients();
    res.status(200).json({ 
      message: 'File distribution attempted', 
      results: results.map(r => r.value || r.reason)
    });

  } catch (err) {
    console.error('Distribution error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

server.listen(PORT, () => {
  console.log(`CMS Server listening on port ${PORT}`);
});