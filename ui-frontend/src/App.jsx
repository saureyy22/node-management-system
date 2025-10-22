import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

const CMS_URL = 'http://localhost:8000';
const socket = io(CMS_URL);

const Spinner = () => <div className="spinner"></div>;

const StatusPill = ({ status }) => {
  const statusClass = status ? status.toLowerCase().replace(' ', '-') : 'unknown';
  return <span className={`status-pill status-${statusClass}`}>{status || 'N/A'}</span>;
};

function App() {
  const [nodes, setNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef(null);

  const fetchNodes = async () => {
    try {
      const response = await axios.get(`${CMS_URL}/nodes`);
      setNodes(response.data);
    } catch (error) {
      console.error('Error fetching nodes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
    const handleNodesUpdate = () => fetchNodes();
    
    socket.on('nodes_updated', handleNodesUpdate);
    return () => {
      socket.off('nodes_updated', handleNodesUpdate);
      socket.disconnect();
    };
  }, []);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setUploadMessage('Please select a file first.');
      return;
    }

    setIsUploading(true);
    setUploadMessage('Uploading...');
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(`${CMS_URL}/upload-to-all`, formData);
      setUploadMessage(`✅ ${response.data.message}`);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
      setSelectedFile(null);

    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadMessage(`❌ File upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      fetchNodes();
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🛰️ Node Management System</h1>
      </header>

      <main className="main-layout">
        <aside className="card upload-card">
          <h2>📄 Upload & Distribute</h2>
          <form onSubmit={handleSubmit}>
            <label htmlFor="file-upload" className="file-label">
              {selectedFile ? selectedFile.name : 'Choose a file...'}
            </label>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
            <button type="submit" disabled={!selectedFile || isUploading}>
              {isUploading ? <Spinner /> : 'Distribute to All Nodes'}
            </button>
          </form>
          {uploadMessage && <p className="upload-message">{uploadMessage}</p>}
        </aside>

        <section className="card node-list-card">
          <h2>🖥️ Connected Nodes ({nodes.length})</h2>
          <div className="table-wrapper">
            <table className="node-table">
              <thead>
                <tr>
                  <th>Node ID</th>
                  <th>Address</th>
                  <th>Connection</th>
                  <th>Last Upload</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="loading-cell">
                      <Spinner />
                      <p>Loading nodes...</p>
                    </td>
                  </tr>
                ) : nodes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-cell">
                      No nodes registered yet.
                    </td>
                  </tr>
                ) : (
                  nodes.map((node) => (
                    <tr key={node._id}>
                      <td data-label="Node ID">{node.nodeId}</td>
                      <td data-label="Address" className="address-cell">{node.address}</td>
                      <td data-label="Connection">
                        <StatusPill status={node.status} />
                      </td>
                      <td data-label="Last Upload">
                        <StatusPill status={node.lastUploadStatus} />
                      </td>
                      <td data-label="Last Seen">
                        {new Date(node.updatedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;