# 🛰️ Node Management System

This project is a full-stack application that simulates a **Central Management System (CMS)** for managing a fleet of distributed "worker" nodes. It features a Node.js backend, a MongoDB database, and a real-time React dashboard.

The CMS can:

  * Register and track the status of multiple worker nodes.
  * Distribute a file to all connected nodes simultaneously.
  * Track the upload status for each node.

The system is composed of three main parts:

1.  **`cms-server`**: The "brain." A Node.js/Express server that manages nodes and distributes files.
2.  **`node-app`**: The "worker." A simple Node.js app that you can run multiple instances of.
3.  **`ui-frontend`**: A React dashboard that provides a real-time UI for the CMS.

-----

## 🛠️ Tech Stack

  * **Backend:** Node.js, Express, Mongoose
  * **Frontend:** React (Vite), Socket.IO Client
  * **Database:** MongoDB
  * **Real-time:** Socket.IO
  * **Dev Ops:** `concurrently` & `cross-env` for monorepo management

-----

##  Project Structure

```
/node-management-system/
├── /cms-server/          (The central "brain" server)
├── /node-app/            (The "worker" node application)
├── /ui-frontend/         (The React dashboard UI)
├── package.json          (Root package for running all apps)
└── README.md
```

-----

##  Setup & Installation

Before you begin, make sure you have **Node.js** and **MongoDB** installed and running on your system.

**1. Clone the Repository:**

```bash
git clone https://github.com/saureyy22/node-management-system
cd node-management-system
```

**2. Install Root Dependencies:**
This installs `concurrently` to run our whole system at once.

```bash
npm install
```

**3. Install App-Specific Dependencies:**
You need to install dependencies for all three applications.

```bash
# Install for CMS
cd cms-server
npm install
cd ..

# Install for Worker Node
cd node-app
npm install
cd ..

# Install for React UI
cd ui-frontend
npm install
cd ..
```

-----

## ▶️ How to Run

### The Easy Way (All-in-One Command)

This is the recommended method. It will start the CMS, the React UI, and three worker nodes all from one terminal.

1.  Make sure your **MongoDB** server is running.

2.  From the **root** of the project, run:

    ```bash
    npm run dev
    ```

This command will launch:

  * **CMS Server** on `http://localhost:8000`
  * **React UI** on `http://localhost:5173` (Vite's default)
  * **Node-A** on port `3001`
  * **Node-B** on port `3002`
  * **Node-C** on port `3003`

You can now open `http://localhost:5173` in your browser to see the dashboard.

### The Manual Way

If you prefer to run each service in its own terminal:

**1. Terminal 1: Start the CMS (Brain)**

```bash
cd cms-server
npm start
```

**2. Terminal 2: Start the Frontend UI**

```bash
cd ui-frontend
npm run dev
```

**3. Terminals 3, 4, ...: Start Your Worker Nodes**
Open a new terminal *for each node* you want to run.

```bash
# In Terminal 3 (for Node-A)
cd node-app
cross-env PORT=3001 NODE_ID=Node-A npm start

# In Terminal 4 (for Node-B)
cd node-app
cross-env PORT=3002 NODE_ID=Node-B npm start
```

-----

## 🧪 API Endpoints (cURL)

You can use the React UI or these cURL commands to interact with the CMS API.

### 1\. View All Nodes

```bash
curl http://localhost:8000/nodes
```

### 2\. Upload a File

(Replace `path/to/your/file.txt` with the actual path to a file.)

```bash
curl -F "file=@path/to/your/file.txt" http://localhost:8000/upload-to-all
```

### 3\. Manually Disconnect a Node

(Useful for testing the UI's real-time status changes.)

```bash
curl -X POST -H "Content-Type: application/json" \
-d '{"nodeId":"Node-A"}' \
http://localhost:8000/disconnect
```