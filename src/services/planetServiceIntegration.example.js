/**
 * Example: Integrating FrontendPlanetService with Three.js Application
 * 
 * This shows how to efficiently load and display AI descriptions for all planets
 */

import { planetService } from './services/FrontendPlanetService.js';

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the planet service on app startup
 */
export async function initializePlanetService() {
    console.log('🚀 Initializing Planet Service...');
    
    // 1. Initialize with API key from environment
    planetService.init(import.meta.env.VITE_OPENAI_API_KEY);
    
    // 2. Load planet data from NASA clusters
    await planetService.loadNasaData();
    
    // 3. Optional: Configure behavior
    planetService.configure({
        batchSize: 3,          // Process 3 at a time
        batchDelay: 1000,      // 1 second between batches
        enablePreload: true    // Auto-preload descriptions
    });
    
    // 4. Preload all descriptions (non-blocking)
    // This happens in background while user explores
    planetService.preloadDescriptions()
        .then(results => {
            console.log('✅ Preload results:', results);
            
            // Optional: Trigger UI update when all loaded
            if (results.success + results.cached === results.total) {
                console.log('🎉 All planet descriptions ready!');
                dispatchEvent(new CustomEvent('planets-loaded'));
            }
        })
        .catch(error => {
            console.error('❌ Preload error:', error);
        });
    
    return planetService;
}

// ============================================================================
// USAGE IN THREE.JS
// ============================================================================

/**
 * Example: When user clicks on a planet
 */
export async function onPlanetClick(planetObject) {
    const planetData = planetObject.config || planetObject.userData?.data;
    
    if (!planetData) {
        console.error('No planet data found');
        return;
    }
    
    console.log(`🌍 User clicked: ${planetData.name}`);
    
    try {
        // Show loading state
        showLoadingUI(planetData.name);
        
        // Get description (cached or fetch)
        // This is very fast if already preloaded
        const description = await planetService.getDescription(planetData);
        
        // Display in UI
        displayPlanetInfo(planetData, description);
        
    } catch (error) {
        console.error('Error displaying planet:', error);
        displayError(planetData.name);
    }
}

/**
 * Example: Render all planets with their data
 */
export function renderAllPlanets(scene) {
    // Get all planets with their descriptions
    const planetsWithData = planetService.getAllPlanetsData();
    
    console.log(`🎨 Rendering ${planetsWithData.length} planets...`);
    
    const planetObjects = planetsWithData.map(planetData => {
        // Create Three.js planet object
        const planet = createPlanetMesh(planetData);
        
        // Store reference to description
        planet.userData.aiDescription = planetData.aiDescription;
        planet.userData.hasDescription = planetData.hasDescription;
        
        // Add to scene
        scene.add(planet);
        
        return planet;
    });
    
    return planetObjects;
}

/**
 * Example: Display planet list in UI
 */
export function displayPlanetList() {
    const planetsData = planetService.getAllPlanetsData();
    const listContainer = document.getElementById('planet-list');
    
    if (!listContainer) return;
    
    listContainer.innerHTML = planetsData.map(planet => `
        <div class="planet-item" data-planet="${planet.name}">
            <h3>${planet.name}</h3>
            <p>${planet.description}</p>
            ${planet.hasDescription 
                ? '<span class="badge">AI Ready ✨</span>' 
                : '<span class="badge loading">Loading...</span>'
            }
        </div>
    `).join('');
}

/**
 * Example: Show statistics in debug panel
 */
export function displayStats() {
    const stats = planetService.getStats();
    console.log('📊 Planet Service Stats:', stats);
    
    const statsPanel = document.getElementById('debug-stats');
    if (statsPanel) {
        statsPanel.innerHTML = `
            <h4>Planet Service Stats</h4>
            <ul>
                <li>Total Planets: ${stats.totalPlanets}</li>
                <li>Cached Descriptions: ${stats.cachedDescriptions}</li>
                <li>Cache Rate: ${stats.cacheRate}</li>
            </ul>
        `;
    }
}

// ============================================================================
// UI HELPER FUNCTIONS
// ============================================================================

function showLoadingUI(planetName) {
    const infoPanel = document.getElementById('planet-info');
    if (infoPanel) {
        infoPanel.innerHTML = `
            <h2>${planetName}</h2>
            <div class="loading-spinner"></div>
            <p>Generating AI description...</p>
        `;
    }
}

function displayPlanetInfo(planetData, description) {
    const infoPanel = document.getElementById('planet-info');
    if (infoPanel) {
        infoPanel.innerHTML = `
            <h2>${planetData.name}</h2>
            <p class="planet-type">${planetData.planetType}</p>
            <div class="ai-description">
                ${description}
            </div>
            <div class="planet-specs">
                <strong>Composition:</strong> ${planetData.aiData?.composition}<br>
                <strong>Atmosphere:</strong> ${planetData.aiData?.atmosphere}<br>
                <strong>Temperature:</strong> ${planetData.aiData?.surfaceTemp}
            </div>
        `;
    }
}

function displayError(planetName) {
    const infoPanel = document.getElementById('planet-info');
    if (infoPanel) {
        infoPanel.innerHTML = `
            <h2>${planetName}</h2>
            <p class="error">Unable to load AI description at this time.</p>
        `;
    }
}

function createPlanetMesh(planetData) {
    // Placeholder - implement your Three.js planet creation
    // This would use your actual Planet class
    console.log('Creating mesh for:', planetData.name);
    return {}; // Return your Three.js object
}

// ============================================================================
// EXAMPLE: COMPLETE INTEGRATION
// ============================================================================

/**
 * Main application initialization
 */
export async function initializeApp() {
    console.log('🎮 Initializing 3D Space Application...');
    
    // 1. Initialize planet service
    await initializePlanetService();
    
    // 2. Setup Three.js scene (your existing code)
    // const scene = setupThreeJsScene();
    
    // 3. Render planets
    // const planets = renderAllPlanets(scene);
    
    // 4. Setup event listeners
    // planets.forEach(planet => {
    //     planet.addEventListener('click', () => onPlanetClick(planet));
    // });
    
    // 5. Display initial UI
    displayPlanetList();
    displayStats();
    
    // 6. Listen for preload completion
    window.addEventListener('planets-loaded', () => {
        console.log('🎉 All descriptions loaded! Updating UI...');
        displayPlanetList(); // Refresh to show "AI Ready" badges
    });
}

// ============================================================================
// EXPORT FOR USE IN main.js
// ============================================================================

export {
    planetService,
    initializePlanetService,
    onPlanetClick,
    renderAllPlanets,
    displayPlanetList,
    displayStats
};
