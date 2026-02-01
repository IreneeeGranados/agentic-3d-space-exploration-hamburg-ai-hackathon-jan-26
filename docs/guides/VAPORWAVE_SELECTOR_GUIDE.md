# Vaporwave Planet Selector - User Guide

## 🌌 Overview

A retro-futuristic 80s-inspired interface for selecting and teleporting to NASA exoplanets in 3D space. Features vaporwave aesthetics with neon colors, animated grids, and instant teleportation.

## ✨ Features

### 1. **Vaporwave UI Selector**
- Press **[T]** to open the Planet Selector interface
- Retro-futuristic design with:
  - Neon pink, cyan, purple, and green colors
  - Animated grid backgrounds
  - Glowing text effects and scanlines
  - Smooth animations and transitions

### 2. **Planet Search & Filtering**
- **Search bar**: Find planets by name
- **Habitability filter**: Filter by habitability percentage (0-100%)
- **Distance filter**: Show only planets within specified distance
- Real-time filtering as you type

### 3. **Planet Information**
- **Card View**: Browse planets in a grid layout showing:
  - Planet name
  - Distance in light-years
  - Planet type (Super-Earth, Neptune-like, etc.)
  - Habitability percentage with color-coded bars

- **Detailed View**: Click a planet to see:
  - Full classification
  - Atmosphere composition
  - Toxicity levels
  - 3D coordinates
  - Host star information

- **Tooltip Hover**: Hover over planet cards for additional info:
  - Discovery year and method
  - Mass and radius
  - Orbital period
  - Material composition

### 4. **3D Scene Hover Info**
- Hover your mouse over planets in the 3D space
- Real-time information tooltip appears showing:
  - Planet name and type
  - Distance from Earth
  - Habitability score
  - Atmosphere type
  - Host star
  - Discovery year

### 5. **Instant Teleportation**
- Select any planet in the list
- Click **"⚡ INITIATE TELEPORT ⚡"** button
- Visual flash effect during teleport
- Spacecraft instantly moves to planet vicinity
- Camera automatically focuses on destination

## 🎮 Controls

| Key | Action |
|-----|--------|
| **T** | Toggle Planet Selector UI |
| **ESC** | Close Planet Selector |
| **Mouse** | Hover over planets in 3D space for info |
| **Click** | Select planet in list or 3D scene |

## 📊 Data Integration

### NASA Exoplanet Dataset
- **39,282 planets** from NASA Exoplanet Archive
- **Enriched characteristics** including:
  - Habitability scores (0-100%)
  - Toxicity levels (0-100%)
  - Planet classification (Sub-Earth, Super-Earth, Neptune-like, Jupiter-like)
  - Atmosphere composition
  - Dual coordinate systems (Cartesian 3D + ICRS)

### Progressive Loading
- Nearby planets (0-100 ly) load first
- Medium distance (100-500 ly) load in background
- Far and very far planets load on demand
- Optimized for performance with 17 spatial clusters

## 🎨 Vaporwave Design Elements

### Color Palette
- **Hot Pink** (#ff006e) - Primary accents
- **Cyan** (#00d4ff) - Text and highlights
- **Purple** (#8b00ff) - Borders and labels
- **Neon Green** (#39ff14) - Success indicators
- **Orange** (#ff6b00) - Warning states

### Visual Effects
- Animated grid background with perspective
- Glowing neon text with multiple shadows
- CRT scanline effects
- Pulsing buttons
- Gradient progress bars with animated glow
- Smooth card hover transitions
- Flash effect on teleport

### Typography
- **Courier New** monospace font
- All-caps labels with letter-spacing
- Retro digital display aesthetic

## 🏗️ Architecture

Following the modular architecture guidelines:

```
src/
├── services/
│   └── PlanetDataService.js      # Loads NASA cluster data
├── utils/
│   ├── TeleportManager.js         # Handles instant teleportation
│   └── PlanetHoverInfo.js         # 3D scene hover detection
└── controls/
    └── PlanetSelector.js          # Main UI component
```

### Components

1. **PlanetDataService** (`src/services/`)
   - Loads NASA exoplanet cluster JSON files
   - Progressive loading strategy
   - Search and filter capabilities
   - 39,282+ planets across 17 clusters

2. **TeleportManager** (`src/utils/`)
   - Instant position changes using coordinates_3d
   - Visual teleport effects
   - Camera and spacecraft synchronization
   - Configurable approach distance

3. **PlanetSelector** (`src/controls/`)
   - Vaporwave UI component
   - Search/filter controls
   - Planet card rendering
   - Selection and teleport logic

4. **PlanetHoverInfo** (`src/utils/`)
   - Raycasting for hover detection
   - Real-time tooltip positioning
   - Dataset integration for enriched info

## 🚀 Usage Example

```javascript
// Automatically initialized in main.js

// Press [T] to open selector
// Or programmatically:
app.planetSelector.show();

// Search for a specific planet
// Type "Proxima" in search bar

// Filter by habitability
// Move slider to 50%+ 

// Select and teleport
// Click planet card, then "INITIATE TELEPORT"

// Close selector
app.planetSelector.hide();
// Or press [ESC]
```

## 🔧 Configuration

### Adjust Teleport Distance
```javascript
// Set approach distance in TeleportManager
this.teleportManager.setOffset(150); // 150 scene units
```

### Modify Loading Strategy
```javascript
// Load specific clusters
await this.planetDataService.loadCluster('nearby_quad1');

// Load all clusters
await this.planetDataService.loadAllClusters();
```

### Customize Search
```javascript
// Advanced filtering
const planets = this.planetDataService.filter({
    name: 'Proxima',
    minHabitability: 60,
    maxToxicity: 40,
    maxDistance: 100,
    planetType: 'Super-Earth'
});
```

## 📈 Performance

- **Initial load**: ~793 nearby planets (<1s)
- **Full dataset**: 39,282 planets (~3-5s background)
- **UI rendering**: 100 planets per page (instant)
- **Search/filter**: Real-time (<50ms)
- **Teleport**: Instant position change with 0.5s effect

## 🎯 Future Enhancements

- [ ] Favorites/bookmarks system
- [ ] Route planning between planets
- [ ] Advanced sorting (by habitability, distance, discovery date)
- [ ] Planet comparison tool
- [ ] Export/share selected planets
- [ ] Voice commands for search
- [ ] VR mode support

## 📝 Technical Details

### Coordinate Systems
- **Cartesian 3D**: Used for Three.js positioning
  - `coordinates_3d.x_light_years`
  - `coordinates_3d.y_light_years`
  - `coordinates_3d.z_light_years`

- **ICRS Astronomical**: For reference
  - Right Ascension / Declination
  - Parallax and proper motion

### Teleport Calculation
```javascript
// Convert light years to scene units (1 ly = 10 units)
const sceneScale = 10;
const position = new THREE.Vector3(
    coords.x_light_years * sceneScale,
    coords.y_light_years * sceneScale,
    coords.z_light_years * sceneScale
);
```

## 🐛 Troubleshooting

**Selector won't open?**
- Check console for errors
- Verify NASA data clusters are accessible
- Ensure 'T' key isn't captured by other handlers

**Planets not loading?**
- Check network tab for 404 errors on cluster JSON files
- Verify `nasa_data/clusters/` directory exists
- Check browser console for service errors

**Hover info not showing?**
- Ensure mouse is over canvas element
- Check that planets array is populated
- Verify raycasting is initialized

**Teleport not working?**
- Verify planet has `coordinates_3d` data
- Check spacecraft and camera references
- Ensure TeleportManager is initialized

## 📚 Documentation References

- `AGENTS.md` - Architecture guidelines
- `FRONTEND_AGENT_README.md` - Data integration guide
- `CLUSTER_UPDATE_SUMMARY.md` - Dataset field descriptions
- `COORDINATES_QUICK_REFERENCE.md` - Coordinate systems

---

**Version**: 1.0  
**Created**: 2026-01-31  
**Author**: Hamburg AI Hackathon Team
