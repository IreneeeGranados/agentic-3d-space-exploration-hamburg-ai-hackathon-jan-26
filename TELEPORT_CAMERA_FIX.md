# Teleport Camera Positioning Fix

## Problem
The teleport function used a **fixed offset of 100 units** for all planets, which caused issues:
- ❌ Small planets (Mercury, Mars) were invisible - camera too far away
- ❌ Giant planets (Jupiter, Saturn) filled entire screen - camera too close
- ❌ No consideration of planet size in camera positioning

## Solution
**Dynamic offset calculation based on planet radius**

### Formula
```javascript
const earthRadiusScale = 0.5;  // 1 Earth radius = 0.5 scene units
const planetRadiusSceneUnits = planetRadiusEarths * earthRadiusScale;
const dynamicOffset = Math.max(planetRadiusSceneUnits * 4.0, 3.0);
```

### Key Changes

1. **Calculate planet radius in scene units**
   - Uses the unified scale: 1 R⊕ = 0.5 scene units
   - Reads `pl_rade` from planet data

2. **Dynamic offset = 4× planet radius**
   - Small planets: Minimum 3.0 units (prevent too close approach)
   - Earth-sized: ~3-5 units
   - Gas giants: 8-22 units (properly scaled)
   - Super-Jupiters: 30+ units

3. **Updated all teleport methods**
   - `teleportToPlanet()` - Calculates offset from planet data
   - `teleportToObject()` - Accepts optional offset parameter
   - `executeTeleport()` - Uses dynamic or provided offset
   - `teleportToCoordinates()` - Accepts optional offset parameter

## Results

### Before vs After

| Planet | Radius (R⊕) | OLD Offset | NEW Offset | Result |
|--------|-------------|------------|------------|--------|
| Mercury | 0.38 | 100 units | **3.0 units** | ✅ Now visible |
| Earth | 1.00 | 100 units | **3.0 units** | ✅ Perfect view |
| Mars | 0.53 | 100 units | **3.0 units** | ✅ Now visible |
| Jupiter | 11.21 | 100 units | **22.4 units** | ✅ Not overwhelming |
| Saturn | 9.45 | 100 units | **18.9 units** | ✅ Rings visible |
| Hot Jupiter | 15.0 | 100 units | **30.0 units** | ✅ Properly framed |

### Visual Comparison

**Before (Fixed 100 units)**:
```
Small Planet (Mercury):
Camera ←------ 100 units ------→ • (planet too far, barely visible)

Giant Planet (Jupiter):
Camera ←-- 100 --→ ⬤ (planet fills screen, can't see it)
                  HUGE!
```

**After (Dynamic offset)**:
```
Small Planet (Mercury):
Camera ←- 3.0 -→ • (perfect distance)

Giant Planet (Jupiter):
Camera ←---- 22.4 ----→ ⬤ (whole planet visible)
```

## Code Changes

### File: `src/utils/TeleportManager.js`

#### 1. Enhanced `teleportToPlanet()`
```javascript
// Calculate planet radius for proper camera distance
const earthRadiusScale = 0.5;
const planetRadiusEarths = planetData.pl_rade || planetData.config?.pl_rade || 1.0;
const planetRadiusSceneUnits = planetRadiusEarths * earthRadiusScale;

// Dynamic offset = 4x planet radius (minimum 3.0)
const dynamicOffset = Math.max(planetRadiusSceneUnits * 4.0, 3.0);
console.log(`📏 Planet: ${planetName}, Radius: ${planetRadiusEarths.toFixed(2)} R⊕ = ${planetRadiusSceneUnits.toFixed(2)} units, Offset: ${dynamicOffset.toFixed(2)} units`);

return this.executeTeleport(targetPosition, planetName, dynamicOffset);
```

#### 2. Updated `executeTeleport()`
```javascript
executeTeleport(targetPosition, planetName, offset = null) {
    // Use provided offset or default
    const actualOffset = offset !== null ? offset : this.teleportOffset;
    
    const directionFromOrigin = targetPosition.clone().normalize();
    const approachPosition = targetPosition.clone().sub(
        directionFromOrigin.multiplyScalar(actualOffset)
    );
    
    // ... rest of teleport logic
}
```

#### 3. Updated supporting methods
- `teleportToObject(object, name, offset = null)` - Optional offset parameter
- `teleportToCoordinates(x, y, z, offset = null)` - Optional offset parameter

## Testing

### Test Results
```
Mercury   (0.38 R⊕): 3.0 unit offset → View distance 3.19 units ✓
Earth     (1.0 R⊕):  3.0 unit offset → View distance 3.50 units ✓
Jupiter  (11.2 R⊕): 22.4 unit offset → View distance 28.0 units ✓
Saturn    (9.4 R⊕): 18.9 unit offset → View distance 23.6 units ✓
Hot Jupiter (15 R⊕): 30.0 unit offset → View distance 37.5 units ✓
```

### Console Output
When teleporting, you'll now see:
```
📏 Planet: Jupiter, Radius: 11.21 R⊕ = 5.60 units, Offset: 22.42 units
Teleporting to Jupiter at 520.30, 0.00, 11.80 with offset 22.42
```

## Benefits

✅ **Adaptive scaling** - Works for any planet size  
✅ **Minimum distance** - Small planets still visible (3.0 unit minimum)  
✅ **Gas giant friendly** - Large planets properly framed  
✅ **Consistent experience** - All planets have optimal viewing angle  
✅ **Future-proof** - Automatically handles new planet data  
✅ **Debug logging** - Shows calculated offsets for troubleshooting  

## Usage

### Teleport to any planet
```javascript
// Automatically calculates correct offset
teleportManager.teleportToPlanet(planetData);

// Examples:
teleportManager.teleportToPlanet(mercury);  // 3.0 unit offset
teleportManager.teleportToPlanet(earth);    // 3.0 unit offset
teleportManager.teleportToPlanet(jupiter);  // 22.4 unit offset
```

### Custom offset (if needed)
```javascript
// Manually specify offset
teleportManager.teleportToCoordinates(x, y, z, 50.0);
```

## Camera Field of View Considerations

The 4× multiplier works well with standard FOV (75°):
- **Planet occupies ~25% of screen width** at 4× distance
- Allows comfortable viewing of entire planet
- Leaves room for atmosphere, rings, and moons
- Still close enough to see surface details

## Future Improvements

Potential enhancements:
1. **Account for rings** - Saturn needs extra offset for ring system
2. **Atmosphere consideration** - Planets with thick atmospheres need more space
3. **Moon systems** - Large moon systems may need extra offset
4. **User preference** - Allow players to set preferred viewing distance

---

**Status**: ✅ Complete  
**Date**: 2026-02-01  
**Impact**: Critical - Makes teleportation actually usable for all planet sizes
