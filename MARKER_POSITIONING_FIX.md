# Marker Positioning Fix

## Problem

The teleport marker wasn't visible because:
1. **Hidden behind planet** - Positioned at planet center, obscured by the planet mesh
2. **Wrong scale mode** - Using world-space scale instead of screen-space
3. **Fixed size** - Didn't account for camera distance changes

## Solution

### 1. Offset Position (In Front of Planet)

**Before**: Marker at planet center
```javascript
sprite.position.copy(position); // Hidden inside/behind planet
```

**After**: Marker offset towards camera
```javascript
const offsetPosition = position.clone();
const toCameraDir = camera.position.clone().sub(position).normalize();
offsetPosition.add(toCameraDir.multiplyScalar(planetRadius * 1.5));
sprite.position.copy(offsetPosition);
```

**Result**: Marker floats 1.5× planet radius in front of planet surface (always visible)

### 2. Screen-Space Scaling

**Before**: Fixed world-space scale
```javascript
sizeAttenuation: true
const baseScale = Math.max(planetRadius * 0.4, 100000);
```
- Problem: Marker gets tiny when far away, huge when close

**After**: Constant screen-space scale
```javascript
sizeAttenuation: false
const distanceToCamera = camera.position.distanceTo(offsetPosition);
const baseScale = distanceToCamera * 0.15;
```
- Solution: Marker maintains constant visual size regardless of distance

### 3. Dynamic Scale Updates

**Animation loop now updates scale based on camera distance:**
```javascript
const animateMarker = () => {
    const currentDistance = camera.position.distanceTo(sprite.position);
    const currentScale = currentDistance * 0.15 * pulse;
    sprite.scale.set(currentScale, currentScale, 1);
};
```

## Visual Explanation

### Before (Hidden)
```
     [Camera]
        |
        | View direction
        ↓
       🪐 Planet
       ⊕ ← Marker hidden inside/behind planet
```

### After (Visible)
```
     [Camera]
        |
        | View direction
        ↓
        ⊕ ← Marker floating in front
       🪐 Planet (visible behind marker)
```

## Positioning Formula

```javascript
// 1. Get direction from planet to camera
const toCamera = camera.position - planet.position;
const direction = normalize(toCamera);

// 2. Offset marker towards camera
const offset = direction * (planetRadius * 1.5);
markerPosition = planetPosition + offset;

// 3. Scale based on distance (constant screen size)
const distance = length(camera.position - markerPosition);
markerScale = distance * 0.15;
```

## Scale Factor (0.15)

Why 0.15?
- **0.05** = Too small (marker hard to see)
- **0.10** = Still small
- **0.15** = Perfect visibility ✓
- **0.20** = Too large (overwhelming)
- **0.30** = Way too large

The 0.15 factor provides good visibility at all distances.

## Offset Distance (1.5× Planet Radius)

Why 1.5×?
- **0.5×** = Too close, might still be inside planet
- **1.0×** = Right at surface, can be occluded
- **1.5×** = Safely in front, always visible ✓
- **2.0×** = Too far from planet, loses context
- **3.0×** = Way too far

The 1.5× offset ensures marker is clearly in front without being too far.

## Examples

### Mercury (Small Planet)
```
Camera distance: 300,000 units
Marker scale:     45,000 units (300,000 * 0.15)
Offset:            2,872 units (1,915 * 1.5)
Result:           ✅ Clearly visible in front of planet
```

### Earth
```
Camera distance: 300,000 units
Marker scale:     45,000 units
Offset:            7,500 units (5,000 * 1.5)
Result:           ✅ Perfect visibility
```

### Jupiter (Large Planet)
```
Camera distance: 500,000 units
Marker scale:     75,000 units (500,000 * 0.15)
Offset:           84,068 units (56,045 * 1.5)
Result:           ✅ Well-positioned in front
```

### As You Approach
```
Distance: 1,000,000 → Marker: 150,000 (large, easy to see)
Distance:   500,000 → Marker:  75,000 (medium)
Distance:   100,000 → Marker:  15,000 (small but visible)
Distance:    50,000 → Marker:   7,500 (close-up view)
```

## Debug Output

Console now shows:
```
📏 Marker at distance 485,234, scale: 72,785, planet radius: 56,045
```

This helps verify:
- Marker is at correct distance from camera
- Scale is proportional to distance
- Planet radius is correctly scaled

## Benefits

✅ **Always visible** - Never hidden behind planet  
✅ **Constant size** - Same screen size at any distance  
✅ **Contextual** - Positioned relative to planet  
✅ **Dynamic** - Updates as camera moves  
✅ **Professional** - HUD-style marker behavior  

## Changes Made

**File**: `main.js`

```diff
+ // Position offset towards camera
+ const offsetPosition = position.clone();
+ const toCameraDir = this.cameraManager.camera.position.clone().sub(position).normalize();
+ offsetPosition.add(toCameraDir.multiplyScalar(planetRadius * 1.5));
+ sprite.position.copy(offsetPosition);

- sizeAttenuation: true
+ sizeAttenuation: false

- const baseScale = Math.max(planetRadius * 0.4, 100000);
+ const distanceToCamera = this.cameraManager.camera.position.distanceTo(offsetPosition);
+ const baseScale = distanceToCamera * 0.15;

+ // Update scale in animation loop based on current distance
+ const currentDistance = this.cameraManager.camera.position.distanceTo(sprite.position);
+ const currentScale = currentDistance * 0.15 * pulse;
```

---

**Status**: ✅ Fixed  
**Date**: 2026-02-01  
**Impact**: Marker now always visible and properly positioned in front of planet
