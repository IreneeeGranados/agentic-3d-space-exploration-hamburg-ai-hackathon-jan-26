/**
 * Main Application Entry Point
 * Initializes the 3D space exploration application
 */

import { SceneManager } from './src/core/Scene.js';
import { CameraManager } from './src/core/Camera.js';
import { RendererManager } from './src/core/Renderer.js';
import { Planet } from './src/objects/Planet.js';
import { Star } from './src/objects/Star.js';
import { StarField } from './src/objects/StarField.js';
import { setupOrbitControls } from './src/controls/OrbitControls.js';
import { PLANETS_DATA } from './src/config/planets.js';
import { Universe } from './src/objects/Universe.js';
import { Spacecraft } from './src/objects/Spacecraft.js';
import { CameraController } from './src/controls/CameraController.js';
import { setupPlanetSelector } from './src/utils/helpers.js';
import { aiService } from './src/services/AIService.js';
import { isAIConfigured, isNarrationConfigured } from './src/config/config.js';

class App {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.init();
    }

    init() {
        // Initialize core components
        this.sceneManager = new SceneManager();
        this.cameraManager = new CameraManager(this.canvas);
        this.rendererManager = new RendererManager(this.canvas);

        // Setup controls
        this.controls = setupOrbitControls(
            this.cameraManager.camera,
            this.rendererManager.renderer.domElement
        );

        // Setup camera controller for travel mode (spacecraft will be linked later)
        this.cameraController = new CameraController(
            this.cameraManager.camera,
            this.controls,
            null  // Spacecraft not created yet
        );

        // Create scene objects
        this.createSceneObjects();

        // Setup planet selector (click to travel)
        this.setupInteractions();

        // Start animation loop
        this.animate();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    createSceneObjects() {
        // Create the universe background (nebulae, galaxies)
        this.universe = new Universe(4000);
        this.sceneManager.add(this.universe.mesh);

        // Create background starfield (layer on top for depth)
        const starField = new StarField(15000, 3500);
        this.sceneManager.add(starField.mesh);

        // Create central star (Sun)
        const sun = new Star({
            radius: 20,
            color: 0xffff00,
            emissiveIntensity: 2
        });
        this.sceneManager.add(sun.mesh);

        // Create planets from configuration
        this.planets = PLANETS_DATA.map(planetData => {
            const planet = new Planet(planetData);
            this.sceneManager.add(planet.group);
            return planet;
        });

        // Create spacecraft in foreground
        this.spacecraft = new Spacecraft();
        this.spacecraft.attachToCamera(this.cameraManager.camera);
        this.sceneManager.add(this.spacecraft.group);

        // Update camera controller with spacecraft reference
        this.cameraController.spacecraft = this.spacecraft;
    }

    setupInteractions() {
        setupPlanetSelector(
            this.cameraManager.camera,
            this.canvas,
            this.planets,
            (planet) => this.onPlanetClick(planet),
            (planet) => this.onPlanetHover(planet)
        );
    }

    async onPlanetClick(planet) {
        console.log('Traveling to:', planet.config.name);
        this.cameraController.travelToPlanet(planet);

        // Update basic planet info
        const infoPanel = document.getElementById('planet-info');
        if (infoPanel) {
            infoPanel.innerHTML = `
                <strong>${planet.config.name}</strong><br>
                ${planet.config.description}<br>
                <em>Composition: ${planet.config.aiData.composition}</em>
            `;
        }

        // Show AI section
        const aiSection = document.getElementById('ai-description');
        const aiContent = document.getElementById('ai-content');
        const loadingSpinner = document.getElementById('loading-spinner');
        const narrateBtn = document.getElementById('narrate-btn');

        if (aiSection) {
            aiSection.style.display = 'block';
        }

        // Show loading state
        if (loadingSpinner) {
            loadingSpinner.style.display = 'flex';
        }
        if (aiContent) {
            aiContent.textContent = '';
        }
        if (narrateBtn) {
            narrateBtn.style.display = 'none';
        }

        // Fetch AI description
        try {
            const description = await aiService.getPlanetDescription(planet.config);

            if (aiContent) {
                aiContent.textContent = description;
            }
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }

            // Setup narration if available
            if (isNarrationConfigured() && narrateBtn) {
                narrateBtn.style.display = 'block';
                narrateBtn.onclick = async () => {
                    const audioUrl = await aiService.narratePlanetInfo(description);
                    if (audioUrl) {
                        aiService.playNarration(audioUrl);
                    }
                };
            }

        } catch (error) {
            console.error('Error getting AI description:', error);
            if (aiContent) {
                aiContent.textContent = 'Unable to generate AI description at this time.';
            }
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }
        }
    }

    onPlanetHover(planet) {
        if (planet) {
            const infoPanel = document.getElementById('planet-info');
            if (infoPanel) {
                infoPanel.innerHTML = `Hover: ${planet.config.name} - Click to travel`;
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Update controls
        this.controls.update();

        // Update universe rotation
        if (this.universe) {
            this.universe.update();
        }

        // Update all planets (rotation, orbit)
        if (this.planets) {
            this.planets.forEach(planet => planet.update());
        }

        // Update spacecraft animation (pass camera reference)
        if (this.spacecraft) {
            this.spacecraft.update(0.016, this.cameraManager.camera);
        }

        // Render the scene
        this.rendererManager.render(
            this.sceneManager.scene,
            this.cameraManager.camera
        );
    }

    onWindowResize() {
        this.cameraManager.updateAspect(this.canvas);
        this.rendererManager.updateSize(this.canvas);
    }

    dispose() {
        // Cleanup resources
        this.planets?.forEach(planet => planet.dispose());
        this.rendererManager.dispose();
        this.controls.dispose();
    }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new App());
} else {
    new App();
}
