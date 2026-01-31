# Data Processing Pipelines

This directory contains the sequential data processing steps for NASA exoplanet data.

## Scripts

### 01_convert_nasa_data.py
Converts raw NASA Exoplanet Archive CSV to frontend-friendly JSON format.

**Input:**
- `nasa_data/nasa_data.csv` - Raw CSV from NASA

**Output:**
- `nasa_data/nasa_exoplanets_frontend.json` - Clean JSON format

**What it does:**
- Parses NASA CSV format
- Cleans and validates data
- Converts to structured JSON
- Handles missing values

**Run:**
```bash
cd nasa_data
python convert_nasa.py
# or from project root:
python pipelines/data_processing/01_convert_nasa_data.py
```

---

### 02_cluster_planets.py
Creates spatial clusters for progressive loading and performance optimization.

**Input:**
- `nasa_data/nasa_exoplanets_frontend.json`

**Output:**
- `nasa_data/clusters/nearby_quad1-4.json` (793 planets)
- `nasa_data/clusters/medium_quad1-4.json` (2,283 planets)
- `nasa_data/clusters/far_quad1-4.json` (6,123 planets)
- `nasa_data/clusters/veryfar_quad1-4.json` (9,386 planets)
- `nasa_data/clusters/no_position.json` (20,697 planets)
- `nasa_data/clusters/cluster_index.json` (metadata)

**What it does:**
- Divides planets into distance shells (0-100, 100-500, 500-2000, 2000+ light-years)
- Subdivides each shell into 4 galactic quadrants
- Creates 17 optimized cluster files
- Generates cluster index for fast lookups

**Run:**
```bash
cd nasa_data
python cluster_planets.py
# or from project root:
python pipelines/data_processing/02_cluster_planets.py
```

---

### 03_enrich_characteristics.py
Adds comprehensive planet characteristics and dual coordinate systems.

**Input:**
- `nasa_data/clusters/*.json` (all cluster files)

**Output:**
- Updated cluster files with enriched data

**What it adds:**

**Planet Characteristics (8 fields):**
1. `radius_position` - Size category
2. `atmosphere_type` - Inferred atmosphere
3. `principal_material` - Composition
4. `toxicity_percent` - Human toxicity (0-100%)
5. `habitability_percent` - Colonization potential (0-100%)
6. `distance_to_earth_ly` - Distance in light-years
7. `satellites` - Moon estimates
8. `orbit_type` - Orbital characteristics

**Coordinate Systems (2 systems):**
9. `coordinates_3d` - Cartesian coordinates
   - x, y, z in parsecs and light-years
   - Galactic coordinate system
   - Earth-centered

10. `icrs_coordinates` - ICRS astronomical coordinates
    - Right Ascension & Declination
    - Proper motion
    - Parallax
    - Epoch J2000.0

**Run:**
```bash
python update_clusters_with_characteristics.py
# or from project root:
python pipelines/data_processing/03_enrich_characteristics.py
```

---

## Running the Pipelines

### Individual Steps
```bash
# Step 1
python pipelines/data_processing/01_convert_nasa_data.py

# Step 2
python pipelines/data_processing/02_cluster_planets.py

# Step 3
python pipelines/data_processing/03_enrich_characteristics.py
```

### Using the Orchestrator
```bash
# Run all steps
python pipelines/main_pipeline.py --full

# Run specific step
python pipelines/main_pipeline.py --step 3
```

## Dependencies

```bash
pip install numpy pandas
```

## Output Structure

After running all steps:

```json
{
  "pl_name": "GJ 832 b",
  "pl_rade": 2.847086,
  "pl_masse": 6.261251,
  "sy_dist": 14.6427,
  "ra": 323.3912616,
  "dec": -49.0125169,
  "...": "...all original NASA data...",
  "characteristics": {
    "radius_position": "Neptune-like",
    "atmosphere_type": "Hydrogen-Helium-Methane",
    "principal_material": "Gas (H/He/CH4)",
    "toxicity_percent": 80,
    "habitability_percent": 0,
    "distance_to_earth_ly": 47.76,
    "satellites": {
      "has_satellites": false,
      "count": 0
    },
    "orbit_type": "Unknown - Hot Zone",
    "coordinates_3d": {
      "x_light_years": 8.5249,
      "y_light_years": -6.3332,
      "z_light_years": -12.2222,
      "system": "Galactic (Earth/Sun centered)"
    },
    "icrs_coordinates": {
      "right_ascension": {
        "degrees": 323.3912616,
        "hours_format": "21h33m33.90s"
      },
      "declination": {
        "degrees": -49.0125169,
        "dms_format": "-49d00m45.06s"
      },
      "parallax": { "value": 201.407 }
    }
  }
}
```

## Notes

- Each script is designed to be run independently
- Scripts are idempotent (safe to run multiple times)
- All original NASA data is preserved
- Total processing time: ~3-6 minutes
