# Solar System Dataset

## Overview
This dataset contains our Solar System's 9 major celestial bodies (8 planets + Pluto) with complete astronomical data matching the NASA exoplanet format.

## Files
- **`solar_system.json`** - Standalone Solar System dataset (9 planets)
- **`clusters/solar_system.json`** - Same data in cluster format
- **`clusters/nearby_quad1.json`** - Includes Solar System + 296 nearby exoplanets

## Planets Included
1. **Mercury** - Innermost planet, rocky, no atmosphere
2. **Venus** - Rocky, dense CO2 atmosphere, hottest surface
3. **Earth** - Our home, habitable, N2-O2 atmosphere
4. **Mars** - Red planet, thin CO2 atmosphere, 2 moons
5. **Jupiter** - Gas giant, 95 moons, largest planet
6. **Saturn** - Gas giant with rings, 146 moons
7. **Uranus** - Ice giant, 28 moons, tilted axis
8. **Neptune** - Ice giant, 16 moons, strongest winds
9. **Pluto** - Dwarf planet, 5 moons, highly elliptical orbit

## Data Fields

Each planet includes:
- **Orbital Data**: Period, semi-major axis, eccentricity, inclination
- **Physical Properties**: Radius (Earth radii), mass (Earth masses), temperature
- **Position**: 3D coordinates in heliocentric system (AU)
- **Distance**: From Earth in AU, light-years, and parsecs
- **Characteristics**: 
  - Habitability percentage (0-100)
  - Toxicity percentage (0-100)
  - Radius classification
  - Atmosphere type
  - Primary composition
  - Orbit classification
  - Satellite information (count and major moons)

## Coordinate System

All planets use a **Heliocentric coordinate system** (Sun at origin):
- X-axis: Pointing from Sun through Earth at vernal equinox
- Y-axis: 90° ahead in Earth's orbital plane
- Z-axis: Perpendicular to ecliptic (north)

Positions are simplified to current epoch and assume circular orbits for visualization purposes.

## Distance Scale

```
Mercury:  0.000006 light-years
Venus:    0.000011 light-years
Earth:    0.0 light-years (reference point)
Mars:     0.000024 light-years
Jupiter:  0.000083 light-years
Saturn:   0.000151 light-years
Uranus:   0.000304 light-years
Neptune:  0.000477 light-years
Pluto:    0.000626 light-years

Nearest Exoplanet (Proxima Cen b): 4.24 light-years
```

## Special Features

### Earth
- 100% habitability rating
- Only planet with breathable N2-O2 atmosphere
- Reference point for all coordinate systems

### Gas Giants (Jupiter & Saturn)
- Hydrogen-Helium composition
- Extensive moon systems (95 and 146 respectively)
- Orbiting in the cold zone

### Ice Giants (Uranus & Neptune)
- Hydrogen-Helium-Methane atmospheres
- Ice/rock/gas composition
- Frozen zone orbits

### Pluto
- Dwarf planet classification
- Highly elliptical orbit (e = 0.2488)
- Largest known Kuiper Belt object with moons

## Integration with NASA Exoplanet Data

The Solar System planets are integrated into:
1. **nearby_quad1.json** - Placed at the beginning as the closest reference
2. **solar_system.json** - Standalone cluster for easy access
3. **cluster_index.json** - Registered as 18th cluster

## Usage in 3D Application

```javascript
// Load Solar System separately
const solarSystem = await fetch('nasa_data/solar_system.json').then(r => r.json());

// Or load as part of nearby cluster
const nearby = await fetch('nasa_data/clusters/nearby_quad1.json').then(r => r.json());
const solarSystemPlanets = nearby.slice(0, 9);

// Filter by hostname
const localPlanets = nearby.filter(p => p.hostname === 'Sun');
```

## Visualization Tips

1. **Scale Adjustment**: Solar System planets are EXTREMELY close compared to exoplanets
   - Use logarithmic scale for distance
   - Or create separate "local" view with linear scale

2. **Highlighting**: Mark Solar System planets distinctly
   - Different color scheme
   - Special markers/icons
   - Label always visible

3. **Camera Starting Point**: Start at Earth (0, 0, 0) looking outward

4. **Progressive Loading**: Load Solar System first as reference frame

## Data Sources

- Orbital parameters: NASA JPL Horizons System
- Physical properties: IAU planetary fact sheets
- Satellite counts: As of 2026 confirmed moons
- Discovery years: Historical records

## Notes

- All values are in standard astronomical units
- Earth is used as reference (radius = 1.0, mass = 1.0)
- sy_dist (system distance) = 0.000004848 parsecs (approximately 1 AU in parsecs)
- Positions are simplified for visualization (not real-time ephemeris)
- Satellite counts include all confirmed moons as of 2026
