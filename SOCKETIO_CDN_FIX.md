# Socket.IO CDN Fix for GitHub Pages

## Problem
GitHub Pages couldn't resolve the ES module import for `socket.io-client`:
```
Uncaught TypeError: Failed to resolve module specifier "socket.io-client". 
Relative references must start with either "/", "./", or "../".
```

## Solution
Added Socket.IO CDN script to `index.html` and updated `MultiplayerManager.js` to use the global `window.io` object.

## Changes Made

### 1. index.html
Added CDN script in the `<head>` section:
```html
<!-- Socket.IO Client CDN for GitHub Pages -->
<script src="https://cdn.socket.io/4.8.1/socket.io.min.js" crossorigin="anonymous"></script>
```

### 2. src/multiplayer/MultiplayerManager.js
Updated `loadSocketIO()` method to check for CDN-loaded global first:
```javascript
static async loadSocketIO() {
    if (io) return io;
    
    // Try global window.io first (CDN)
    if (window.io) {
        io = window.io;
        console.log('✅ Socket.io-client loaded from CDN');
        return io;
    }
    
    // Fallback to dynamic import (development)
    try {
        const socketModule = await import('socket.io-client');
        io = socketModule.io;
        console.log('✅ Socket.io-client loaded via import');
        return io;
    } catch (error) {
        console.warn('⚠️ Socket.io-client not available. Multiplayer disabled.');
        return null;
    }
}
```

## How It Works

**Development (npm run dev):**
- Vite resolves `socket.io-client` from `node_modules`
- Dynamic import works normally
- CDN is ignored (fallback only)

**Production (GitHub Pages):**
- Socket.IO loads from CDN via `<script>` tag
- Available as `window.io` global
- Multiplayer manager detects and uses the global

## Testing

After deployment to GitHub Pages:
1. Open browser console
2. Type: `window.io`
3. Should show the Socket.IO function
4. Multiplayer should now connect without errors

## Server Configuration

Make sure the multiplayer server binds to all interfaces for network access:
```javascript
httpServer.listen(PORT, '0.0.0.0', () => {
    // Server now accessible on local network
});
```

## Network Connection

For local network testing:
1. Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Update multiplayer URL in app: `http://YOUR_IP:3000`
3. Both frontend and backend must be accessible on the network
