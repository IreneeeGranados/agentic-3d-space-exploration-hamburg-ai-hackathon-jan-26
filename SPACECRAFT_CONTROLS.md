# Spacecraft Speed Controls - Complete Guide

## Controls Added

### Speed Control System

| Key | Action | Description |
|-----|--------|-------------|
| **+** or **Numpad +** | Speed Up | Increase speed by 100 units/sec |
| **-** or **Numpad -** | Slow Down | Decrease speed by 100 units/sec |
| **Shift** | Boost | Turbo boost to 200 units/sec |
| **Space** | Brake | Emergency brake to full stop |

### Steering (Unchanged)
| Key | Action |
|-----|--------|
| **W/↑** | Pitch Up |
| **S/↓** | Pitch Down |
| **A/←** | Yaw Left |
| **D/→** | Yaw Right |

## Speed Ranges

```
Minimum:    0 units/sec   (Full stop)
Default:   50 units/sec   (Cruise speed)
Boost:    200 units/sec   (Turbo mode)
Maximum:  500 units/sec   (Speed limit)
```

## How It Works

### 1. Manual Speed Adjustment (+/-)

**Pressing + (Plus)**:
```javascript
Speed increases by 100 units/second
50 → 150 → 250 → 350 → 450 → 500 (max)
```

**Pressing - (Minus)**:
```javascript
Speed decreases by 100 units/second
500 → 400 → 300 → 200 → 100 → 50 (default) → 0 (stop)
```

### 2. Boost Mode (Shift)

**Holding Shift**:
```javascript
Current speed → Smoothly accelerates to 200 units/sec
Uses lerp for smooth acceleration (3x multiplier)
Visual: Engine glow intensifies
```

**Releasing Shift**:
```javascript
200 units/sec → Smoothly returns to default 50 units/sec
Uses lerp for smooth deceleration (2x multiplier)
```

### 3. Emergency Brake (Space)

**Holding Space**:
```javascript
Current speed → Rapidly decelerates to 0
Uses lerp for quick stop (5x multiplier)
Visual: Engine glow fades
```

## Visual Feedback

### Engine Glow Intensity
```
Speed:   0 → Glow: 20% (idle)
Speed:  50 → Glow: 50% (normal)
Speed: 150 → Glow: 80% (boosting)
Speed: 500 → Glow: 100% (maximum)
```

### HUD Display
The speed is shown in the HUD:
```
Speed: 150 units/sec
```

## Technical Details

### Speed Properties

```javascript
class Spacecraft {
    forwardSpeed = 50.0;         // Current speed
    defaultSpeed = 50.0;         // Normal cruising speed
    boostSpeed = 200.0;          // Boost target speed
    minSpeed = 0.0;              // Minimum (stopped)
    maxSpeed = 500.0;            // Maximum speed limit
    speedIncrement = 100.0;      // Adjustment rate (units/sec)
    boostAcceleration = 500.0;   // Boost acceleration
}
```

### Smooth Transitions

All speed changes use **lerp** (linear interpolation) for smooth transitions:

```javascript
// Boost (fast acceleration)
speed = lerp(currentSpeed, boostSpeed, deltaTime * 3.0)

// Return to default (medium deceleration)
speed = lerp(currentSpeed, defaultSpeed, deltaTime * 2.0)

// Brake (fast deceleration)
speed = lerp(currentSpeed, 0, deltaTime * 5.0)

// Manual adjustment (instant but clamped)
speed += increment * deltaTime
speed = clamp(speed, minSpeed, maxSpeed)
```

## Usage Examples

### Scenario 1: Cruising
```
1. Start at 50 units/sec (default)
2. Press + to reach 150 units/sec
3. Hold Shift to boost to 200 units/sec
4. Release Shift, returns to 150 units/sec
5. Press - to return to 50 units/sec
```

### Scenario 2: Emergency Stop
```
1. Flying at 300 units/sec
2. Hold Space
3. Speed: 300 → 200 → 100 → 0 (quick stop)
4. Release Space
5. Press + to resume movement
```

### Scenario 3: Precision Control
```
1. Approaching planet at 200 units/sec
2. Press - multiple times: 200 → 100 → 50
3. Final approach at 50 units/sec
4. Hold Space to stop at exact position
```

### Scenario 4: Fast Travel
```
1. Press + multiple times: 50 → 150 → 250 → 350 → 450 → 500
2. Hold Shift (stays at 500, boost effect)
3. Travel at maximum speed
4. Press - to slow down when approaching destination
```

## Integration with Autopilot

When autopilot engages:
```javascript
Speed automatically set to 150 units/sec (autopilot speed)
Manual controls disabled
Speed returns to default (50) when autopilot disengages
```

## Files Modified

### 1. `src/objects/Spacecraft.js`

**Constructor**:
```diff
+ forwardSpeed: 50.0
+ defaultSpeed: 50.0
+ boostSpeed: 200.0
+ minSpeed: 0.0
+ maxSpeed: 500.0
+ speedIncrement: 100.0
+ boostAcceleration: 500.0
```

**updateManualControl()**:
```diff
+ Speed adjustment with +/- keys
+ Boost mode with smooth lerp
+ Brake with quick deceleration
+ Speed clamping to min/max range
```

### 2. `main.js`

**setupControls()**:
```diff
+ if (e.code === 'Equal' || e.code === 'NumpadAdd') this.keys.speedUp = true;
+ if (e.code === 'Minus' || e.code === 'NumpadSubtract') this.keys.speedDown = true;
```

## Keyboard Layout

```
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬─────┐
│   │   │   │   │   │   │   │   │   │   │   │ - │ + │     │
│   │   │   │   │   │   │   │   │   │   │   │▼▼▼│▲▲▲│     │
├───┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬───┤
│     │   │ W │   │   │   │   │   │ I │   │   │   │   │   │
│     │   │ ▲ │   │   │   │   │   │INF│   │   │   │   │   │
├─────┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴┬──┴───┤
│      │ A │ S │ D │   │   │ H │   │   │   │   │   │      │
│      │ ← │ ▼ │ → │   │   │UI │   │   │   │   │   │      │
├──────┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴─┬─┴──────┤
│ SHIFT  │   │   │   │   │   │   │   │   │   │   │ SHIFT  │
│ BOOST  │   │   │   │   │   │   │   │   │   │   │ BOOST  │
├────┬───┴┬──┴─┬─┴───┴───┴───┴───┴───┴──┬┴───┼───┴┬───┬───┤
│    │    │    │                        │    │    │   │   │
│    │    │    │       SPACE            │    │    │   │   │
│    │    │    │       BRAKE            │    │    │   │   │
└────┴────┴────┴────────────────────────┴────┴────┴───┴───┘
```

## Tips

✅ **Use + to increase speed before long journeys**  
✅ **Use - to slow down when approaching planets**  
✅ **Hold Shift for quick bursts of speed**  
✅ **Use Space for emergency stops**  
✅ **Default speed (50) is good for navigation**  
✅ **Maximum speed (500) for crossing vast distances**  

## Troubleshooting

**Speed not changing?**
- Check that you're pressing + or - (not =)
- Make sure you're not at min (0) or max (500) speed

**Boost not working?**
- Hold Shift, don't just tap it
- Boost smoothly accelerates over ~1 second

**Can't stop?**
- Hold Space (not tap)
- Deceleration takes ~1-2 seconds

---

**Status**: ✅ Complete  
**Date**: 2026-02-01  
**Impact**: Full speed control for spacecraft navigation
