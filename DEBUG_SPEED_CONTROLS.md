# 🔧 Speed Control Debug Guide

## What I Just Fixed (Round 2)

### Issue 1: Key Detection Too Restrictive ❌
```javascript
// BEFORE - Only checked e.code
if (e.code === 'Equal' || e.code === '+') // Wrong! e.code is never '+'

// AFTER - Check both e.code AND e.key ✅
if (e.code === 'Equal' || e.code === 'NumpadAdd' || e.key === '+' || e.key === '=')
```

### Issue 2: Missing Console Logging
Added extensive debug logging to track exactly what's happening.

### Issue 3: HUD Shows Wrong Speed
Changed HUD to show `forwardSpeed` instead of `velocity.length()`.

## How to Debug

### Step 1: Open Browser Console (F12)

You should see these logs when pressing keys:

```
🚀 Speed UP key pressed! Equal +
⚡ Speed UP: 52 units/sec
⚡ Speed UP: 55 units/sec
⚡ Speed UP: 58 units/sec
```

If you DON'T see the key pressed log, then keyboard detection is broken.

### Step 2: Check Debug HUD

Look at the top-left Flight HUD panel. You should now see:

```
Debug Keys
Keys: +false -false Shift:false Space:false
```

When you press `+`, it should change to:
```
Keys: +true -false Shift:false Space:false
```

### Step 3: Check Actual Speed

The HUD Velocity should change in real-time as you hold `+`:
```
Velocity
52.34 u/s   ← Should increase!
```

## Test Tools Created

### 1. debug_keys.html
**Purpose**: Test which key codes your keyboard generates

**How to use**:
```bash
# Open in browser
open debug_keys.html
```

Press any key and see:
- `e.key` value
- `e.code` value
- `e.keyCode` value
- Whether it matches our conditions

### 2. test_speed.html
**Purpose**: Isolated test of speed logic

**How to use**:
```bash
# Open in browser
open test_speed.html
```

Test the speed control logic without Three.js complexity.

## Keyboard Variations

Different keyboards may generate different codes:

| Key | Expected e.code | Expected e.key |
|-----|-----------------|----------------|
| + (US) | `Equal` | `+` or `=` |
| + (Mac) | `Equal` | `+` or `=` |
| - (US) | `Minus` | `-` or `_` |
| - (Mac) | `Minus` | `-` or `_` |
| Numpad + | `NumpadAdd` | `+` |
| Numpad - | `NumpadSubtract` | `-` |

**Our code now checks ALL of these!**

## What Should Happen

### Test 1: Basic Speed Up
1. Press and HOLD `+` (or `=` key)
2. Console should spam: `⚡ Speed UP: XX units/sec`
3. HUD should show increasing speed
4. Debug Keys should show `+true`

### Test 2: Speed Persistence
1. Hold `+` until speed is 200
2. Release `+`
3. Speed should **stay at 200** (not decay back to 50)
4. Console should stop showing speed messages
5. Debug Keys should show `+false`

### Test 3: Speed Down
1. Press and HOLD `-`
2. Console should spam: `🔻 Speed DOWN: XX units/sec`
3. Speed should decrease
4. Debug Keys should show `-true`

### Test 4: Boost
1. Press `Shift`
2. Speed should smoothly lerp toward 200
3. Debug Keys should show `Shift:true`

### Test 5: Brake
1. Press `Space`
2. Speed should smoothly lerp toward 0
3. Debug Keys should show `Space:true`

## If It Still Doesn't Work

### Check 1: Are keys being detected?
Open console and press `+`. Do you see:
```
🚀 Speed UP key pressed! Equal +
```

**If NO**: Your keyboard layout is different. Use `debug_keys.html` to find your actual key codes.

**If YES**: Keys are detected! Problem is elsewhere.

### Check 2: Is updateManualControl being called?
You should occasionally see (1% of frames):
```
🔍 Keys state: { speedUp: false, speedDown: false, boost: false, brake: false }
```

**If NO**: The spacecraft steer() method isn't running. Check if spacecraft is initialized.

**If YES**: Keys are reaching the spacecraft!

### Check 3: Is forwardSpeed changing?
When you press `+`, do you see:
```
⚡ Speed UP: 52 units/sec
⚡ Speed UP: 55 units/sec
```

**If NO**: The logic inside updateManualControl isn't executing. Check deltaTime is > 0.

**If YES**: Speed is changing! But maybe HUD isn't updating?

### Check 4: Is HUD updating?
Look at the top-left HUD panel. Does "Velocity" value change?

**If NO**: Check browser cache. Hard refresh (Cmd+Shift+R or Ctrl+Shift+F5).

**If YES**: It's working!!!

## Common Issues

### Issue: "I press + but nothing happens"

**Likely cause**: Browser cache. Hard refresh!

**Test**: Open debug_keys.html. Does it detect your key press?

### Issue: "Speed increases but then decays"

**Fixed**: We removed the auto-slow behavior. Hard refresh to clear cache.

### Issue: "Console says speedUp undefined"

**Fixed**: We added speedUp to keys object. Hard refresh!

### Issue: "Using different keyboard layout"

**Solution**: 
1. Open `debug_keys.html`
2. Press your `+` key
3. Note the `e.code` and `e.key` values
4. Add them to main.js line 89:
```javascript
if (e.code === 'YourCode' || e.key === 'YourKey' || e.code === 'Equal' || ...) {
```

## Files Modified (This Round)

### main.js
1. **Line 44-46**: Added speedUp, speedDown, boost, brake to keys object ✅
2. **Line 89-96**: Enhanced key detection with e.key fallback + console logging ✅
3. **Line 106-113**: Enhanced keyup detection ✅
4. **Line 493**: Changed HUD to show actualSpeed (forwardSpeed) ✅
5. **Line 494**: Changed cockpit to show actualSpeed ✅
6. **Line 515-518**: Added debug keys display ✅

### src/objects/Spacecraft.js
1. **Line 180-189**: Added debug logging of keys state ✅
2. **Line 195-196**: Removed auto-slow behavior ✅

### index.html
1. **Line 73-77**: Added debug-keys HUD element ✅

## Expected Console Output

When working correctly, you should see:

```
🔍 Keys state: { speedUp: false, speedDown: false, boost: false, brake: false }
🚀 Speed UP key pressed! Equal +
⚡ Speed UP: 52 units/sec
⚡ Speed UP: 54 units/sec
⚡ Speed UP: 57 units/sec
⚡ Speed UP: 60 units/sec
🚀 Speed UP key released!
🔍 Keys state: { speedUp: false, speedDown: false, boost: false, brake: false }
```

## Next Steps

1. **Hard refresh your browser** (Cmd+Shift+R or Ctrl+Shift+F5)
2. **Open console** (F12)
3. **Press `+` key**
4. **Report what you see** in console and HUD

If you see "🚀 Speed UP key pressed!" in console, the keys are working!
If you see "⚡ Speed UP: XX units/sec" repeatedly, the speed is increasing!
If HUD shows increasing velocity, everything works!

---

**Status**: Debugging tools and extensive logging added  
**Next**: User tests and reports results  
**Goal**: Identify exactly where the failure occurs
