# NASA Exoplanet Data Processing Pipelines

This directory contains the complete data processing pipeline for NASA exoplanet data.

## 📁 Directory Structure

```
pipelines/
├── README.md                    # This file
├── main_pipeline.py             # Main orchestrator script
├── data_processing/             # Data transformation pipelines
│   ├── README.md
│   ├── 01_convert_nasa_data.py      # CSV → JSON conversion
│   ├── 02_cluster_planets.py        # Spatial clustering
│   └── 03_enrich_characteristics.py # Add characteristics & coordinates
└── examples/                    # Usage examples
    ├── README.md
    └── visualize_3d_space.py    # 3D visualization example
```

## 🚀 Quick Start

### Run Full Pipeline
```bash
# From project root
python pipelines/main_pipeline.py --full
```

### Run Individual Steps
```bash
# Step 1: Convert NASA CSV to JSON
python pipelines/main_pipeline.py --step 1

# Step 2: Create spatial clusters
python pipelines/main_pipeline.py --step 2

# Step 3: Enrich with characteristics
python pipelines/main_pipeline.py --step 3
```

### Show Pipeline Info
```bash
python pipelines/main_pipeline.py --info
```

## 📋 Pipeline Steps

### Step 1: Convert NASA Data
**Script:** `01_convert_nasa_data.py`
- **Input:** `nasa_data/nasa_data.csv` (raw NASA Exoplanet Archive CSV)
- **Output:** `nasa_data/nasa_exoplanets_frontend.json`
- **Purpose:** Convert NASA CSV format to clean, frontend-friendly JSON
- **Duration:** ~1-2 minutes
- **Planets processed:** 39,282

### Step 2: Cluster Planets
**Script:** `02_cluster_planets.py`
- **Input:** `nasa_data/nasa_exoplanets_frontend.json`
- **Output:** `nasa_data/clusters/*.json` (17 cluster files)
- **Purpose:** Create spatial clusters based on distance and galactic position
- **Duration:** ~1-2 minutes
- **Clusters created:**
  - `nearby_quad1-4.json` (0-100 light-years)
  - `medium_quad1-4.json` (100-500 light-years)
  - `far_quad1-4.json` (500-2000 light-years)
  - `veryfar_quad1-4.json` (2000+ light-years)
  - `no_position.json` (planets without coordinates)

### Step 3: Enrich Characteristics
**Script:** `03_enrich_characteristics.py`
- **Input:** `nasa_data/clusters/*.json`
- **Output:** Updated cluster files with enriched data
- **Purpose:** Add planet characteristics and dual coordinate systems
- **Duration:** ~1-2 minutes
- **Data added:**
  - Planet characteristics (10 fields)
  - 3D Cartesian coordinates
  - ICRS astronomical coordinates

## 📊 Data Flow

```
NASA CSV Data
    ↓
[Step 1: Convert]
    ↓
Single JSON File (39,282 planets)
    ↓
[Step 2: Cluster]
    ↓
17 Cluster Files (spatially organized)
    ↓
[Step 3: Enrich]
    ↓
Enhanced Cluster Files
(with characteristics + coordinates)
```

## 🎯 Output Features

After running the full pipeline, each planet will have:

### Original NASA Data (preserved)
- All fields from NASA Exoplanet Archive
- Physical properties (mass, radius, density, temperature)
- Orbital parameters (period, eccentricity, semi-major axis)
- Discovery information

### New Characteristics (added)
1. **radius_position** - Size category
2. **atmosphere_type** - Inferred atmosphere
3. **principal_material** - Composition
4. **toxicity_percent** - Human habitability toxicity (0-100%)
5. **habitability_percent** - Colonization potential (0-100%)
6. **distance_to_earth_ly** - Distance in light-years
7. **satellites** - Estimated moon presence
8. **orbit_type** - Orbital characteristics

### Dual Coordinate Systems
9. **coordinates_3d** - Cartesian (x, y, z)
   - In parsecs and light-years
   - Galactic coordinate system
   - Perfect for 3D visualization

10. **icrs_coordinates** - ICRS astronomical
    - Right Ascension & Declination
    - Proper motion
    - Parallax
    - Epoch J2000.0

## 🔧 Requirements

### Python Dependencies
```bash
pip install numpy pandas
```

### Input Data Required
- `nasa_data/nasa_data.csv` - Raw NASA Exoplanet Archive data

## 📖 Usage Examples

### Python Script
```python
from pipelines.data_processing import cluster_planets

# Load enriched clusters
import json
with open('nasa_data/clusters/nearby_quad1.json', 'r') as f:
    planets = json.load(f)

# Access planet data
planet = planets[0]
print(f"Planet: {planet['pl_name']}")
print(f"Habitability: {planet['characteristics']['habitability_percent']}%")
print(f"Position: {planet['characteristics']['coordinates_3d']}")
```

### Command Line
```bash
# Run full pipeline with custom data directory
python pipelines/main_pipeline.py --full --data-dir /path/to/nasa_data

# Run only the enrichment step
python pipelines/main_pipeline.py --step 3
```

## 📝 Notes

- **Reusable**: Each script can be run independently if needed
- **Idempotent**: Running scripts multiple times is safe (overwrites output)
- **No Data Loss**: Original NASA data is always preserved
- **Fast**: Complete pipeline runs in ~3-6 minutes
- **Modular**: Easy to add new processing steps

## 🔄 Updating Data

When NASA releases new exoplanet data:

1. Download new CSV from [NASA Exoplanet Archive](https://exoplanetarchive.ipcc.caltech.edu/)
2. Replace `nasa_data/nasa_data.csv`
3. Run full pipeline: `python pipelines/main_pipeline.py --full`

## 🐛 Troubleshooting

### Pipeline fails at Step 1
- Check that `nasa_data/nasa_data.csv` exists
- Verify CSV is valid NASA Exoplanet Archive format

### Pipeline fails at Step 2
- Ensure Step 1 completed successfully
- Check that `nasa_data/nasa_exoplanets_frontend.json` exists

### Pipeline fails at Step 3
- Ensure Step 2 completed successfully
- Check that `nasa_data/clusters/` directory exists with JSON files

## 📚 Documentation

- **CLUSTER_UPDATE_SUMMARY.md** - Complete field descriptions
- **COORDINATES_QUICK_REFERENCE.md** - Quick reference for coordinates
- **UPDATE_COMPLETE.md** - Summary of latest update

## 🤝 Contributing

To add a new pipeline step:

1. Create `0X_your_step.py` in `data_processing/`
2. Follow the existing script structure
3. Add step to `main_pipeline.py`
4. Update this README

---

**Last Updated:** 2026-01-31  
**Pipeline Version:** 1.0  
**Total Processing Time:** ~3-6 minutes  
**Planets Processed:** 39,282
