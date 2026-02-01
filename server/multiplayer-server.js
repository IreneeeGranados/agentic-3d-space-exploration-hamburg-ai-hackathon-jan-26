/**
 * Multiplayer Server
 * WebSocket server for real-time space exploration multiplayer
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.MULTIPLAYER_PORT || 3000;

// Player state management
const players = new Map();
const rooms = new Map(); // Future: room-based multiplayer

// Game state
let gameState = {
    playerCount: 0,
    uptime: 0
};

io.on('connection', (socket) => {
    console.log(`🚀 Player connected: ${socket.id}`);
    
    // Initialize player data
    players.set(socket.id, {
        id: socket.id,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        speed: 0,
        viewMode: 'CHASE',
        connectedAt: Date.now(),
        nickname: `Explorer ${socket.id.slice(0, 4)}`
    });
    
    gameState.playerCount = players.size;
    
    // Send current players to new player
    socket.emit('init', {
        playerId: socket.id,
        players: Array.from(players.values()),
        gameState
    });
    
    // Notify others of new player
    socket.broadcast.emit('playerJoined', players.get(socket.id));
    
    // Handle position updates
    socket.on('updatePosition', (data) => {
        const player = players.get(socket.id);
        if (player) {
            player.position = data.position;
            player.rotation = data.rotation;
            player.quaternion = data.quaternion; // Store quaternion for accurate rotation
            player.speed = data.speed;
            player.viewMode = data.viewMode || 'CHASE';
            player.lastUpdate = Date.now();
            
            // Debug log occasionally
            if (Date.now() % 5000 < 100) {
                console.log(`📍 ${player.nickname} at (${data.position.x.toFixed(1)}, ${data.position.y.toFixed(1)}, ${data.position.z.toFixed(1)})`);
            }
            
            // Broadcast to other players
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                position: player.position,
                rotation: player.rotation,
                quaternion: player.quaternion,
                speed: player.speed,
                viewMode: player.viewMode,
                nickname: player.nickname
            });
        }
    });
    
    // Handle nickname changes
    socket.on('updateNickname', (nickname) => {
        const player = players.get(socket.id);
        if (player) {
            player.nickname = nickname;
            io.emit('playerUpdated', {
                id: socket.id,
                nickname: player.nickname
            });
        }
    });
    
    // Handle chat messages (future feature)
    socket.on('chatMessage', (message) => {
        const player = players.get(socket.id);
        if (player) {
            io.emit('chatMessage', {
                playerId: socket.id,
                nickname: player.nickname,
                message,
                timestamp: Date.now()
            });
        }
    });
    
    // Handle target sharing (when player clicks a planet)
    socket.on('shareTarget', (planetData) => {
        const player = players.get(socket.id);
        if (player) {
            socket.broadcast.emit('playerTargeted', {
                playerId: socket.id,
                nickname: player.nickname,
                planet: planetData
            });
        }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`👋 Player disconnected: ${socket.id}`);
        players.delete(socket.id);
        gameState.playerCount = players.size;
        socket.broadcast.emit('playerLeft', socket.id);
    });
});

// Server status endpoint
app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        players: gameState.playerCount,
        uptime: Math.floor(process.uptime())
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start server
httpServer.listen(PORT, () => {
    console.log(`✨ Multiplayer server running on port ${PORT}`);
    console.log(`🌐 Status: http://localhost:${PORT}/status`);
    console.log(`🎮 Ready for connections!`);
});

// Update uptime
setInterval(() => {
    gameState.uptime = Math.floor(process.uptime());
}, 1000);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down multiplayer server...');
    io.emit('serverShutdown', { message: 'Server is shutting down' });
    httpServer.close(() => {
        console.log('✓ Server closed');
        process.exit(0);
    });
});
