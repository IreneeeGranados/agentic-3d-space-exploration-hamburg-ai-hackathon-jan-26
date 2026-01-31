# NASA Exoplanet Data

Complete dataset of 39,282 exoplanets from NASA's Exoplanet Archive, processed and clustered for 3D visualization.

## 🚀 Quick Start

```javascript
import { ClusterLoader } from './cluster-loader.js';

const loader = new ClusterLoader('clusters');
await loader.init();

// Load nearby planets (instantly!)
const planets = await loader.loadCluster('nearby_quad1');
console.log(`Loaded ${planets.length} planets`);

// Each planet has 3D position
planets.forEach(planet => {
  if (planet.position) {
    const {x, y, z} = planet.position; // in AU
    // Create your 3D mesh here
  }
});
```

## 📊 What's Included

- **39,282 planets** from NASA Exoplanet Archive
- **18,585 planets** with calculated 3D positions
- **17 spatial clusters** for progressive loading
- **Complete orbital data** (period, eccentricity, inclination)
- **Physical properties** (mass, radius, density, temperature)

## 📁 Files

### Scripts
- `convert_nasa.py` - Convert CSV to JSON with 3D positions
- `cluster_planets.py` - Split into spatial clusters
- `cluster-loader.js` - JavaScript loader for front-end

### Data
- `nasa_data.csv` (129 MB) - Original data
- `nasa_exoplanets_frontend.json` (409 MB) - Full dataset with positions
- `clusters/` - 17 cluster files + index

### Documentation
- `SETUP_SUMMARY.md` - Complete setup guide
- `CLUSTERING_README.md` - API documentation
- `DATA.md` - Data dictionary

## 🌍 Cluster Organization

Planets are organized by **distance from Earth** and **galactic position**:

- **Nearby** (0-100 ly): 793 planets - Perfect for demos
- **Medium** (100-500 ly): 2,283 planets
- **Far** (500-2000 ly): 6,123 planets
- **Very Far** (2000+ ly): 9,386 planets

Each distance shell has 4 quadrants based on galactic coordinates.

## 💡 Usage Examples

### Load Specific Cluster
```javascript
const planets = await loader.loadCluster('nearby_quad1');
```

### Load All Nearby
```javascript
const allNearby = await loader.loadNearby();
```

### Search for a Planet
```javascript
const kepler = await loader.searchAndLoadPlanet('Kepler-452 b');
if (kepler) {
  console.log(`Found at distance: ${kepler.sy_dist} parsecs`);
}
```

### Smart Loading Based on Camera
```javascript
const planets = await loader.loadForCamera(camera.position);
```

## 📈 Performance

- **Initial load**: <1 second (7.2 MB)
- **Full nearby view**: ~1-2 seconds (4 files, ~9 MB total)
- **Progressive loading**: Load more as user explores
- **Memory efficient**: Unload distant clusters automatically

## 🎯 For Your Hackathon

Start with `nearby_quad1.json`:
- 688 planets
- 7.2 MB (loads instantly)
- Contains most interesting nearby systems
- Perfect for demos

Then progressively load more as needed!

## 🔧 Regenerating Data

If you need to regenerate the data:

```bash
cd nasa_data

# 1. Download latest NASA data
curl -o nasa_data.csv 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+*+from+ps&format=csv'

# 2. Convert to JSON with 3D positions
python convert_nasa.py

# 3. Cluster by spatial location
python cluster_planets.py
```

## 📚 Documentation

See detailed documentation in:
- [Setup Summary](./SETUP_SUMMARY.md)
- [Clustering Guide](./CLUSTERING_README.md)
- [Data Dictionary](./DATA.md)
- [Cluster Details](./clusters/README.md)

## ✨ Features

Each planet includes:
- 3D position (x, y, z in Astronomical Units)
- Orbital elements (period, eccentricity, inclination, etc.)
- Physical properties (mass, radius, density)
- Discovery information (method, year, facility)
- Host star properties (temperature, mass, radius)
- Distance from Earth (light years)
- Temperature estimate

## 🎮 Perfect For

- 3D space exploration apps
- Interactive exoplanet visualizations
- Educational astronomy tools
- VR/AR space experiences
- Data visualization demos

## 📄 License

Data from NASA Exoplanet Archive (public domain)
Processing scripts and tools: MIT License

---

**Built for Hamburg AI Hackathon Jan 2026** 🚀

Good luck with your project!
