/**
 * MultiplayerManager Class
 * Handles real-time multiplayer synchronization
 */

import { io } from 'socket.io-client';
import { RemotePlayer } from './RemotePlayer.js';

export class MultiplayerManager {
    constructor(sceneManager, localSpacecraft) {
        this.scene = sceneManager.scene;
        this.localSpacecraft = localSpacecraft;
        this.remotePlayers = new Map();
        this.socket = null;
        this.connected = false;
        this.playerId = null;
        this.lastUpdateTime = 0;
        this.updateInterval = 50; // Send updates every 50ms (20 ticks/sec)
        
        // Server detection
        this.serverAvailable = false;
    }
    
    /**
     * Check if multiplayer server is available
     */
    static async checkServerAvailability(serverUrl = 'http://localhost:3000') {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const response = await fetch(`${serverUrl}/health`, { 
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            console.log('Multiplayer server not available');
            return false;
        }
    }
    
    /**
     * Connect to multiplayer server
     */
    async connect(serverUrl = 'http://localhost:3000') {
        return new Promise((resolve, reject) => {
            console.log('🔌 Connecting to multiplayer server...');
            
            this.socket = io(serverUrl, {
                transports: ['websocket', 'polling'],
                timeout: 5000,
                reconnection: true,
                reconnectionAttempts: 3
            });
            
            // Connection successful
            this.socket.on('connect', () => {
                console.log('✓ Connected to multiplayer server');
                this.connected = true;
                this.serverAvailable = true;
            });
            
            // Initialize with server data
            this.socket.on('init', (data) => {
                console.log('📡 Received initialization data:', data);
                this.playerId = data.playerId;
                
                // Add existing players
                data.players.forEach(player => {
                    if (player.id !== this.playerId) {
                        this.addRemotePlayer(player);
                    }
                });
                
                resolve(data);
            });
            
            // Player joined
            this.socket.on('playerJoined', (player) => {
                console.log(`🚀 Player joined: ${player.nickname}`);
                this.addRemotePlayer(player);
                this.showNotification(`${player.nickname} joined`, 'info');
            });
            
            // Player moved
            this.socket.on('playerMoved', (data) => {
                this.updateRemotePlayer(data);
            });
            
            // Player updated (nickname, etc)
            this.socket.on('playerUpdated', (data) => {
                const player = this.remotePlayers.get(data.id);
                if (player && data.nickname) {
                    player.updateNickname(data.nickname);
                }
            });
            
            // Player left
            this.socket.on('playerLeft', (playerId) => {
                this.removeRemotePlayer(playerId);
                this.showNotification('A player left', 'warning');
            });
            
            // Chat message (future feature)
            this.socket.on('chatMessage', (data) => {
                console.log(`💬 ${data.nickname}: ${data.message}`);
            });
            
            // Server shutdown
            this.socket.on('serverShutdown', (data) => {
                console.warn('⚠️ Server is shutting down:', data.message);
                this.showNotification('Server shutting down', 'error');
                this.disconnect();
            });
            
            // Connection error
            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                this.serverAvailable = false;
                reject(error);
            });
            
            // Disconnected
            this.socket.on('disconnect', (reason) => {
                console.log('Disconnected:', reason);
                this.connected = false;
                
                // Clean up all remote players
                this.remotePlayers.forEach((player, id) => {
                    this.removeRemotePlayer(id);
                });
                
                if (reason === 'io server disconnect') {
                    // Server kicked us, don't reconnect
                    this.showNotification('Disconnected from server', 'error');
                } else {
                    this.showNotification('Connection lost, reconnecting...', 'warning');
                }
            });
        });
    }
    
    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.socket) {
            console.log('👋 Disconnecting from multiplayer...');
            this.socket.disconnect();
            this.connected = false;
            
            // Remove all remote players
            this.remotePlayers.forEach((player, id) => {
                this.removeRemotePlayer(id);
            });
        }
    }
    
    /**
     * Add a remote player to the scene
     */
    addRemotePlayer(playerData) {
        if (this.remotePlayers.has(playerData.id)) {
            return; // Already exists
        }
        
        const remotePlayer = new RemotePlayer(playerData.id, playerData);
        this.scene.add(remotePlayer.group);
        this.remotePlayers.set(playerData.id, remotePlayer);
        console.log(`✓ Added remote player: ${remotePlayer.nickname}`);
    }
    
    /**
     * Update remote player state
     */
    updateRemotePlayer(data) {
        const player = this.remotePlayers.get(data.id);
        if (player) {
            player.updateFromNetwork(data);
        }
    }
    
    /**
     * Remove remote player from scene
     */
    removeRemotePlayer(playerId) {
        const player = this.remotePlayers.get(playerId);
        if (player) {
            console.log(`👋 Removing player: ${player.nickname}`);
            this.scene.remove(player.group);
            player.dispose();
            this.remotePlayers.delete(playerId);
        }
    }
    
    /**
     * Send local player update to server (throttled)
     */
    sendUpdate() {
        if (!this.connected || !this.socket) return;
        
        const now = Date.now();
        if (now - this.lastUpdateTime < this.updateInterval) {
            return; // Throttle updates
        }
        
        this.lastUpdateTime = now;
        
        // Get current spacecraft position and rotation
        const position = this.localSpacecraft.group.position;
        const quaternion = this.localSpacecraft.group.quaternion;
        
        const updateData = {
            position: {
                x: position.x,
                y: position.y,
                z: position.z
            },
            rotation: {
                x: this.localSpacecraft.group.rotation.x,
                y: this.localSpacecraft.group.rotation.y,
                z: this.localSpacecraft.group.rotation.z
            },
            quaternion: {
                x: quaternion.x,
                y: quaternion.y,
                z: quaternion.z,
                w: quaternion.w
            },
            speed: this.localSpacecraft.forwardSpeed,
            viewMode: this.localSpacecraft.viewMode
        };
        
        // Debug log every 2 seconds
        if (now % 2000 < this.updateInterval) {
            console.log('📡 Sending position:', {
                pos: `(${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`,
                speed: this.localSpacecraft.forwardSpeed.toFixed(1)
            });
        }
        
        // Send to server
        this.socket.emit('updatePosition', updateData);
    }
    
    /**
     * Update all remote players (interpolation)
     */
    update(deltaTime) {
        this.remotePlayers.forEach(player => {
            player.update(deltaTime);
        });
    }
    
    /**
     * Share target planet with other players
     */
    shareTarget(planetData) {
        if (this.connected && this.socket) {
            this.socket.emit('shareTarget', planetData);
        }
    }
    
    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `multiplayer-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: ${type === 'error' ? '#ff4444' : type === 'warning' ? '#ffaa00' : '#00ff88'};
            padding: 12px 20px;
            border-radius: 8px;
            border: 2px solid ${type === 'error' ? '#ff4444' : type === 'warning' ? '#ffaa00' : '#00ff88'};
            font-family: 'Orbitron', monospace;
            font-size: 14px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    /**
     * Get player count
     */
    getPlayerCount() {
        return this.remotePlayers.size + (this.connected ? 1 : 0);
    }
    
    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.connected,
            playerId: this.playerId,
            playerCount: this.getPlayerCount(),
            remotePlayers: this.remotePlayers.size
        };
    }
}
