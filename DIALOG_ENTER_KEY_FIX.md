# AI Dialog Enter Key Fix

## Issue

When the AI Dialog (NarratorDialog or PlanetExplorationDialog) was open and the user pressed Enter to send a chat message, the dialog would close unexpectedly instead of sending the message.

## Root Cause

The Enter key event was not being prevented from bubbling up to parent handlers. Additionally, global keyboard event handlers in `main.js` were processing keys even when input fields were focused.

## Solution

### 1. Added Event Prevention in Dialog Input Handlers

**NarratorDialog.js:**
```javascript
// Chat input - Enter key
this.elements.chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();        // Prevent default form submission
        e.stopPropagation();       // Stop event from bubbling
        this.handleChatSend();
    }
});
```

**PlanetExplorationDialog.js:**
```javascript
// Chat input - Enter key
if (this.elements.chatInput) {
    this.elements.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            console.log('⏎ Enter key pressed in chat');
            this.handleChatSend();
        }
    });
}
```

### 2. Added Input Field Detection in Main Controls

**main.js - setupControls():**
```javascript
window.addEventListener('keydown', (e) => {
    // Check if any input field is focused (user is typing)
    const activeElement = document.activeElement;
    const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
    );
    
    // If user is typing, don't process game controls
    if (isTyping) {
        return;
    }
    
    // ... rest of keyboard handling
});
```

### 3. Enhanced Dialog-Aware Key Blocking

**NarratorDialog.js:**
```javascript
// ESC key to close
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && this.isVisible) {
        this.hide();
    }
    
    // Prevent other keyboard shortcuts when dialog is open and user is typing
    if (this.isVisible && document.activeElement === this.elements.chatInput) {
        if (e.key !== 'Escape' && e.key !== 'Enter') {
            e.stopPropagation();
        }
    }
});
```

### 4. Added Exploration Dialog Check

**main.js:**
```javascript
// Check if any dialog is open
const narratorOpen = this.narratorDialog && this.narratorDialog.isShowing();
const explorationOpen = this.explorationDialog && this.explorationDialog.isVisible();

// If any dialog is open, only allow arrow keys for movement
if (narratorOpen || explorationOpen) {
    // ... handle appropriately
}
```

## Changes Made

### Files Modified:
1. ✅ `src/ui/NarratorDialog.js`
   - Added `e.preventDefault()` and `e.stopPropagation()` to Enter key handler
   - Added input field detection for key blocking

2. ✅ `src/ui/PlanetExplorationDialog.js`
   - Added `e.preventDefault()` and `e.stopPropagation()` to Enter key handler
   - Added input field detection for key blocking

3. ✅ `main.js`
   - Added global input field detection (INPUT, TEXTAREA, contentEditable)
   - Added exploration dialog check alongside narrator dialog
   - Updated keyup handler to check both dialogs

## Result

✅ **Enter key now works correctly in dialogs:**
- Pressing Enter sends the chat message
- Dialog stays open after sending message
- No interference from global keyboard handlers
- Game controls don't trigger when typing

✅ **Improved keyboard handling:**
- All input fields (INPUT, TEXTAREA, contentEditable) are detected
- Game shortcuts don't fire when user is typing
- Arrow keys still work for movement when dialog is open
- ESC key properly closes dialogs

## Testing

### Before Fix:
1. Open AI dialog (press N or click planet)
2. Type message in chat input
3. Press Enter
4. ❌ Dialog closes, message not sent

### After Fix:
1. Open AI dialog (press N or click planet)
2. Type message in chat input
3. Press Enter
4. ✅ Message sent, dialog stays open
5. ✅ No game controls trigger while typing

## Additional Improvements

- **Input detection**: Any focused input field blocks game controls
- **Dialog-aware**: Game checks if dialogs are open before processing keys
- **Event isolation**: Dialog events don't leak to global handlers
- **Better UX**: Users can type naturally without unexpected behavior

---

**Status**: ✅ FIXED - Enter key now works correctly in all dialogs
