# Teleport Target Marker - Visual Highlight

## Feature Added

When you teleport to a planet, a **visual target marker** now appears at the destination to help you immediately locate the planet.

## Visual Design

### Target Reticle Icon
```
     ║
   ┌─╫─┐
   │ ║ │     ⊕  ← Animated cyan target
───┤ ⊕ ├───
   │ ║ │
   └─╫─┘
     ║
```

### Design Elements:
- **Outer glow**: Radial cyan gradient (attention-grabbing)
- **Dual circles**: Two concentric rings (sci-fi aesthetic)
- **Crosshairs**: Four directional lines (targeting system)
- **Corner brackets**: L-shaped corners (frame the target)
- **Center dot**: Pulsing center point (precise position)
- **Color**: Cyan (#00ffff) - high visibility vaporwave theme

## Behavior

### Appearance
- **Instant**: Appears immediately after teleport flash
- **Position**: Centered on planet's exact coordinates
- **Scale**: Proportional to planet size (larger planets = larger marker)
  - Minimum: 20,000 units
  - Dynamic: 0.8× planet radius

### Animation
- **Pulse effect**: Scales 85%-115% at 2 Hz
- **Opacity pulse**: 40%-100% at 3 Hz (breathing effect)
- **Always visible**: Rendered on top (depthTest: false)
- **Distance scaling**: Gets smaller as you approach (sizeAttenuation: true)

### Auto-Remove
- **Duration**: 15 seconds
- **Reason**: Prevents clutter after you've reached the planet
- **Manual**: Removed when teleporting to another planet

## Technical Implementation

### File Changes

**1. main.js**
```javascript
// Added to constructor
this.currentTargetMarker = null;
this.markerFadeTimeout = null;

// New methods
createTargetMarker(position, planetName, planetRadius)
removeTargetMarker()

// Updated teleportToPlanet
this.createTargetMarker(targetPosition, planet.pl_name, planetRadius);
```

**2. src/utils/TeleportManager.js**
```javascript
// Updated constructor
constructor(spacecraft, camera, scene)
this.scene = scene;
this.currentMarker = null;
this.markerFadeTimeout = null;

// New methods
createTargetMarker(position, planetName)
removeTargetMarker()
updateMarker()
```

### Canvas-Based Sprite

- **Texture**: 256×256 canvas texture
- **Type**: THREE.Sprite (always faces camera)
- **Material**: SpriteMaterial with transparency
- **Rendering**: Always on top layer (depthTest: false)

## User Experience

### Before (Problem)
```
[Teleport Flash]
→ Camera appears in space
→ "Where's the planet?" 😕
→ User has to search around
→ Small planets especially hard to find
```

### After (Solution)
```
[Teleport Flash]
→ Camera appears in space
→ Cyan target marker visible ⊕
→ "There it is!" 😊
→ Marker guides you to planet
→ Autopilot engages
→ Marker fades after 15s
```

## Examples

### Mercury (Small Planet)
```
[Camera] ←─ 30,000 units ─→ ⊕ • Mercury
                            │ ↑
                   Marker   └─ Small planet
                   (20k units)
```

### Jupiter (Gas Giant)
```
[Camera] ←──── 80,000 units ────→ ⊕ ⬤ Jupiter
                                   │ ↑
                          Marker   └─ Large planet
                        (40k units)
```

### Exoplanet (Far Away)
```
[Camera] ←────── 500,000 units ──────→ ⊕ ○ Exoplanet
                                        │ ↑
                               Marker   └─ Distant
                             (scales down)
```

## Visibility Features

✅ **Always on top** - Never hidden behind planets or stars  
✅ **High contrast** - Cyan on black space background  
✅ **Animated** - Pulsing draws attention  
✅ **Scaled** - Visible from any distance  
✅ **Temporary** - Auto-removes to prevent clutter  
✅ **Contextual** - Size matches planet importance  

## Benefits

1. **Instant Orientation**: Know exactly where you are
2. **Target Confirmation**: Visual feedback that teleport succeeded
3. **Navigation Aid**: Guide to planet location
4. **Professional Feel**: Sci-fi targeting system aesthetic
5. **No Confusion**: Even tiny planets are marked
6. **Clean UI**: Auto-removes when no longer needed

## Customization Options

### Change marker color
```javascript
ctx.strokeStyle = '#ff00ff'; // Magenta
ctx.fillStyle = '#ff00ff';
```

### Adjust duration
```javascript
setTimeout(() => {
    this.removeTargetMarker();
}, 30000); // 30 seconds instead of 15
```

### Change scale
```javascript
const baseScale = Math.max(planetRadius * 1.5, 30000); // Larger markers
```

### Disable auto-remove
```javascript
// Comment out or remove this block:
// this.markerFadeTimeout = setTimeout(...)
```

## Performance

- **Memory**: ~256KB per marker (canvas texture)
- **Draw calls**: +1 per active marker (max 1 at a time)
- **CPU**: Minimal (requestAnimationFrame for pulse)
- **GPU**: Sprite rendering (very efficient)
- **Cleanup**: Automatic disposal on remove

## Future Enhancements

Potential improvements:
1. **Distance indicator**: Show distance to planet in marker
2. **Multi-target**: Track multiple waypoints
3. **Color coding**: Different colors for planet types
4. **Sound effect**: Audio cue when marker appears
5. **HUD integration**: Show marker info in UI
6. **Keyboard shortcut**: Press key to toggle marker

---

**Status**: ✅ Complete  
**Date**: 2026-02-01  
**Impact**: Greatly improves teleport UX and spatial awareness  
**Theme**: Vaporwave sci-fi aesthetic 🎯✨
