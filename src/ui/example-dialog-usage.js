/**
 * Example: Using the Planet Exploration Dialog
 * 
 * This example demonstrates how to use the PlanetExplorationDialog
 * with and without AI services.
 */

import { PlanetExplorationDialog } from './PlanetExplorationDialog.js';
import OpenAIService from '../ai/OpenAIService.js';
import ElevenLabsService from '../ai/ElevenLabsService.js';

// ============================================
// Example 1: Basic Usage (No AI)
// ============================================

function example1_basicUsage() {
    // Create dialog without AI services
    const dialog = new PlanetExplorationDialog();
    
    // Example planet data
    const planetData = {
        pl_name: "GJ 832 b",
        sy_dist: 14.6427,
        pl_rade: 2.847,
        characteristics: {
            habitability_percent: 65,
            toxicity_percent: 50,
            radius_position: "Neptune-like",
            atmosphere_type: "Hydrogen-Helium",
            principal_material: "Gas (H/He)",
            orbit_type: "Circular",
            satellites: { has_satellites: false },
            coordinates_3d: {
                x_light_years: 8.5249,
                y_light_years: -6.3332,
                z_light_years: -12.2222
            },
            icrs_coordinates: {
                right_ascension: { hours_format: "21h33m33.90s" },
                declination: { dms_format: "-49d00m45.06s" },
                parallax: { value: 201.407 }
            }
        }
    };
    
    // Show dialog
    dialog.show(planetData, (planet) => {
        console.log('User wants to teleport to:', planet.pl_name);
    });
}

// ============================================
// Example 2: With AI Services
// ============================================

async function example2_withAI() {
    // Initialize AI services
    const openAI = new OpenAIService('your-openai-key');
    const elevenLabs = new ElevenLabsService('your-elevenlabs-key');
    
    // Create dialog with AI
    const dialog = new PlanetExplorationDialog(openAI, elevenLabs);
    
    const planetData = {
        pl_name: "Proxima Centauri b",
        sy_dist: 1.3,
        pl_rade: 1.07,
        characteristics: {
            habitability_percent: 75,
            toxicity_percent: 30,
            radius_position: "Earth-like",
            atmosphere_type: "Nitrogen-Oxygen",
            principal_material: "Rocky"
        }
    };
    
    // Show dialog - AI description will be generated automatically
    dialog.show(planetData, (planet) => {
        console.log('Teleporting to:', planet.pl_name);
        // Your teleport logic here
    });
}

// ============================================
// Example 3: Conditional AI Based on Config
// ============================================

function example3_conditionalAI() {
    // This is how it's used in main.js
    // import { CONFIG, isAIConfigured, isNarrationConfigured } from '../config/config.js';
    
    let openAI = null;
    let elevenLabs = null;
    
    // Only initialize if configured
    if (isAIConfigured()) {
        openAI = new OpenAIService(CONFIG.openai.apiKey);
    }
    
    if (isNarrationConfigured()) {
        elevenLabs = new ElevenLabsService(CONFIG.elevenLabs.apiKey);
    }
    
    // Dialog works with or without services
    const dialog = new PlanetExplorationDialog(openAI, elevenLabs);
    
    return dialog;
}

// ============================================
// Example 4: Programmatic Control
// ============================================

function example4_programmaticControl() {
    const dialog = new PlanetExplorationDialog();
    
    // Show dialog
    dialog.show(somePlanetData);
    
    // Switch tabs programmatically
    setTimeout(() => {
        dialog.switchTab('characteristics');
    }, 2000);
    
    // Hide dialog
    setTimeout(() => {
        dialog.hide();
    }, 5000);
    
    // Check if visible
    if (dialog.isVisible()) {
        console.log('Dialog is visible');
    }
}

// ============================================
// Example 5: Event Handling
// ============================================

function example5_eventHandling() {
    const dialog = new PlanetExplorationDialog();
    
    // Store reference to last shown planet
    let currentPlanet = null;
    
    dialog.show(planetData, (planet) => {
        console.log('Teleport requested for:', planet.pl_name);
        
        // Your teleport logic
        teleportToPlanet(planet);
        
        // Close dialog after teleport
        dialog.hide();
    });
    
    // Keyboard shortcut to reopen last planet
    document.addEventListener('keydown', (e) => {
        if (e.key === 'i' && currentPlanet) {
            dialog.show(currentPlanet);
        }
    });
}

// ============================================
// Example 6: Integration with Planet Clicking
// ============================================

function example6_planetClickIntegration(raycaster, camera, scene) {
    const dialog = new PlanetExplorationDialog();
    
    canvas.addEventListener('click', (event) => {
        // Setup raycasting
        const mouse = {
            x: (event.clientX / window.innerWidth) * 2 - 1,
            y: -(event.clientY / window.innerHeight) * 2 + 1
        };
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        if (intersects.length > 0) {
            const hit = intersects[0];
            
            // Check if clicked object has planet data
            if (hit.object.userData && hit.object.userData.planetData) {
                const planetData = hit.object.userData.planetData;
                
                // Show dialog instead of immediate teleport
                dialog.show(planetData, (planet) => {
                    // Teleport only if user clicks the button
                    teleportManager.teleportToPlanet(planet);
                });
            }
        }
    });
}

// ============================================
// Example 7: Memory Management
// ============================================

function example7_memoryManagement() {
    const dialog = new PlanetExplorationDialog(openAI, elevenLabs);
    
    // Use the dialog
    dialog.show(planetData);
    
    // Later, when cleaning up (e.g., on page unload)
    window.addEventListener('beforeunload', () => {
        // Properly destroy dialog to prevent memory leaks
        dialog.destroy();
    });
}

// ============================================
// Example 8: Custom Styling
// ============================================

function example8_customStyling() {
    const dialog = new PlanetExplorationDialog();
    
    // Show dialog
    dialog.show(planetData);
    
    // Access dialog element for custom styling
    dialog.dialog.style.width = '800px';
    dialog.dialog.classList.add('custom-theme');
    
    // Or add custom CSS class via config
    dialog.dialog.dataset.theme = 'dark-mode';
}

// ============================================
// Export examples
// ============================================

export {
    example1_basicUsage,
    example2_withAI,
    example3_conditionalAI,
    example4_programmaticControl,
    example5_eventHandling,
    example6_planetClickIntegration,
    example7_memoryManagement,
    example8_customStyling
};
