# 🌟 Warp Speed Visual Effect

## Overview

The space dust particle system now transforms into a **warp speed effect** when the spacecraft exceeds **200 u/s**!

## Visual Behavior

### Normal Mode (< 200 u/s)
```
Speed: 0-200 u/s
Effect: Floating ambient particles
        Gentle drift around spacecraft
        Standard size and opacity
```

**Appearance**: Subtle white points drifting slowly around you for spatial reference.

### Warp Mode (> 200 u/s)
```
Speed: 200+ u/s
Effect: Dynamic speed streaks
        Particles stream backwards
        Size and brightness scale with speed
        Creates motion blur effect
```

**Appearance**: Brilliant star streaks rushing past you, like hyperspace!

## Speed Scaling

The warp effect intensity scales with your speed:

| Speed Range | Effect Intensity | Particle Behavior |
|-------------|------------------|-------------------|
| **0-200 u/s** | Normal | Floating ambient |
| **200-500 u/s** | Low Warp | Gentle streaking |
| **500-1,000 u/s** | Medium Warp | Noticeable streaks |
| **1,000-5,000 u/s** | High Warp | Intense motion blur |
| **5,000+ u/s** | Maximum Warp | LUDICROUS SPEED! ⚡ |

## Technical Details

### Formula
```javascript
speedFactor = min((speed - 200) / 500, 5.0)
streamSpeed = 2.0 + speedFactor * 3.0
particleSize = 1.5 + speedFactor * 2.0
opacity = min(0.8 + speedFactor * 0.15, 0.95)
```

### Particle Behavior

**Normal Mode**:
- Particles: 2000 points
- Range: 400 units around spacecraft
- Behavior: Random floating, wraps around when out of range
- Size: 0.8 (constant)
- Opacity: 0.6

**Warp Mode**:
- Particles stream from ahead, shoot past spacecraft
- Respawn in a cone ahead when they pass behind
- Size: 1.5 → 11.5 (scales with speed)
- Opacity: 0.8 → 0.95 (scales with speed)
- Stream speed: 2.0 → 17.0 units/frame

### Transition

```javascript
if (speed > 200 && !warpMode) {
    console.log('🌟 Speed effect mode: WARP');
    enableWarpEffect();
}

if (speed <= 200 && warpMode) {
    console.log('🌟 Speed effect mode: NORMAL');
    disableWarpEffect();
}
```

Transitions are instant with console notification.

## Code Changes

### SpaceDust.js

**New Properties**:
```javascript
this.speedThreshold = 200;    // Activation speed
this.isWarpMode = false;      // Current mode
this.currentSpeed = 0;        // Last speed value
```

**New Methods**:
```javascript
updateNormalMode(positions, spacecraftPosition)
// Standard floating particles

updateWarpMode(positions, sizes, spacecraftPosition, direction, speed)
// Warp speed streaming effect
```

**Update Signature Changed**:
```javascript
// Before
update(spacecraftPosition)

// After
update(spacecraftPosition, spacecraftSpeed, spacecraftDirection)
```

### main.js

**Line 554-558**: Updated SpaceDust update call
```javascript
// Before
this.spaceDust.update(this.spacecraft.group.position);

// After
const speed = this.spacecraft.getSpeed();
const direction = new THREE.Vector3(1, 0, 0)
    .applyQuaternion(this.spacecraft.group.quaternion);
this.spaceDust.update(this.spacecraft.group.position, speed, direction);
```

## Visual Examples

### At 50 u/s (Normal)
```
    •    •  •       •   •
  •    •       •  •    •
 •   •    🚀    •   •   •
  •       •   •    •    •
    •  •      •  •    •
```
Gentle floating points

### At 300 u/s (Low Warp)
```
    *    *  *       *   *
  *    * ------ *  *    *
 *   * ━━━🚀━━━  *   *   *
  *  ----- *   *    *    *
    *  *  ----*  *    *
```
Light streaking begins

### At 1,000 u/s (Medium Warp)
```
    ══════════   ═══════
  ═══════════════════════
 ═══════════🚀════════════
  ═══════════════════════
    ══════════   ═══════
```
Noticeable motion blur

### At 10,000 u/s (Maximum Warp)
```
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
 ▓▓▓▓▓▓▓▓▓▓▓🚀▓▓▓▓▓▓▓▓▓▓▓▓
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
```
LUDICROUS SPEED! ⚡⚡⚡

## Testing

### Test 1: Normal to Warp Transition
1. Start spacecraft
2. Hold `+` to accelerate
3. Watch console at ~200 u/s: "🌟 Speed effect mode: WARP"
4. Observe particles begin streaking backwards

### Test 2: Warp Intensity
1. Accelerate to 200 u/s (light streaks)
2. Continue to 1,000 u/s (medium streaks)
3. Continue to 5,000 u/s (intense streaks)
4. Observe particles getting larger and brighter

### Test 3: Warp to Normal Transition
1. Reach 1,000 u/s (warp mode)
2. Hold `-` or `Space` to slow down
3. Watch console at ~200 u/s: "🌟 Speed effect mode: NORMAL"
4. Observe particles return to gentle floating

### Test 4: Direction Change
1. Reach 500 u/s (warp mode active)
2. Turn spacecraft with A/D keys
3. Observe particles stream from new forward direction
4. Effect always follows where you're pointing

## Performance

- **Particle Count**: 2,000 (same as before)
- **Update Cost**: Minimal increase (few extra calculations per particle)
- **GPU Cost**: Same (PointsMaterial unchanged)
- **Memory**: +12 KB for velocity buffer

## User Experience

### Immersion
- **Low Speed**: Calm, exploratory feeling
- **High Speed**: Intense, thrilling sensation
- **Ultra Speed**: "Going plaid" effect 🚀

### Spatial Awareness
- Normal mode: Helps judge position and drift
- Warp mode: Reinforces sense of velocity and direction
- Automatic transition: Seamless, no manual control needed

### Feedback
Console logs speed mode transitions so you know when the effect activates:
```
🌟 Speed effect mode: WARP (234 u/s)
🌟 Speed effect mode: NORMAL (185 u/s)
```

## Customization

Want to adjust the effect? Edit these values in **SpaceDust.js**:

```javascript
// Activation speed
this.speedThreshold = 200;  // Change to 100, 500, etc.

// Particle count
constructor(count = 2000)   // More = denser effect

// Effect intensity
streamSpeed = 2.0 + speedFactor * 3.0;  // Adjust multipliers
particleSize = 1.5 + speedFactor * 2.0;
```

## Known Limitations

1. **Not Trail Lines**: Uses point sprites, not actual line geometry
2. **Camera Independent**: Effect works in both chase and cockpit view
3. **No Color Change**: Particles stay white (could add speed-based color)
4. **No Sound**: Visual only (could add engine roar scaling)

## Future Enhancements

Potential improvements (not implemented):
- Speed-based color (blue → white → red with speed)
- LineSegments for actual streak trails
- Sound effects tied to warp mode
- Screen chromatic aberration at extreme speeds
- Shake/vibration effects

---

**Status**: ✅ Complete  
**Activation**: Automatic at 200 u/s  
**Effect**: Dynamic warp speed particle streaming  
**Performance**: Negligible impact  
**User Control**: None needed (automatic)

**Enjoy your warp speed journey! 🚀✨**
