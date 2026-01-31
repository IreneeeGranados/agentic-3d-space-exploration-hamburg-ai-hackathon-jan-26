# Pipeline Examples

This directory contains example scripts demonstrating how to use the processed NASA data.

## visualize_3d_space.py

Demonstrates 3D visualization and distance calculations using the enriched cluster data.

### Features

- Load cluster data
- Access 3D coordinates and characteristics
- Calculate distances between planets
- Find nearest neighbors
- Filter by habitability
- Analyze spatial distribution

### Usage

```bash
python pipelines/examples/visualize_3d_space.py
```

### Examples Included

#### 1. Display Planets with 3D Coordinates
Shows the first 5 planets with their position in space and characteristics.

#### 2. Find Nearest Neighbors
Given a target planet, finds the 5 closest neighboring planets.

#### 3. Habitable Planets Within Radius
Filters planets within 50 light-years and sorts by habitability.

#### 4. Spatial Distribution Analysis
Calculates the bounding box and average distance of all planets in a cluster.

### Code Examples

```python
import json

# Load a cluster
with open('nasa_data/clusters/nearby_quad1.json', 'r') as f:
    planets = json.load(f)

# Access planet characteristics
planet = planets[0]
characteristics = planet['characteristics']

# Get 3D position
coords = characteristics['coordinates_3d']
x = coords['x_light_years']
y = coords['y_light_years']
z = coords['z_light_years']

# Get ICRS coordinates
icrs = characteristics['icrs_coordinates']
ra = icrs['right_ascension']['hours_format']
dec = icrs['declination']['dms_format']

# Get habitability
habitability = characteristics['habitability_percent']

# Calculate distance from Earth
import math
distance = math.sqrt(x**2 + y**2 + z**2)
```

## Creating Your Own Examples

Template structure for new examples:

```python
"""
Your Example Title
Brief description of what this example demonstrates
"""

import json
import os

# Load cluster data
CLUSTER_PATH = '../../nasa_data/clusters/nearby_quad1.json'

def load_planets():
    """Load planet data from cluster file."""
    with open(CLUSTER_PATH, 'r') as f:
        return json.load(f)

def your_analysis(planets):
    """Your analysis function."""
    # Your code here
    pass

def main():
    """Main entry point."""
    print("Your Example")
    print("=" * 70)
    
    planets = load_planets()
    your_analysis(planets)

if __name__ == "__main__":
    main()
```

## Available Data Fields

Each planet object contains:

### Original NASA Data
- Physical properties (mass, radius, density, temperature)
- Orbital parameters (period, eccentricity, semi-major axis)
- Discovery information
- Stellar properties

### Enriched Characteristics
```python
characteristics = {
    'radius_position': str,           # Size category
    'atmosphere_type': str,           # Atmosphere composition
    'principal_material': str,        # Primary material
    'toxicity_percent': int,          # 0-100
    'habitability_percent': int,      # 0-100
    'distance_to_earth_ly': float,    # Light-years
    'satellites': dict,               # Moon estimates
    'orbit_type': str,                # Orbital characteristics
    'coordinates_3d': dict,           # Cartesian coordinates
    'icrs_coordinates': dict          # ICRS coordinates
}
```

## Use Cases

These examples demonstrate:

1. **3D Visualization** - Plot planets in 3D space
2. **Distance Calculations** - Calculate distances between any two planets
3. **Nearest Neighbor Search** - Find closest planets to a target
4. **Habitability Analysis** - Filter and rank by colonization potential
5. **Spatial Distribution** - Analyze galactic spread
6. **Coordinate Conversion** - Work with both Cartesian and ICRS systems

## Dependencies

```bash
pip install json  # Built-in
pip install math  # Built-in
```

No additional dependencies required for basic examples.

For advanced visualization:
```bash
pip install matplotlib  # For 2D plots
pip install plotly      # For interactive 3D plots
```

## Running Examples

```bash
# From project root
python pipelines/examples/visualize_3d_space.py

# Or directly
cd pipelines/examples
python visualize_3d_space.py
```

## Adding New Examples

1. Create a new `.py` file in this directory
2. Follow the template structure above
3. Document your example in this README
4. Test with actual cluster data

---

For more information, see:
- `../../CLUSTER_UPDATE_SUMMARY.md` - Complete data documentation
- `../../COORDINATES_QUICK_REFERENCE.md` - Coordinate system guide
- `../data_processing/README.md` - Pipeline documentation
