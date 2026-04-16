const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/remote', (req, res) => {
    res.sendFile(path.join(__dirname, 'remote.html'));
});

// ─── WebSocket StreamDeck Remote Control ─────────────────────────────────────
io.on('connection', (socket) => {
    let role = null;

    socket.on('join', (payload = {}) => {
        const requestedRole = payload.role;
        if (requestedRole !== 'tv' && requestedRole !== 'remote') {
            return;
        }

        role = requestedRole;
        socket.join(role);

        if (role === 'tv') {
            const tvCount = io.sockets.adapter.rooms.get('tv')?.size || 0;
            io.to('remote').emit('tv_count', tvCount);
            const remoteCount = io.sockets.adapter.rooms.get('remote')?.size || 0;
            socket.emit('remote_count', remoteCount);
        }

        if (role === 'remote') {
            const tvCount = io.sockets.adapter.rooms.get('tv')?.size || 0;
            socket.emit('tv_count', tvCount);
            io.to('tv').emit('request_state');
            const remoteCount = io.sockets.adapter.rooms.get('remote')?.size || 0;
            io.to('tv').emit('remote_count', remoteCount);
        }
    });

    socket.on('command', (cmd) => {
        if (role === 'remote') {
            io.to('tv').emit('command', cmd);
        }
    });

    socket.on('tv_state', (state) => {
        if (role === 'tv') {
            io.to('remote').emit('tv_state', state);
        }
    });

    // Alertes de santé envoyées par la TV vers le mobile
    socket.on('tv_alert', (alert) => {
        if (role === 'tv') {
            io.to('remote').emit('tv_alert', alert);
        }
    });

    // Acquittement d'alerte depuis le mobile vers la TV et les autres remotes
    socket.on('alert_ack', (payload) => {
        if (role === 'remote') {
            io.to('tv').emit('alert_ack', payload);
            io.to('remote').emit('alert_ack', payload);
        }
    });

    socket.on('disconnect', () => {
        if (role === 'tv') {
            setTimeout(() => {
                const tvCount = io.sockets.adapter.rooms.get('tv')?.size || 0;
                io.to('remote').emit('tv_count', tvCount);
            }, 150);
        }
        if (role === 'remote') {
            setTimeout(() => {
                const remoteCount = io.sockets.adapter.rooms.get('remote')?.size || 0;
                io.to('tv').emit('remote_count', remoteCount);
            }, 150);
        }
    });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
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
        'Database backup completed', 'Cache cleared successfully',
        'Health check passed', 'New deployment released', 'Service restarted'
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

// Start
httpServer.listen(PORT, () => {
    console.log(`🚀 Dashboard TV  →  http://localhost:${PORT}`);
    console.log(`📱 Télécommande  →  http://localhost:${PORT}/remote`);
});
