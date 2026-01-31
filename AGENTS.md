# Custom Agents

## Hackathon Agent

**Description**: Expert in building modular Three.js 3D space applications with well-organized, maintainable code following industry best practices.

**Specialization**: 
- Three.js scene architecture and design patterns
- Modular 3D application structure
- Planet rendering and celestial body visualization
- Performance optimization for 3D web applications
- Clean code organization and separation of concerns

**Use for**:
- Building and refactoring the 3D space application
- Creating modular components for planets, cameras, lighting, and controls
- Implementing Three.js best practices and common patterns
- Organizing code into maintainable modules
- Setting up proper scene management and render loops
- Creating reusable classes for celestial objects

**Guidelines**:
1. **Modular Architecture**:
   - Separate concerns: scene setup, objects, lighting, camera, controls, rendering
   - Use ES6 classes for reusable components (e.g., Planet, StarField, Camera)
   - Keep each module focused on a single responsibility
   - Create dedicated files for different entity types

2. **Three.js Best Practices**:
   - Initialize scene, camera, and renderer in a clear setup flow
   - Use proper geometry disposal to prevent memory leaks
   - Implement efficient animation loops with requestAnimationFrame
   - Leverage Three.js built-in helpers and utilities
   - Use appropriate materials and lighting for visual quality

3. **Code Organization**:
   - `/src/core/` - Core Three.js setup (Scene, Renderer, Camera)
   - `/src/objects/` - 3D object classes (Planet, Star, etc.)
   - `/src/utils/` - Helper functions and utilities
   - `/src/controls/` - User interaction and camera controls
   - `/src/config/` - Configuration constants and data

4. **Maintainability**:
   - Use clear, descriptive naming conventions
   - Add comments for complex Three.js concepts
   - Make components configurable via constructor parameters
   - Avoid hardcoded values; use configuration objects
   - Keep functions small and focused

5. **Planet Rendering Requirements**:
   - Create a reusable Planet class with customizable properties
   - Support texture mapping for realistic surfaces
   - Enable orbit animations and rotations
   - Make size, position, and appearance configurable
   - Optimize geometry based on viewing distance

**Example Structure**:
```
project/
├── index.html
├── main.js              # Entry point
├── style.css
├── src/
│   ├── core/
│   │   ├── Scene.js     # Scene setup
│   │   ├── Camera.js    # Camera configuration
│   │   └── Renderer.js  # Renderer setup
│   ├── objects/
│   │   ├── Planet.js    # Planet class
│   │   ├── Star.js      # Star/sun class
│   │   └── StarField.js # Background stars
│   ├── controls/
│   │   └── OrbitControls.js
│   ├── utils/
│   │   └── helpers.js
│   └── config/
│       └── planets.js   # Planet data
```

**Data & AI Integration Requirements**:
- **Dataset Integration**: The application integrates with NASA exoplanet datasets (JSON format) containing astronomical data (RA, Dec, distance, composition, physical properties)
- **Data Pipeline**: Understand the 3-step data processing pipeline in `pipelines/` directory
- **OpenAI Integration**: Prepare for AI-powered features (planet descriptions, Q&A about celestial bodies, natural language queries)
- **Eleven Labs Integration**: Prepare for text-to-speech capabilities (narration, audio tours, voice-guided exploration)
- Design data layer to be easily extensible for AI service calls
- Keep API integration modular and separate from core 3D rendering logic

**Data Processing Pipeline Knowledge**:
The project uses a structured 3-step pipeline in `pipelines/` directory:

1. **Step 1: Convert NASA Data** (`pipelines/data_processing/01_convert_nasa_data.py`)
   - Converts raw NASA Exoplanet Archive CSV to clean JSON
   - Input: `nasa_data/nasa_data.csv`
   - Output: `nasa_data/nasa_exoplanets_frontend.json`
   - Processes 39,282 planets

2. **Step 2: Cluster Planets** (`pipelines/data_processing/02_cluster_planets.py`)
   - Creates 17 spatial clusters for progressive loading
   - Organizes planets by distance (nearby/medium/far/veryfar) and galactic quadrant
   - Output: `nasa_data/clusters/*.json` (17 files)
   - Enables efficient 3D rendering of large datasets

3. **Step 3: Enrich Characteristics** (`pipelines/data_processing/03_enrich_characteristics.py`)
   - Adds 10 enriched fields to each planet
   - Includes dual coordinate systems (Cartesian + ICRS)
   - Adds habitability scores, atmosphere types, toxicity levels
   - Preserves all original NASA data

**Running the Pipeline**:
```bash
# Run full pipeline
python pipelines/main_pipeline.py --full

# Run individual step
python pipelines/main_pipeline.py --step 3

# Show pipeline info
python pipelines/main_pipeline.py --info
```

**Data Structure in Frontend**:
```javascript
const planet = {
  // Original NASA data (all preserved)
  pl_name: "GJ 832 b",
  pl_rade: 2.847,    // radius in Earth radii
  sy_dist: 14.6427,  // distance in parsecs
  
  // Enriched characteristics
  characteristics: {
    // Habitability
    habitability_percent: 65,  // 0-100
    toxicity_percent: 50,      // 0-100
    
    // Classification
    radius_position: "Neptune-like",
    atmosphere_type: "Hydrogen-Helium-Methane",
    principal_material: "Gas (H/He/CH4)",
    orbit_type: "Circular - Hot Zone",
    satellites: { has_satellites: false, count: 0 },
    
    // Dual Coordinate Systems
    coordinates_3d: {
      x_light_years: 8.5249,
      y_light_years: -6.3332,
      z_light_years: -12.2222,
      system: "Galactic (Earth/Sun centered)"
    },
    icrs_coordinates: {
      right_ascension: { degrees: 323.39, hours_format: "21h33m33.90s" },
      declination: { degrees: -49.01, dms_format: "-49d00m45.06s" },
      parallax: { value: 201.407 },
      proper_motion: { ra: -45.83, dec: -816.60 }
    }
  }
};
```

**Key Features for 3D Application**:
- **Progressive Loading**: Load nearby clusters first, then load distant ones on-demand
- **3D Coordinates**: Use `coordinates_3d` for Three.js positioning
- **Distance Calculations**: Calculate routes between planets using Cartesian math
- **Filtering**: Filter by habitability_percent, toxicity_percent, or planet type
- **Telescope Pointing**: Use `icrs_coordinates` for accurate astronomical references
- **Spatial Clustering**: 17 pre-organized clusters optimize rendering performance

**Cluster Loading Strategy**:
```javascript
// Load in order of proximity to user's view
1. Load nearby_quad1.json (closest planets)
2. Load adjacent nearby quadrants (nearby_quad2-4)
3. Preload medium quadrants as user explores
4. Load far/veryfar clusters on demand
```

**Documentation References**:
- `pipelines/README.md` - Complete pipeline documentation
- `CLUSTER_UPDATE_SUMMARY.md` - Detailed field descriptions
- `COORDINATES_QUICK_REFERENCE.md` - Coordinate system guide
- `UPDATE_COMPLETE.md` - Latest update summary

**When making changes**:
- Ensure all code follows the modular pattern
- Verify Three.js objects are properly initialized and disposed
- Test that animations run smoothly
- Confirm code is readable and well-documented
- Maintain separation between setup, update, and render logic
- Keep data loading and AI service integration separate from rendering code
