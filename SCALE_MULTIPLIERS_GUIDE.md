# Scale Multipliers Guide 🎛️

## CORRECTED COORDINATE SYSTEM ✅

### The Fix Applied
**Problem Found**: Solar system planets were using microscopic light-year coordinates (Mercury at 0.0000061 LY) while exoplanets used proper distances (Proxima b at 4.24 LY). This caused all solar planets to be packed at the origin.

**Solution**: Separate positioning systems for solar vs exoplanets:
- **Solar System**: Uses `pl_orbsmax` (AU orbital distance from Sun)
- **Exoplanets**: Uses `coordinates_3d` (light-years from Earth)

---

## How to Adjust Scale

Edit **`src/config/config.js`**:

```javascript
scale: {
    planetSizeMultiplier: 10,   // Planet visual size (all planets)
    distanceMultiplier: 1,      // Exoplanet spacing (light-year scale)
    auToSceneUnits: 10,         // Solar system spread (AU scale)
}
```

### Current Settings (Default)
- **planetSizeMultiplier: 10** - Planets 10× bigger than realistic
- **distanceMultiplier: 1** - Exoplanets at realistic interstellar distances
- **auToSceneUnits: 10** - 1 AU = 10 scene units (spreads solar system)

---

## What This Means

### Solar System (with auToSceneUnits = 10):
- Mercury: 0.387 AU × 10 = **3.87 scene units** from Sun
- Earth: 1.0 AU × 10 = **10 scene units** from Sun
- Jupiter: 5.2 AU × 10 = **52 scene units** from Sun
- Neptune: 30 AU × 10 = **300 scene units** from Sun

### Exoplanets (with distanceMultiplier = 1):
- Proxima b: 4.24 LY × 10 = **42.4 scene units** from Earth
- HD 16417 b: 52.8 LY × 10 = **528 scene units** from Earth

### Camera:
- Starting position: **(0, 100, 200)** - Good view of solar system
- Look at: **(0, 0, 0)** - Origin (Sun position)

---

## Adjustment Scenarios

### 🔍 Planets Too Small
**Problem**: Can't see Jupiter or other planets clearly  
**Solution**: Increase `planetSizeMultiplier`

```javascript
planetSizeMultiplier: 50,  // 50× bigger (very visible)
```

### 📏 Solar System Too Cramped
**Problem**: All planets appear bunched together  
**Solution**: Increase `auToSceneUnits`

```javascript
auToSceneUnits: 50,  // Neptune now at 1500 units
```

### 🚀 Solar System Too Spread Out
**Problem**: Takes too long to travel between planets  
**Solution**: Decrease `auToSceneUnits`

```javascript
auToSceneUnits: 5,   // Compress solar system by half
```

### 🌌 Exoplanets Too Far
**Problem**: Nearest exoplanet takes forever to reach  
**Solution**: Decrease `distanceMultiplier`

```javascript
distanceMultiplier: 0.5,  // Halve interstellar distances
```

### 🎯 Balanced Exploration (Recommended):
```javascript
scale: {
    planetSizeMultiplier: 20,   // Clear visibility
    distanceMultiplier: 1,      // Realistic star distances
    auToSceneUnits: 20,         // Comfortable solar system
}
```

---

## Technical Details

### Coordinate Systems Used

#### Solar System (Heliocentric):
```javascript
// Uses AU orbital distance directly
const distanceAU = planet.pl_orbsmax;  // e.g., Jupiter = 5.203 AU
const sceneDistance = distanceAU * CONFIG.scale.auToSceneUnits;
position = (Math.cos(angle) * sceneDistance, 0, Math.sin(angle) * sceneDistance)
```

#### Exoplanets (Equatorial/Galactic):
```javascript
// Uses light-years from Earth
const coords = planet.characteristics.coordinates_3d;
const sceneScale = 10 * CONFIG.scale.distanceMultiplier;
position = (coords.x_light_years * sceneScale, 
            coords.y_light_years * sceneScale, 
            coords.z_light_years * sceneScale)
```

### Files Updated for Consistency:
- ✅ `src/config/config.js` - Scale configuration
- ✅ `src/objects/ExoplanetField.js` - Planet rendering
- ✅ `src/config/planets.js` - Solar system loading
- ✅ `main.js` - Teleport system
- ✅ `src/utils/TeleportManager.js` - Navigation
- ✅ `src/core/Camera.js` - Initial camera position

### Why Two Systems?

**Astronomical Reality**:
- Solar system: ~0.0005 light-years across (microscopic at galactic scale)
- Nearest star: 4.24 light-years away (8,000× farther than Neptune!)

**Visual Solution**:
- Solar system uses AU scale (manageable distances)
- Exoplanets use light-year scale (realistic interstellar gaps)
- Separate multipliers let you balance both independently

---

## Testing Values

| Use Case | planetSizeMultiplier | distanceMultiplier | auToSceneUnits |
|----------|---------------------|-------------------|----------------|
| **Default (Balanced)** | 10 | 1 | 10 |
| **Beginner Friendly** | 50 | 0.5 | 20 |
| **Arcade Mode** | 100 | 0.2 | 30 |
| **Realistic (Hard)** | 5 | 1 | 5 |
| **Education Mode** | 20 | 1 | 15 |
| **Performance Mode** | 5 | 1 | 10 |

---

## Visual Verification

After changing values:
1. **Save** `src/config/config.js`
2. **Rebuild**: `npm run build`
3. **Reload** browser
4. **Check**:
   - Can you see Jupiter from starting camera position?
   - Press 'T' to open Planet Navigator
   - Teleport to Earth - does it work?
   - Teleport to Proxima Centauri - correct distance?

---

## Troubleshooting

**Q: Changed values but nothing happened?**  
A: Run `npm run build` after editing config.js

**Q: Planets disappeared completely?**  
A: Values might be too extreme. Try defaults:
```javascript
planetSizeMultiplier: 10
distanceMultiplier: 1  
auToSceneUnits: 10
```

**Q: Solar system planets bunched at origin?**  
A: Check that planets have `pl_orbsmax` field in solar_system.json

**Q: Teleport not working?**  
A: All teleport logic now uses same coordinate system automatically

**Q: Exoplanets too close to solar system?**  
A: Increase `distanceMultiplier` or decrease `auToSceneUnits`

---

## Advanced: Why This Works

### The Math
```javascript
// Solar system (Sun at origin)
Mercury position = (3.87, 0, 0)     // auToSceneUnits × 0.387
Earth position = (10, 0, 0)         // auToSceneUnits × 1.0
Neptune position = (300, 0, 0)      // auToSceneUnits × 30

// Exoplanets (Earth/Sun at origin)  
Proxima b = (42, 0, 0)              // distanceMultiplier × 10 × 4.24
HD 16417 = (528, 0, 0)              // distanceMultiplier × 10 × 52.8
```

### Scale Comparison
With default settings:
- Jupiter is **52 units** from origin (solar system)
- Proxima b is **42 units** from origin (nearest star!)
- This is physically wrong but visually perfect for exploration

---

## Revert to Defaults

```javascript
scale: {
    planetSizeMultiplier: 10,
    distanceMultiplier: 1,
    auToSceneUnits: 10,
}
```

Then `npm run build`

---

**Status**: ✅ Fully implemented and tested  
**Build**: ✅ Successful  
**Coordinate System**: ✅ Corrected (Solar=AU, Exo=LY)  
**Files Updated**: 6 files for consistency
