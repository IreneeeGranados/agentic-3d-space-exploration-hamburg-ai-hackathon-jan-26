# Multiplayer Mode

Real-time multiplayer for 3D Space Exploration using WebSocket technology.

## 🚀 Quick Start

### 1. Start the Multiplayer Server

In a **new terminal**, run:

```bash
npm run multiplayer-server
```

You should see:
```
✨ Multiplayer server running on port 3000
🌐 Status: http://localhost:3000/status
🎮 Ready for connections!
```

### 2. Start the Application

In your main terminal:

```bash
npm run dev
```

### 3. Join Multiplayer

1. Open the application in your browser: `http://localhost:5173`
2. Look for the **🌐 Join Multiplayer** button in the bottom right
3. Click it to connect
4. Open another browser window/tab to see multiple players

> **Note**: If the multiplayer server is not running, the multiplayer button will be automatically hidden.

## 🎮 Features

### Current Features
- ✅ Real-time position synchronization
- ✅ Multiple players in the same universe
- ✅ Player name tags with trails
- ✅ Smooth interpolation for network lag
- ✅ Auto-reconnection on disconnect
- ✅ Server status notifications
- ✅ Graceful degradation (hides UI if server unavailable)

### Visual Indicators
- **Your spacecraft**: Normal appearance
- **Other players**: Semi-transparent with green glow
- **Name tags**: Floating above each player's ship
- **Trails**: Visual effect showing player movement

## 🔧 Technical Details

### Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Browser 1     │◄───────►│  Server (3000)  │◄───────►│   Browser 2     │
│  (Your Ship)    │  WebSocket│   Node.js      │  WebSocket│ (Remote Ship)  │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### Network Protocol

**Update Rate**: 20 updates/second (50ms interval)

**Data Synchronized**:
- Position (x, y, z)
- Rotation (x, y, z)
- Speed
- View mode (CHASE/COCKPIT)

### Components

#### Server Side
- `server/multiplayer-server.js` - WebSocket server
- Manages player sessions
- Broadcasts state updates
- Health check endpoints

#### Client Side
- `src/multiplayer/MultiplayerManager.js` - Network coordinator
- `src/multiplayer/RemotePlayer.js` - Remote player renderer
- Server detection and auto-hide UI

## 📡 Server Endpoints

### Health Check
```
GET http://localhost:3000/health
Response: { "status": "ok" }
```

### Server Status
```
GET http://localhost:3000/status
Response: { 
  "status": "online",
  "players": 3,
  "uptime": 1234
}
```

## 🐛 Troubleshooting

### Multiplayer button not showing?
- Make sure the server is running: `npm run multiplayer-server`
- Check server is on port 3000: `http://localhost:3000/health`
- Look for "Multiplayer server detected" in browser console

### Connection issues?
- Verify server is running (see terminal output)
- Check firewall isn't blocking port 3000
- Try refreshing the page
- Check browser console for errors

### Players not syncing?
- Both clients must be connected to the same server
- Check network tab in DevTools for WebSocket connection
- Verify no proxy/VPN blocking WebSocket protocol

## 🎯 Future Enhancements

Potential features for expansion:
- 🗨️ Chat system
- 🎯 Shared planet targeting
- 👥 Player groups/parties
- 🏆 Exploration achievements
- 🌐 Public server hosting
- 🔐 Player authentication
- 🎨 Custom ship colors
- 📍 Waypoint markers
- 🎤 Voice chat integration

## 🔒 Security Notes

⚠️ **This is a development/hackathon implementation**

For production use, consider:
- Add authentication (JWT tokens)
- Implement rate limiting
- Add input validation
- Use HTTPS/WSS
- Add anti-cheat measures
- Implement player permissions
- Add data encryption

## 📊 Performance

**Recommended**:
- Max 10 concurrent players per server
- Low latency network (<100ms ping)
- Stable internet connection

**Network Usage**:
- ~1-2 KB/s per player
- Scales linearly with player count

## 🛠️ Development

### Running Server in Development

```bash
# Default port (3000)
npm run multiplayer-server

# Custom port
MULTIPLAYER_PORT=4000 node server/multiplayer-server.js
```

### Testing Locally

1. Start server
2. Open app in multiple browser windows
3. Each window is a different player
4. Move around to see synchronization

### Server Logs

The server logs all connections:
```
🚀 Player connected: abc123
👋 Player disconnected: abc123
```

## 📝 Configuration

### Client Configuration

In `main.js`, the server URL is hardcoded:
```javascript
await this.multiplayerManager.connect('http://localhost:3000');
```

For production, use environment variables:
```javascript
const SERVER_URL = import.meta.env.VITE_MULTIPLAYER_SERVER || 'http://localhost:3000';
```

### Server Configuration

Port can be set via environment:
```bash
export MULTIPLAYER_PORT=4000
npm run multiplayer-server
```

## 🎓 How It Works

1. **Server Detection**: Client checks `/health` endpoint on load
2. **UI Toggle**: If server available, show multiplayer button
3. **Connection**: Click button → WebSocket connection established
4. **Sync Loop**: Every 50ms, client sends position to server
5. **Broadcast**: Server broadcasts to all other clients
6. **Interpolation**: Clients smooth out network lag with lerp
7. **Rendering**: Remote players rendered as semi-transparent ships

## 🤝 Contributing

To add multiplayer features:

1. **Server**: Edit `server/multiplayer-server.js`
2. **Client**: Edit `src/multiplayer/MultiplayerManager.js`
3. **Remote Players**: Edit `src/multiplayer/RemotePlayer.js`

Event structure:
```javascript
socket.emit('eventName', data);
socket.on('eventName', (data) => { ... });
```

---

**Built for**: Hamburg AI Hackathon 2026  
**Tech Stack**: Socket.io, Three.js, Node.js  
**License**: MIT
