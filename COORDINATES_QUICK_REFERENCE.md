# Quick Reference: NASA Cluster Data with Coordinates

## 🚀 Quick Start

```javascript
// Load a cluster
const planets = await fetch('nasa_data/clusters/nearby_quad1.json').then(r => r.json());
const planet = planets[0];

// Access planet characteristics
const { characteristics } = planet;
```

## 📍 Accessing Coordinates

### 1. Cartesian 3D Coordinates (for visualization)

```javascript
const { coordinates_3d } = characteristics;

// Position in space (light-years from Earth)
const x = coordinates_3d.x_light_years;
const y = coordinates_3d.y_light_years;
const z = coordinates_3d.z_light_years;

// Calculate distance from Earth
const distance = Math.sqrt(x*x + y*y + z*z);
```

### 2. ICRS Astronomical Coordinates (for observations)

```javascript
const { icrs_coordinates } = characteristics;

// Celestial position
const ra = icrs_coordinates.right_ascension.degrees;  // or .hours_format
const dec = icrs_coordinates.declination.degrees;     // or .dms_format

// Distance
const distance_ly = icrs_coordinates.distance.light_years;
const distance_pc = icrs_coordinates.distance.parsecs;

// Motion across sky
const pm_ra = icrs_coordinates.proper_motion.ra;   // mas/year
const pm_dec = icrs_coordinates.proper_motion.dec; // mas/year
```

## 🔍 Common Tasks

### Find nearest planets
```javascript
function findNearest(targetPlanet, allPlanets, count = 5) {
  const target = targetPlanet.characteristics.coordinates_3d;
  
  return allPlanets
    .map(p => {
      const coords = p.characteristics.coordinates_3d;
      const dx = coords.x_light_years - target.x_light_years;
      const dy = coords.y_light_years - target.y_light_years;
      const dz = coords.z_light_years - target.z_light_years;
      return {
        planet: p,
        distance: Math.sqrt(dx*dx + dy*dy + dz*dz)
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
}
```

### Filter by habitability
```javascript
const habitable = planets.filter(p => 
  p.characteristics.habitability_percent > 50 &&
  p.characteristics.toxicity_percent < 50
);
```

### Point telescope to planet
```javascript
function getTelescopeCoords(planet) {
  const icrs = planet.characteristics.icrs_coordinates;
  return {
    ra: icrs.right_ascension.hours_format,
    dec: icrs.declination.dms_format,
    epoch: icrs.epoch
  };
}
```

### Plot in 3D
```javascript
// Three.js example
planets.forEach(planet => {
  const coords = planet.characteristics.coordinates_3d;
  const geometry = new THREE.SphereGeometry(0.1);
  const material = new THREE.MeshBasicMaterial({ 
    color: getColorByHabitability(planet.characteristics.habitability_percent)
  });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(
    coords.x_light_years,
    coords.y_light_years,
    coords.z_light_years
  );
  scene.add(sphere);
});
```

## 📊 Available Fields

```javascript
planet.characteristics = {
  // Classification
  radius_position: "Super-Earth" | "Neptune-like" | "Jupiter-like" | "Sub-Earth",
  atmosphere_type: "Hydrogen-Helium" | "Thin N2/CO2" | ...,
  principal_material: "Rocky (Silicate/Iron)" | "Gaseous (H/He)" | ...,
  
  // Habitability
  toxicity_percent: 0-100,           // Lower is better
  habitability_percent: 0-100,       // Higher is better
  
  // Location
  distance_to_earth_ly: 16.19,
  
  // Moons
  satellites: {
    has_satellites: boolean,
    count: number,
    type: "Estimated"
  },
  
  // Orbit
  orbit_type: "Circular - Habitable Zone",
  
  // 3D Position
  coordinates_3d: {
    x_light_years: 8.5249,
    y_light_years: -6.3332,
    z_light_years: -12.2222,
    x_parsecs: 2.6137,
    y_parsecs: -1.9418,
    z_parsecs: -3.7474,
    system: "Galactic (Earth/Sun centered)"
  },
  
  // Astronomical Coordinates
  icrs_coordinates: {
    right_ascension: {
      degrees: 323.3912616,
      hours_format: "21h33m33.90s"
    },
    declination: {
      degrees: -49.0125169,
      dms_format: "-49d00m45.06s"
    },
    distance: {
      parsecs: 4.9643,
      light_years: 16.1915
    },
    parallax: { value: 201.407 },
    proper_motion: {
      ra: -45.8344,
      dec: -816.604
    },
    epoch: "J2000.0",
    reference_frame: "ICRS"
  }
}
```

## 🔄 Converting Between Systems

Both coordinate systems point to the same object:
- **Cartesian**: Easy math, good for 3D rendering
- **ICRS**: Standard astronomy, good for observations

Convert ICRS → Cartesian:
```javascript
function icrsToCartesian(ra_deg, dec_deg, distance_ly) {
  const ra_rad = ra_deg * Math.PI / 180;
  const dec_rad = dec_deg * Math.PI / 180;
  
  return {
    x: distance_ly * Math.cos(dec_rad) * Math.cos(ra_rad),
    y: distance_ly * Math.cos(dec_rad) * Math.sin(ra_rad),
    z: distance_ly * Math.sin(dec_rad)
  };
}
```

Convert Cartesian → ICRS:
```javascript
function cartesianToICRS(x, y, z) {
  const distance = Math.sqrt(x*x + y*y + z*z);
  const ra_deg = Math.atan2(y, x) * 180 / Math.PI;
  const dec_deg = Math.asin(z / distance) * 180 / Math.PI;
  
  return { ra_deg, dec_deg, distance };
}
```

## 📚 Documentation

- Full docs: `CLUSTER_UPDATE_SUMMARY.md`
- Example script: `example_3d_visualization.py`
- Update script: `update_clusters_with_characteristics.py`

## 🌟 Tips

1. Use Cartesian for: 3D visualization, distance calculations, pathfinding
2. Use ICRS for: Telescope pointing, database lookups, proper motion tracking
3. Both systems are always in sync (same object, different representation)
4. All original NASA data is preserved in the root planet object
