# Multiplayer Server Configuration

## 🔧 Configurable Backend URL

The multiplayer system now supports **custom backend server URLs**, making it easy to connect to different servers (localhost, remote servers, different ports, etc.).

---

## 🎯 Features

✅ **Configurable URL** - Change server URL without code modifications  
✅ **Persistent Storage** - URL saved in localStorage (survives browser refresh)  
✅ **Default Value** - Defaults to `http://localhost:3000`  
✅ **Auto-Detection** - Automatically checks if server is available at the configured URL  
✅ **Visual Feedback** - Shows server status (READY / OFFLINE / CONNECTED)

---

## 📍 Location

The multiplayer configuration is in the **Controls Panel** (bottom-left corner):

```
╔════════════════════════════════════╗
║  SPACECRAFT COMMAND                ║
║                                    ║
║  Multiplayer                       ║
║  ┌──────────────────────────────┐  ║
║  │ Server URL                   │  ║
║  │ [http://localhost:3000]      │  ← Change URL here
║  └──────────────────────────────┘  ║
║  ┌──────────────────────────────┐  ║
║  │ 🌐 Join Multiplayer         │  ← Click to connect
║  └──────────────────────────────┘  ║
║  READY                            ║
╚════════════════════════════════════╝
```

---

## 🚀 How to Use

### 1. **Default Setup (Localhost)**

By default, the system connects to `http://localhost:3000`:

```bash
# Start the multiplayer server
npm run multiplayer-server

# Server runs on: http://localhost:3000
```

Just click **"Join Multiplayer"** and you're connected! ✅

---

### 2. **Custom Port**

To use a different port:

**Step 1**: Start server on custom port
```bash
MULTIPLAYER_PORT=3001 npm run multiplayer-server
```

**Step 2**: Update URL in the controls panel
```
Server URL: http://localhost:3001
```

**Step 3**: Click **"Join Multiplayer"**

---

### 3. **Remote Server**

To connect to a remote multiplayer server:

**Step 1**: Server running on remote machine
```bash
# On remote server (IP: 192.168.1.100)
npm run multiplayer-server
```

**Step 2**: Update URL in controls panel
```
Server URL: http://192.168.1.100:3000
```

**Step 3**: Click **"Join Multiplayer"**

---

### 4. **Production Server**

For production deployments with domain names:

```
Server URL: https://multiplayer.yourspace.com
```

**Note**: Make sure the server has CORS enabled for your domain.

---

## 💾 Persistent Storage

The server URL is automatically saved to **localStorage** when you change it:

```javascript
// Stored as:
localStorage.setItem('multiplayerServerUrl', 'http://localhost:3000');

// Retrieved on page load:
const url = localStorage.getItem('multiplayerServerUrl');
```

**Benefits**:
- ✅ Survives browser refresh
- ✅ Survives browser restart
- ✅ No need to re-enter URL every time
- ✅ Different URLs per browser/device

---

## 🔍 Server Detection

The system automatically checks if the server is available:

### Visual Indicators

| Status | Color | Meaning |
|--------|-------|---------|
| **READY** | 🟢 Green | Server is online and ready |
| **SERVER OFFLINE** | ⚪ Gray | Server not reachable |
| **CONNECTED (X players)** | 🟢 Green | You're connected! |

### How it Works

1. **On Page Load**: System checks if server is available at configured URL
2. **On URL Change**: Automatically re-checks server availability
3. **Every Connection**: Validates server before connecting

```javascript
// Health check endpoint
GET http://localhost:3000/health
→ Response: {"status":"ok"}
```

---

## 🎮 Usage Examples

### Example 1: Development (Default)
```
Server URL: http://localhost:3000
Status: READY ✅
Click: Join Multiplayer
```

### Example 2: Different Port
```
Server URL: http://localhost:8080
Status: READY ✅
Click: Join Multiplayer
```

### Example 3: LAN/Network Play
```
Server URL: http://192.168.1.50:3000
Status: READY ✅
Click: Join Multiplayer
```

### Example 4: Cloud Server
```
Server URL: https://game-server.mydomain.com
Status: READY ✅
Click: Join Multiplayer
```

---

## 🔧 Configuration via Code

You can also set the default URL programmatically:

```javascript
// Set via localStorage (before page load)
localStorage.setItem('multiplayerServerUrl', 'http://192.168.1.100:3000');

// Or modify the default in main.js:
this.multiplayerServerUrl = localStorage.getItem('multiplayerServerUrl') || 'http://your-default:3000';
```

---

## 🛠️ Server CORS Configuration

For remote servers, ensure CORS is properly configured:

**File**: `server/multiplayer-server.js`

```javascript
const io = new Server(httpServer, {
    cors: {
        origin: "*",  // Development: Allow all
        // Production: Restrict to your domain
        // origin: "https://yourapp.com",
        methods: ["GET", "POST"]
    }
});
```

**Production Recommendation**:
```javascript
cors: {
    origin: [
        "https://yourapp.com",
        "https://www.yourapp.com"
    ],
    methods: ["GET", "POST"]
}
```

---

## 📊 Technical Details

### URL Validation
- Automatically adds `http://` if missing
- Trims whitespace
- Falls back to default if empty

### Event Flow
```
User changes URL
    ↓
onChange/onBlur event
    ↓
Save to localStorage
    ↓
Update app.multiplayerServerUrl
    ↓
Re-check server availability
    ↓
Update UI status (READY/OFFLINE)
```

### Connection Flow
```
User clicks "Join Multiplayer"
    ↓
Read from app.multiplayerServerUrl
    ↓
MultiplayerManager.connect(url)
    ↓
Socket.io connection attempt
    ↓
Success: Status = CONNECTED
Failure: Alert with error message
```

---

## 🧪 Testing Different Servers

### Test Scenario 1: Multiple Local Servers
```bash
# Terminal 1
MULTIPLAYER_PORT=3000 npm run multiplayer-server

# Terminal 2  
MULTIPLAYER_PORT=3001 npm run multiplayer-server

# Browser: Switch between them
Server URL: http://localhost:3000  → Connect
Server URL: http://localhost:3001  → Connect
```

### Test Scenario 2: LAN Server
```bash
# Server machine (IP: 192.168.1.100)
npm run multiplayer-server

# Client machine
Server URL: http://192.168.1.100:3000
```

---

## 🚨 Troubleshooting

### Server Offline but Running?

1. **Check URL syntax**
   ```
   ✅ http://localhost:3000
   ❌ localhost:3000 (missing http://)
   ❌ http://localhost:3000/ (trailing slash may cause issues)
   ```

2. **Check firewall** (for remote servers)
   ```bash
   # Allow port 3000
   sudo ufw allow 3000/tcp
   ```

3. **Check CORS** (browser console)
   ```
   Error: CORS policy blocked
   → Update server CORS settings
   ```

### Can't Connect?

1. **Verify server is running**
   ```bash
   curl http://localhost:3000/health
   → {"status":"ok"}
   ```

2. **Check console logs**
   - Browser: F12 → Console
   - Look for connection errors

3. **Try default URL**
   ```
   Reset to: http://localhost:3000
   ```

---

## 📝 Files Modified

1. ✅ `index.html` - Added URL input field
2. ✅ `main.js` - Added URL configuration logic
3. ✅ `ui-style.css` - Added input field styling

---

## 🎉 Summary

You now have **full control** over the multiplayer backend URL:

- ✅ Change server URL without code changes
- ✅ Connect to localhost, LAN, or cloud servers
- ✅ Persistent storage (survives page refresh)
- ✅ Visual server status indicators
- ✅ Automatic server detection

**Just update the URL in the Controls Panel and click "Join Multiplayer"!** 🚀
