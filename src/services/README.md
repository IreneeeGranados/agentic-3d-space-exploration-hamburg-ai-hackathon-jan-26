# Frontend Planet Service

## Overview
Efficient planet data management and AI description generation for the frontend Three.js application.

## Features
✅ **Batch Loading** - Load all planets at once efficiently  
✅ **Smart Caching** - Avoid redundant API calls  
✅ **Rate Limit Protection** - Process in batches with delays  
✅ **Preloading** - Background loading while user explores  
✅ **Fallback Support** - Graceful degradation without API key  
✅ **Browser Compatible** - Works with Vite and ES modules  

## Quick Start

### 1. Initialize on App Startup

```javascript
import { planetService } from './services/FrontendPlanetService.js';
import { PLANETS_DATA } from './config/planets.js';

// In your main.js or App initialization
async function init() {
    // Initialize with API key
    planetService
        .init(import.meta.env.VITE_OPENAI_API_KEY)
        .loadPlanets(PLANETS_DATA);
    
    // Preload all descriptions (non-blocking)
    planetService.preloadDescriptions();
}
```

### 2. Use When Planet is Clicked

```javascript
async function onPlanetClick(planet) {
    // Get description (instant if preloaded)
    const description = await planetService.getDescription(planet.config);
    
    // Display in UI
    document.getElementById('info').textContent = description;
}
```

## API Reference

### Initialization

```javascript
// Initialize with API key
planetService.init(apiKey)

// Load planet data
planetService.loadPlanets(planetsArray)

// Configure behavior
planetService.configure({
    batchSize: 3,          // Planets per batch
    batchDelay: 1000,      // Milliseconds between batches
    enablePreload: true    // Auto-preload on load
})
```

### Getting Descriptions

```javascript
// Get single planet description (cached or fetch)
const description = await planetService.getDescription('Mars');
// or
const description = await planetService.getDescription(planetObject);

// Preload all descriptions in background
const results = await planetService.preloadDescriptions();
// Returns: { success: 5, failed: 0, cached: 3, total: 8 }
```

### Data Access

```javascript
// Get all planets with their descriptions
const planets = planetService.getAllPlanetsData();
// Returns array of: { ...planetData, aiDescription, hasDescription }

// Get statistics
const stats = planetService.getStats();
// Returns: { totalPlanets, cachedDescriptions, cacheRate, planetsWithDescriptions }
```

### Utility Methods

```javascript
// Clear all cached descriptions
planetService.clearCache();

// Check if initialized
if (planetService.isInitialized) { ... }
```

## Configuration Options

```javascript
planetService.configure({
    apiKey: 'your-key',           // OpenAI API key
    model: 'gpt-3.5-turbo',       // Model to use
    temperature: 0.7,              // Creativity (0.0-1.0)
    max_tokens: 250,               // Max description length
    batchSize: 3,                  // Batch size for preload
    batchDelay: 1000,              // Delay between batches (ms)
    enablePreload: true            // Auto-preload on init
});
```

## Integration Examples

### Example 1: Basic Integration

```javascript
import { planetService } from './services/FrontendPlanetService.js';
import { PLANETS_DATA } from './config/planets.js';

// On app start
planetService
    .init(import.meta.env.VITE_OPENAI_API_KEY)
    .loadPlanets(PLANETS_DATA);

// Start preloading
await planetService.preloadDescriptions();
console.log('All descriptions ready!');
```

### Example 2: With Three.js Planet Click

```javascript
async function handlePlanetClick(planetMesh) {
    const planetData = planetMesh.userData.data;
    
    // Show loading state
    showLoading();
    
    try {
        // Get description (fast if preloaded)
        const description = await planetService.getDescription(planetData);
        
        // Update UI
        document.getElementById('planet-name').textContent = planetData.name;
        document.getElementById('planet-desc').textContent = description;
    } catch (error) {
        showError('Failed to load planet description');
    }
}
```

### Example 3: Render All Planets at Once

```javascript
function renderAllPlanets() {
    const allPlanets = planetService.getAllPlanetsData();
    
    allPlanets.forEach(planetData => {
        // Create Three.js planet
        const planet = new Planet(planetData);
        scene.add(planet.group);
        
        // Add click handler
        planet.mesh.onClick = () => {
            displayDescription(planetData.name);
        };
        
        // Show indicator if description is ready
        if (planetData.hasDescription) {
            planet.addReadyBadge();
        }
    });
}
```

### Example 4: Progress Tracking

```javascript
async function loadWithProgress() {
    const planets = PLANETS_DATA;
    const progressBar = document.getElementById('progress');
    
    let loaded = 0;
    
    // Load planets one by one with progress
    for (const planet of planets) {
        await planetService.getDescription(planet);
        loaded++;
        
        const percent = (loaded / planets.length) * 100;
        progressBar.style.width = `${percent}%`;
        console.log(`Loaded ${loaded}/${planets.length}`);
    }
    
    console.log('All planets loaded!');
}
```

### Example 5: Event-Driven Updates

```javascript
// Listen for preload completion
window.addEventListener('planets-loaded', () => {
    console.log('All descriptions ready!');
    updatePlanetList(); // Refresh UI
});

// Trigger preload
planetService.preloadDescriptions().then(results => {
    if (results.success + results.cached === results.total) {
        window.dispatchEvent(new Event('planets-loaded'));
    }
});
```

## Performance Tips

1. **Preload Early**: Call `preloadDescriptions()` during app initialization
2. **Batch Size**: Adjust `batchSize` based on your rate limits (default: 3)
3. **Cache First**: Always check cache before fetching new descriptions
4. **Fallback Ready**: Service provides fallback descriptions if API fails

## Error Handling

The service handles errors gracefully:
- No API key → Uses fallback descriptions
- API rate limit → Respects batch delays
- Network error → Returns fallback for that planet
- Invalid response → Logs error and uses fallback

## Debugging

```javascript
// Check stats
console.log(planetService.getStats());

// Check specific planet
const hasMars = planetService.planetsData.has('Mars');
const marsDesc = planetService.descriptionCache.get('Mars');

// Monitor preload
const results = await planetService.preloadDescriptions();
console.log('Success:', results.success);
console.log('Failed:', results.failed);
console.log('Cached:', results.cached);
```

## Complete Integration Example

See `planetServiceIntegration.example.js` for a complete working example with:
- App initialization
- Three.js integration
- UI updates
- Event handling
- Progress tracking
- Error handling

## Environment Setup

Make sure your `.env` file contains:
```env
VITE_OPENAI_API_KEY=your-openai-api-key-here
```

## Next Steps

1. Import the service in your `main.js`
2. Initialize on app startup
3. Load planet data
4. Start preloading (optional but recommended)
5. Use `getDescription()` when user interacts with planets
