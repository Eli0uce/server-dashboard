const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API Routes for real-time data
app.get('/api/servers', (req, res) => {
    res.json({
        status: 'success',
        servers: [
            { id: 1, name: 'WEB-01', cpu: Math.random() * 100, memory: Math.random() * 100, status: 'online' },
            { id: 2, name: 'WEB-02', cpu: Math.random() * 100, memory: Math.random() * 100, status: 'online' },
            { id: 3, name: 'API-01', cpu: Math.random() * 100, memory: Math.random() * 100, status: 'online' },
            { id: 4, name: 'DB-MASTER', cpu: Math.random() * 100, memory: Math.random() * 100, status: 'online' }
        ]
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'success',
        health: {
            cpu: Math.floor(Math.random() * 100),
            memory: Math.floor(Math.random() * 100),
            disk: Math.floor(Math.random() * 100),
            network: Math.floor(Math.random() * 10000)
        }
    });
});

app.get('/api/logs', (req, res) => {
    const logMessages = [
        'Database backup completed',
        'Cache cleared successfully',
        'Health check passed',
        'New deployment released',
        'Service restarted'
    ];

    res.json({
        status: 'success',
        logs: logMessages.map((msg, i) => ({
            timestamp: new Date(Date.now() - i * 60000).toISOString(),
            level: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)],
            message: msg
        }))
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server Monitoring Dashboard running at http://localhost:${PORT}`);
    console.log(`📺 Open your browser and go to: http://localhost:${PORT}`);
});

