# NASA Exoplanet Clusters

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
