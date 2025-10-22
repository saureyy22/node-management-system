const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const NODE_ID = process.env.NODE_ID || `node-${PORT}`;
const CMS_URL = 'http://localhost:8000';
const UPLOAD_DIR = path.join(__dirname, 'uploads', NODE_ID);

const app = express();
app.use(express.json());

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    console.log(`[${NODE_ID}] Upload failed: No file`);
    return res.status(400).json({ status: 'error', message: 'No file uploaded' });
  }
  
  console.log(`[${NODE_ID}] File received: ${req.file.filename}`);
  res.status(200).json({ status: 'success', filename: req.file.filename });
});

const registerWithCMS = async () => {
  try {
    const nodeAddress = `http://localhost:${PORT}`;
    await axios.post(`${CMS_URL}/register`, {
      nodeId: NODE_ID,
      address: nodeAddress,
    });
    console.log(`[${NODE_ID}] Registered with CMS at ${CMS_URL}`);
  } catch (error) {
    console.error(`[${NODE_ID}] CMS registration failed: ${error.message}. Retrying...`);
    setTimeout(registerWithCMS, 5000); 
  }
};

app.listen(PORT, () => {
  console.log(`[${NODE_ID}] Worker node listening on port ${PORT}`);
  registerWithCMS();
});