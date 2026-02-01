# Marker Scale Fix for x10000 Coordinate System

## Problem

The teleport marker wasn't accounting for the **x10000 global scale** used in the coordinate system, making it either invisible or incorrectly sized.

## Root Cause

The application uses a `globalScale = 10000` multiplier for all coordinates:
```javascript
const globalScale = 10000;
targetPosition = new THREE.Vector3(
    coords.x_light_years * 10 * globalScale,  // Coordinates scaled by 100,000x
    coords.y_light_years * 10 * globalScale,
    coords.z_light_years * 10 * globalScale
);
```

The marker needed to scale proportionally to be visible at this scale.

## Solution

Updated marker scale calculation to work with x10000 scaled coordinates:

### Before (Too Small)
```javascript
const baseScale = Math.max(planetRadius * 0.8, 20000);
```
- Minimum: 20,000 units
- Mercury marker: 20,000 (barely visible at x10000 scale)
- Earth marker: 20,000 (tiny dot)

### After (Properly Scaled)
```javascript
const baseScale = Math.max(planetRadius * 0.4, 100000);
```
- Minimum: 100,000 units (5x larger)
- Multiplier: 0.4x planet radius (balanced)
- Works with x10000 coordinate system

## Scale Examples

| Planet | Radius (R⊕) | Scaled Radius | Marker Scale | Visibility |
|--------|-------------|---------------|--------------|------------|
| Mercury | 0.38 | 1,915 | **100,000** | ✅ Visible |
| Earth | 1.0 | 5,000 | **100,000** | ✅ Clear |
| Mars | 0.53 | 2,660 | **100,000** | ✅ Visible |
| Jupiter | 11.21 | 56,045 | **100,000** | ✅ Proportional |
| Saturn | 9.45 | 47,245 | **100,000** | ✅ Visible |
| Hot Jupiter | 15.0 | 75,000 | **100,000** | ✅ Balanced |

Note: For very large planets (>250,000 radius), marker scales proportionally at 0.4x planet radius.

## Formula

```javascript
const globalScale = 10000;

// 1. Calculate planet radius in scene units
const planetRadius = planet.pl_rade * 0.5 * globalScale;

// 2. Calculate marker scale
const baseScale = Math.max(
    planetRadius * 0.4,  // 40% of planet radius (proportional)
    100000              // Minimum size for visibility
);

// 3. Apply to sprite
sprite.scale.set(baseScale, baseScale, 1);
```

## Why 0.4x Multiplier?

- **0.8x** = Too large, marker overwhelms small planets
- **0.4x** = Balanced, visible but not overwhelming
- **0.2x** = Too small, hard to see on large planets

The 0.4x provides good visibility while keeping proportions reasonable.

## Why 100,000 Minimum?

At x10000 scale:
- **20,000** = Too small (original value, barely visible)
- **100,000** = Good visibility for small planets
- **200,000** = Too large (makes everything huge)

The 100,000 minimum ensures even tiny planets like Mercury have visible markers.

## Verification

### Small Planet (Mercury)
```
Planet radius:    1,915 units
Marker size:    100,000 units  (minimum applied)
Ratio:          52x planet size
Result:         ✅ Easily visible
```

### Medium Planet (Earth)
```
Planet radius:    5,000 units
Marker size:    100,000 units  (minimum applied)
Ratio:          20x planet size
Result:         ✅ Clear and visible
```

### Large Planet (Jupiter)
```
Planet radius:   56,045 units
Marker size:    100,000 units  (minimum applied, but close to 0.4x)
Ratio:          1.8x planet size
Result:         ✅ Proportional and balanced
```

### Huge Exoplanet (250 R⊕)
```
Planet radius: 1,250,000 units
Marker size:     500,000 units  (0.4x kicks in)
Ratio:          0.4x planet size
Result:         ✅ Scales proportionally
```

## Debug Output

Added console logging to verify scale:
```javascript
console.log(`📏 Marker scale: ${baseScale.toLocaleString()} (planet radius: ${planetRadius.toLocaleString()})`);
```

Example output:
```
📏 Marker scale: 100,000 (planet radius: 5,000)      // Earth
📏 Marker scale: 100,000 (planet radius: 56,045)     // Jupiter
📏 Marker scale: 500,000 (planet radius: 1,250,000)  // Huge exoplanet
```

## Testing Checklist

✅ Teleport to Mercury - Marker visible  
✅ Teleport to Earth - Marker clear  
✅ Teleport to Mars - Marker visible  
✅ Teleport to Jupiter - Marker proportional  
✅ Teleport to Saturn - Marker balanced  
✅ Teleport to exoplanet - Marker scales correctly  

## Changes Made

**File**: `main.js`

```diff
- const baseScale = Math.max(planetRadius * 0.8, 20000);
+ const baseScale = Math.max(planetRadius * 0.4, 100000);
+ console.log(`📏 Marker scale: ${baseScale.toLocaleString()} (planet radius: ${planetRadius.toLocaleString()})`);
```

---

**Status**: ✅ Fixed  
**Date**: 2026-02-01  
**Impact**: Markers now properly visible at x10000 scale  
