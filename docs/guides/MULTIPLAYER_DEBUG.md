# Multiplayer Debugging Guide

## Step-by-Step Troubleshooting

### Step 1: Verify Servers Are Running

Open two terminal windows:

**Terminal 1 - Multiplayer Server:**
```bash
npm run multiplayer-server
```

You should see:
```
✨ Multiplayer server running on port 3000
🌐 Status: http://localhost:3000/status
🎮 Ready for connections!
```

**Terminal 2 - Application:**
```bash
npm run dev
```

You should see:
```
VITE v6.4.1  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Step 2: Test Server Manually

Open a new terminal and run:
```bash
curl http://localhost:3000/health
```

Expected output:
```json
{"status":"ok"}
```

If this fails, the multiplayer server isn't running properly.

### Step 3: Open Browser Developer Tools

1. Open the application in your browser (usually `http://localhost:5173` or `http://localhost:5174`)
2. Press `F12` or `Cmd+Option+I` (Mac) to open Developer Tools
3. Click on the "Console" tab

### Step 4: Check for Errors in Console

Look for these messages in the console:

**✅ Expected good messages:**
```
🔍 Checking multiplayer server...
✓ Multiplayer server detected
✅ Multiplayer button initialized
```

**❌ Possible error messages:**

1. **"Multiplayer server not available"**
   - Solution: Make sure multiplayer server is running on port 3000
   - Test: `curl http://localhost:3000/health`

2. **"Failed to fetch"** or **"CORS error"**
   - Solution: Server CORS configuration issue
   - Check: Server should show CORS origin: "*"

3. **"multiplayer-btn not found"**
   - Solution: HTML button missing
   - Check: View page source, search for "multiplayer-btn"

4. **"Cannot read property 'style' of null"**
   - Solution: Button element timing issue
   - Check: Button should exist in HTML

5. **Import errors (Failed to load module)**
   - Solution: File path or syntax error
   - Check: Files exist in src/multiplayer/

### Step 5: Manual Button Check

Open the browser console and run:
```javascript
// Check if button exists
const btn = document.getElementById('multiplayer-btn');
console.log('Button:', btn);
console.log('Button display:', btn ? btn.style.display : 'not found');
```

Expected output:
- If server is running: `Button display: "block"`
- If server is off: `Button display: "none"`
- If broken: `Button: null`

### Step 6: Manual Connection Test

If button exists but doesn't work, test connection manually:
```javascript
// Test server availability
fetch('http://localhost:3000/health')
  .then(r => r.json())
  .then(d => console.log('✅ Server:', d))
  .catch(e => console.error('❌ Error:', e));
```

### Step 7: Check Network Tab

1. In Developer Tools, click "Network" tab
2. Reload the page
3. Look for request to `http://localhost:3000/health`
4. Check the status:
   - ✅ 200 OK = Server working
   - ❌ Failed = Server not accessible
   - ❌ CORS error = Server configuration issue

### Step 8: Test Multiplayer Manager Import

In console:
```javascript
import('/src/multiplayer/MultiplayerManager.js')
  .then(module => console.log('✅ Module loaded:', module))
  .catch(error => console.error('❌ Import failed:', error));
```

### Common Issues and Solutions

#### Issue 1: Button Not Showing

**Symptoms:** No multiplayer button visible

**Diagnosis:**
```javascript
document.getElementById('multiplayer-btn')
```

**Solutions:**
1. Server not running → Start with `npm run multiplayer-server`
2. Button hidden → Check CSS: `display: none` is initial state
3. Check failed → Server took too long to respond

#### Issue 2: Button Shows But Connection Fails

**Symptoms:** Button visible, but clicking shows error

**Diagnosis:** Check console for error message

**Solutions:**
1. Socket.io not loaded → Check if `socket.io-client` is in node_modules
2. CORS error → Check server CORS configuration
3. Port mismatch → Verify server on port 3000

#### Issue 3: Players Not Seeing Each Other

**Symptoms:** Connected but no remote players

**Diagnosis:**
```javascript
// In console
window.app.multiplayerManager.getStatus()
```

**Solutions:**
1. Check both clients connected to same server
2. Check server logs for "Player connected" messages
3. Verify no firewall blocking

### Quick Test Page

Open this file in browser: `test-multiplayer.html`

This will run automated tests and show results.

### Manual Test Script

Copy/paste into browser console:
```javascript
(async function testMultiplayer() {
  console.log('🧪 Running multiplayer tests...\n');
  
  // Test 1: Button exists
  const btn = document.getElementById('multiplayer-btn');
  console.log('Test 1 - Button exists:', btn ? '✅ PASS' : '❌ FAIL');
  
  // Test 2: Server responding
  try {
    const res = await fetch('http://localhost:3000/health');
    const data = await res.json();
    console.log('Test 2 - Server health:', data.status === 'ok' ? '✅ PASS' : '❌ FAIL');
  } catch (e) {
    console.log('Test 2 - Server health: ❌ FAIL -', e.message);
  }
  
  // Test 3: App instance exists
  console.log('Test 3 - App instance:', window.app ? '✅ PASS' : '❌ FAIL');
  
  // Test 4: Toggle function exists
  console.log('Test 4 - Toggle function:', typeof window.app?.toggleMultiplayer === 'function' ? '✅ PASS' : '❌ FAIL');
  
  // Test 5: Module can be imported
  try {
    const module = await import('/src/multiplayer/MultiplayerManager.js');
    console.log('Test 5 - Module import:', module.MultiplayerManager ? '✅ PASS' : '❌ FAIL');
  } catch (e) {
    console.log('Test 5 - Module import: ❌ FAIL -', e.message);
  }
  
  console.log('\n🧪 Tests complete!');
})();
```

### Getting More Help

If still not working, please provide:

1. **Console output** (copy all red error messages)
2. **Network tab** (screenshot of failed requests)
3. **Browser** (Chrome, Firefox, Safari?)
4. **OS** (Windows, Mac, Linux?)
5. **What exactly happens** when you click the button or what you see/don't see

### Force Show Button (Emergency)

If you just want to see the button regardless of server:
```javascript
// In console
document.getElementById('multiplayer-btn').style.display = 'block';
```

Then click it and watch console for errors.

---

## Quick Checklist

- [ ] Multiplayer server running on port 3000
- [ ] Application running on port 5173/5174
- [ ] No errors in terminal output
- [ ] Browser console shows "Multiplayer server detected"
- [ ] Button visible in bottom-right corner
- [ ] No CORS errors in network tab
- [ ] Files exist: server/multiplayer-server.js, src/multiplayer/*.js

If all checked, it should work! If not, run the manual test script above.
