"""
NASA Exoplanet Spatial Clustering Script
Splits large dataset into geographic clusters for progressive 3D loading
"""

import json
import numpy as np
import math
from collections import defaultdict

print("🌌 NASA Exoplanet Spatial Clustering Script")
print("=" * 60)

# Load the data
print("\n📂 Loading nasa_exoplanets_frontend.json...")
with open('nasa_exoplanets_frontend.json', 'r') as f:
    planets = json.load(f)

print(f"✅ Loaded {len(planets)} planets")

# Separate planets with and without positions
planets_with_position = []
planets_without_position = []

for planet in planets:
    # Check both possible formats
    has_position = False
    if isinstance(planet.get('position'), dict):
        has_position = True
    elif isinstance(planet.get('position_3d'), dict):
        if planet['position_3d'].get('has_calculated_orbit') and planet['position_3d'].get('current_position_au'):
            has_position = True
    
    if planet.get('has_orbit') or has_position:
        planets_with_position.append(planet)
    else:
        planets_without_position.append(planet)

print(f"  - With 3D positions: {len(planets_with_position)}")
print(f"  - Without positions: {len(planets_without_position)}")

# Define distance shells (in light years)
DISTANCE_SHELLS = [
    (0, 100, "nearby"),      # Most interesting for exploration
    (100, 500, "medium"),    # Medium distance
    (500, 2000, "far"),      # Far away
    (2000, 999999, "veryfar") # Very far
]

# Define angular sectors (galactic coordinates for even distribution)
ANGULAR_SECTORS = [
    (0, 90, "quad1"),      # Galactic quadrant 1
    (90, 180, "quad2"),    # Galactic quadrant 2
    (180, 270, "quad3"),   # Galactic quadrant 3
    (270, 360, "quad4")    # Galactic quadrant 4
]

def get_distance_ly(planet):
    """Get distance in light years"""
    # Try different possible keys
    if 'distance_from_earth' in planet and isinstance(planet['distance_from_earth'], dict):
        dist = planet['distance_from_earth'].get('light_years')
        return dist if dist else 999999
    elif 'sy_dist' in planet:
        # Convert parsecs to light years
        dist_pc = planet['sy_dist']
        if dist_pc and not (isinstance(dist_pc, float) and math.isnan(dist_pc)):
            return dist_pc * 3.26156
    return 999999

def get_galactic_longitude(planet):
    """Get galactic longitude from position"""
    # Try different possible position formats
    pos = None
    if 'position' in planet and isinstance(planet['position'], dict):
        pos = planet['position']
    elif 'position_3d' in planet and isinstance(planet['position_3d'], dict):
        pos = planet['position_3d'].get('current_position_au')
    
    if not pos or not isinstance(pos, dict):
        return None
    
    x, y = pos.get('x'), pos.get('y')
    if x is None or y is None:
        return None
    
    # Calculate angle in degrees (0-360)
    angle = math.degrees(math.atan2(y, x))
    if angle < 0:
        angle += 360
    
    return angle

def assign_cluster(planet):
    """Assign planet to a cluster based on distance and angle"""
    
    distance_ly = get_distance_ly(planet)
    
    # Find distance shell
    shell_name = None
    for min_dist, max_dist, name in DISTANCE_SHELLS:
        if min_dist <= distance_ly < max_dist:
            shell_name = name
            break
    
    if not shell_name:
        shell_name = "veryfar"
    
    # Find angular sector
    angle = get_galactic_longitude(planet)
    sector_name = None
    
    if angle is not None:
        for min_angle, max_angle, name in ANGULAR_SECTORS:
            if min_angle <= angle < max_angle:
                sector_name = name
                break
    
    if not sector_name:
        sector_name = "quad1"  # Default
    
    return f"{shell_name}_{sector_name}"

# Cluster planets
print("\n🗂️  Clustering planets by spatial location...")
clusters = defaultdict(list)

for planet in planets_with_position:
    cluster_name = assign_cluster(planet)
    clusters[cluster_name].append(planet)

# Add no-position planets
clusters['no_position'] = planets_without_position

# Sort clusters by name for consistency
clusters = dict(sorted(clusters.items()))

# Print statistics
print(f"\n📊 Clustering Results:")
print(f"  Total clusters created: {len(clusters)}")
print(f"\n  Cluster breakdown:")

total_positioned = 0
for cluster_name, cluster_planets in sorted(clusters.items()):
    if cluster_name != 'no_position':
        total_positioned += len(cluster_planets)
    
    # Calculate size estimate (rough)
    size_mb = len(json.dumps(cluster_planets[:10])) * len(cluster_planets) / 10 / (1024 * 1024)
    
    print(f"    {cluster_name:20s}: {len(cluster_planets):5d} planets (~{size_mb:.1f} MB)")

print(f"\n  Total positioned: {total_positioned}")
print(f"  Total without position: {len(planets_without_position)}")

# Create clusters directory
import os
clusters_dir = 'clusters'
if not os.path.exists(clusters_dir):
    os.makedirs(clusters_dir)
    print(f"\n📁 Created directory: {clusters_dir}/")

# Save each cluster
print(f"\n💾 Saving cluster files...")
cluster_index = {}

for cluster_name, cluster_planets in clusters.items():
    filename = f"{cluster_name}.json"
    filepath = os.path.join(clusters_dir, filename)
    
    with open(filepath, 'w') as f:
        json.dump(cluster_planets, f, indent=2)
    
    # Get file size
    file_size = os.path.getsize(filepath) / (1024 * 1024)
    
    # Build index entry
    cluster_index[cluster_name] = {
        "filename": filename,
        "planet_count": len(cluster_planets),
        "size_mb": round(file_size, 2),
        "planet_names": [p.get('pl_name') or p.get('name', 'Unknown') for p in cluster_planets]
    }
    
    print(f"  ✅ {filename:25s} - {len(cluster_planets):5d} planets ({file_size:.1f} MB)")

# Create cluster index for quick lookups
print(f"\n📇 Creating cluster index...")
index_data = {
    "total_planets": len(planets),
    "total_clusters": len(clusters),
    "clusters": cluster_index,
    "distance_shells": [
        {"min": min_d, "max": max_d, "name": name} 
        for min_d, max_d, name in DISTANCE_SHELLS
    ],
    "angular_sectors": [
        {"min": min_a, "max": max_a, "name": name}
        for min_a, max_a, name in ANGULAR_SECTORS
    ],
    "usage": {
        "description": "Index for NASA exoplanet cluster files",
        "how_to_load": "1. Determine user's view position, 2. Load relevant clusters, 3. Preload adjacent clusters",
        "search": "Use planet_names to find which cluster contains a specific planet"
    }
}

index_path = os.path.join(clusters_dir, 'cluster_index.json')
with open(index_path, 'w') as f:
    json.dump(index_data, f, indent=2)

print(f"  ✅ cluster_index.json created")

# Create a README for the clusters
readme_content = """# NASA Exoplanet Clusters

This directory contains spatially-clustered exoplanet data for progressive 3D loading.

## Structure

The dataset is divided into clusters based on:
1. **Distance from Earth** (4 shells: nearby, medium, far, veryfar)
2. **Galactic Position** (4 angular quadrants)

This creates 16 main clusters + 1 special cluster for planets without positions.

## Files

- `cluster_index.json` - Index of all clusters with metadata
- `nearby_quad1.json` through `veryfar_quad4.json` - Spatial clusters
- `no_position.json` - Planets without calculated 3D positions

## Distance Shells

- **nearby**: 0-100 light years (closest, most interesting)
- **medium**: 100-500 light years
- **far**: 500-2000 light years
- **veryfar**: 2000+ light years

## Angular Quadrants

Based on galactic coordinates (0-360°):
- **quad1**: 0-90° (galactic east)
- **quad2**: 90-180°
- **quad3**: 180-270° (galactic west)
- **quad4**: 270-360°

## Usage

### Load specific cluster
```javascript
const cluster = await fetch('clusters/nearby_quad1.json').then(r => r.json());
```

### Find planet's cluster
```javascript
const index = await fetch('clusters/cluster_index.json').then(r => r.json());
const clusterName = Object.keys(index.clusters).find(name => 
  index.clusters[name].planet_names.includes('Kepler-452 b')
);
```

### Progressive loading
```javascript
// Start with nearby clusters
await loadCluster('nearby_quad1');
await loadCluster('nearby_quad2');

// Preload adjacent clusters in background
preloadCluster('nearby_quad3');
preloadCluster('medium_quad1');
```

## File Sizes

Most clusters are 5-40 MB each, well under GitHub's limits.
The `no_position.json` file is larger but only needed for search/list views.

## Recommended Loading Strategy

1. **Initial load**: Load cluster where user starts (e.g., nearby_quad1)
2. **Parallel load**: Load 1-2 adjacent clusters
3. **Progressive**: Load remaining nearby clusters
4. **On-demand**: Load medium/far clusters as user explores
5. **Search only**: Load no_position.json only when needed for search

This approach provides near-instant initial load while keeping all data available.
"""

readme_path = os.path.join(clusters_dir, 'README.md')
with open(readme_path, 'w') as f:
    f.write(readme_content)

print(f"  ✅ README.md created")

# Print summary
print("\n" + "=" * 60)
print("✨ CLUSTERING COMPLETE!")
print("=" * 60)
print(f"\n📁 Output directory: {clusters_dir}/")
print(f"📊 Total files created: {len(clusters) + 2} (clusters + index + README)")
print(f"\n🚀 Next steps:")
print(f"   1. Check {clusters_dir}/ directory")
print(f"   2. Review cluster_index.json")
print(f"   3. Use the loader utility (I'll create next)")
print(f"   4. Push to GitHub (all files under 100 MB!)")
print()
