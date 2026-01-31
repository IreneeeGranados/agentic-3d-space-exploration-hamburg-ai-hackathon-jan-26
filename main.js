import * as THREE from 'three';
import { SceneManager } from './src/core/Scene.js';
import { CameraManager } from './src/core/Camera.js';
import { RendererManager } from './src/core/Renderer.js';
import { Planet } from './src/objects/Planet.js';
import { Star } from './src/objects/Star.js';
import { DynamicStarField } from './src/objects/DynamicStarField.js';
import { Spacecraft } from './src/objects/Spacecraft.js';
import { PlanetDataService } from './src/services/PlanetDataService.js';
import { ExoplanetField } from './src/objects/ExoplanetField.js';
import { LoadingManager } from './src/utils/LoadingManager.js';
import { TeleportManager } from './src/utils/TeleportManager.js';
import { PlanetNavigator } from './src/controls/PlanetNavigator.js';
import { PlanetHoverInfo } from './src/utils/PlanetHoverInfo.js';
import { PlanetExplorationDialog } from './src/ui/PlanetExplorationDialog.js';
import OpenAIService from './src/ai/OpenAIService.js';
import ElevenLabsService from './src/ai/ElevenLabsService.js';
import { CONFIG, isAIConfigured, isNarrationConfigured } from './src/config/config.js';
import { SpaceDust } from './src/objects/SpaceDust.js';

class App {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.loadingManager = new LoadingManager();
        this.uiVisible = true;
        this.exoplanetsVisible = true;
        this.init();
    }

    async init() {
        // Start loading sequence
        this.loadingManager.start(4); // 4 main steps

        try {
            // Step 1: Initialize core components
            this.loadingManager.updateStatus('Initializing Engine', 'Setting up 3D renderer...');
            this.sceneManager = new SceneManager();
            this.cameraManager = new CameraManager(this.canvas);
            this.rendererManager = new RendererManager(this.canvas);
            this.clock = new THREE.Clock();
            this.loadingManager.completeStep('Engine');

            // Step 2: Setup controls
            this.loadingManager.updateStatus('Configuring Controls', 'Mapping keyboard and mouse...');
            this.keys = { forward: false, backward: false, left: false, right: false, up: false, down: false };
            this.setupControls();
            this.mouse = { x: 0, y: 0 };
            this.setupMouse();
            this.loadingManager.completeStep('Controls');

            // Step 3: Build Universe (environment, all planets)
            this.loadingManager.updateStatus('Building Universe', 'Loading from NASA data clusters...');
            await this.createSceneObjects(); // Environment + All Planets (unified)
            this.initPlanetSelector();       // UI and navigation
            this.initExplorationDialog();    // Planet info dialog
            this.loadingManager.completeStep('Universe');

            // Step 4: Start animation and finalize
            this.loadingManager.updateStatus('Starting Mission', 'Engaging warp drive...');
            this.setupUIControls();
            window.addEventListener('resize', () => this.onWindowResize());
            this.animate();
            this.loadingManager.completeStep('Animation');

            // Finish loading
            this.loadingManager.finish();

            // Sync View UI
            if (this.spacecraft) this.updateViewUI();

        } catch (error) {
            console.error('Initialization error:', error);
            this.loadingManager.error(error.message);
        }
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.up = true;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.down = true;
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = true;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = true;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.boost = true;
            if (e.code === 'Space') this.keys.brake = true;

            // Navigation shortcuts
            if (e.code === 'KeyT') this.togglePlanetNavigator();
            if (e.code === 'KeyE') this.toggleExoplanets();
            if (e.code === 'KeyH') this.toggleUI();
            if (e.code === 'KeyI') this.showLastClickedPlanetInfo(); // 'I' for Info
            if (e.code === 'Escape') this.closePlanetNavigator();
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.up = false;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.down = false;
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.boost = false;
            if (e.code === 'Space') this.keys.brake = false;
        });
    }

    setupMouse() {
        console.log('Initializing Mouse Controls...');

        // ensure cursor exists (create it if missing to guarantee visibility)
        let cursor = document.getElementById('flight-cursor');
        if (!cursor) {
            console.log('Creating cursor element dynamically...');
            cursor = document.createElement('div');
            cursor.id = 'flight-cursor';
            document.body.appendChild(cursor);
        }

        // FORCE styles via JS to override any CSS issues
        Object.assign(cursor.style, {
            position: 'fixed', // Fixed to viewport
            width: '40px',
            height: '40px',
            borderLeft: '20px solid transparent',
            borderRight: '20px solid transparent',
            borderBottom: '40px solid #00d4ff',
            transform: 'translate(-50%, -50%) rotate(45deg)', // Point up-left ish
            pointerEvents: 'none',
            zIndex: '100000',
            display: 'block',
            filter: 'drop-shadow(0 0 10px #00d4ff)'
        });

        // Track mouse position relative to center (for steering)
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Normalize -1 to 1 based on distance from center
            this.mouse.x = (e.clientX - rect.left - centerX) / (centerX * 0.8);
            this.mouse.y = (e.clientY - rect.top - centerY) / (centerY * 0.8);

            // Clamp to -1 to 1
            this.mouse.x = Math.max(-1, Math.min(1, this.mouse.x));
            this.mouse.y = Math.max(-1, Math.min(1, this.mouse.y));

            // Update visual cursor position
            if (cursor) {
                cursor.style.left = `${e.clientX}px`;
                cursor.style.top = `${e.clientY}px`;

                // --- DYNAMIC CURSOR LOGIC ---
                // In Cockpit: Cursor must be INVISIBLE (Aim with Crosshair)
                if (this.spacecraft && this.spacecraft.viewMode === 'COCKPIT') {
                    cursor.style.display = 'none';
                } else {
                    // In Chase Mode: Always show
                    cursor.style.display = 'block';
                }

                // Cursor Styling (Standard Blue)
                cursor.style.borderBottomColor = '#00d4ff';
                cursor.style.filter = 'drop-shadow(0 0 10px #00d4ff)';
            }
        });

        // Hide default cursor on canvas hover
        this.canvas.style.cursor = 'none';

        // Raycasting for planet selection (engage autopilot)
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        window.addEventListener('click', (event) => {
            // Calculate mouse position in normalized device coordinates
            if (this.spacecraft && this.spacecraft.viewMode === 'COCKPIT') {
                // Cockpit Mode: Raycast from center (Crosshair)
                mouse.x = 0;
                mouse.y = 0;
            } else {
                // Chase Mode: Raycast from cursor
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            }

            if (this.cameraManager && this.cameraManager.camera) {
                raycaster.setFromCamera(mouse, this.cameraManager.camera);
                const intersects = raycaster.intersectObjects(this.sceneManager.scene.children, true);

                if (intersects.length > 0) {
                    // Check if we hit a solar system planet
                    const hit = intersects.find(intersect => {
                        let obj = intersect.object;
                        while (obj) {
                            if (this.planets.some(p => p.mesh === obj || p.group === obj)) {
                                return true;
                            }
                            // Check if it's an exoplanet mesh
                            if (obj.userData && obj.userData.planetData) {
                                return true;
                            }
                            obj = obj.parent;
                        }
                        return false;
                    });

                    if (hit) {
                        // Check if it has planetData (exoplanet OR solar system planet)
                        if (hit.object.userData && hit.object.userData.planetData) {
                            const planetData = hit.object.userData.planetData;
                            console.log('🪐 Planet Selected:', planetData.pl_name, planetData.isSolar ? '(Solar System)' : '(Exoplanet)');

                            // Store for info dialog
                            this.lastClickedPlanet = planetData;

                            // Show exploration dialog with planet info
                            if (this.explorationDialog) {
                                this.explorationDialog.show(planetData, (planet) => {
                                    // Teleport callback with warp effect
                                    if (this.teleportManager) {
                                        this.teleportManager.teleportWithProgress(planet);
                                    }
                                });
                            } else if (this.teleportManager) {
                                // Fallback to direct teleport if dialog not available
                                this.teleportManager.teleportWithProgress(planetData);
                            }
                        } else {
                            // Object without planetData (shouldn't happen)
                            console.warn('⚠️ Clicked object has no planetData:', hit.object);
                        }
                    }
                }
            }
        });

        // Speed Controls & Hotkeys (Keyboard)
        window.addEventListener('keydown', (e) => {
            if (!this.spacecraft) return;

            // Plus key (and NumpadAdd)
            if (e.key === '+' || e.code === 'NumpadAdd' || e.code === 'Equal') {
                this.spacecraft.defaultSpeed += 1.0;
                this.spacecraft.forwardSpeed = this.spacecraft.defaultSpeed;
                console.log('Speed increased to:', this.spacecraft.defaultSpeed);
            }

            // Minus key (and NumpadSubtract)
            if (e.key === '-' || e.code === 'NumpadSubtract' || e.code === 'Minus') {
                this.spacecraft.defaultSpeed = Math.max(0, this.spacecraft.defaultSpeed - 1.0);
                this.spacecraft.forwardSpeed = this.spacecraft.defaultSpeed;
                console.log('Speed decreased to:', this.spacecraft.defaultSpeed);
            }

            // View Toggle (V)
            if (e.code === 'KeyV' || e.key === 'v' || e.key === 'V') {
                console.log('V Key Pressed');
                this.spacecraft.toggleView();
                this.updateViewUI();
            }

            // Random Habitable Warp (R)
            if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') {
                console.log('R Key Pressed - Initiating Random Warp...');
                if (this.planetDataService && this.teleportManager) {
                    const habitablePlanets = this.planetDataService.filterByHabitability(70);
                    if (habitablePlanets.length > 0) {
                        const randomPlanet = habitablePlanets[Math.floor(Math.random() * habitablePlanets.length)];
                        this.teleportManager.teleportWithProgress(randomPlanet);
                    } else {
                        const anyPlanet = this.planetDataService.getRandomPlanet();
                        if (anyPlanet) this.teleportManager.teleportWithProgress(anyPlanet);
                    }
                }
            }
        });

        // Setup UI Buttons
        const viewBtn = document.getElementById('btn-toggle-view');
        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                console.log('View Button Clicked');
                // Prevent focus from sticking to button (which steals keyboard input)
                viewBtn.blur();
                if (this.spacecraft) {
                    this.spacecraft.toggleView();
                    this.updateViewUI();
                }
            });
        }
    }

    updateViewUI() {
        const overlay = document.getElementById('cockpit-overlay');
        const cursor = document.getElementById('flight-cursor');

        if (this.spacecraft.viewMode === 'COCKPIT') {
            if (overlay) overlay.classList.add('visible');
            // Hide standard flight cursor initially in cockpit
            if (cursor) cursor.style.display = 'none';
        } else {
            if (overlay) overlay.classList.remove('visible');
            // Show standard flight cursor in chase
            if (cursor) cursor.style.display = 'block';
        }
    }

    async createSceneObjects() {
        console.log('🌌 Initializing scene...');
        
        // 1. Initialize data service first (needed for all planet loading)
        await this.initializePlanetDataService();
        
        // 2. Create environment
        await this.createEnvironment();
        
        // 3. Load all planets (solar system + exoplanets) through unified field
        await this.loadAllPlanets();
        
        // 4. Create spacecraft
        this.createSpacecraft();
    }

    async initializePlanetDataService() {
        console.log('  📊 Initializing planet data service...');
        this.planetDataService = new PlanetDataService();
        await this.planetDataService.initialize();
        console.log('  ✓ Data service ready');
    }

    async createEnvironment() {
        console.log('  ✨ Creating star field...');
        // Create dynamic star field that follows camera
        this.dynamicStarField = new DynamicStarField(20000, 2000);
        this.sceneManager.add(this.dynamicStarField.mesh);
        
        // Create Space Dust for motion sensation
        this.spaceDust = new SpaceDust(2000, 400);
        this.sceneManager.add(this.spaceDust.mesh);
        console.log('  ✓ Environment created');
    }

    async loadAllPlanets() {
        console.log('🪐 Loading all planets from nasa_data/clusters/...');
        
        try {
            // Create unified planet field that handles both solar system and exoplanets
            this.exoplanetField = new ExoplanetField(this.planetDataService);
            
            // Load solar system first
            console.log('  🌍 Loading solar system...');
            await this.planetDataService.loadSolarSystem();
            
            // Then load exoplanets
            console.log('  🌌 Loading exoplanets...');
            await this.exoplanetField.load();

            if (this.exoplanetField.mesh) {
                this.sceneManager.add(this.exoplanetField.mesh);
            }

            const totalPlanets = this.planetDataService.getAllPlanets().length;
            console.log(`✓ Total planets loaded: ${totalPlanets}`);
            
            // Keep empty planets array for backward compatibility with UI components
            this.planets = [];
        } catch (error) {
            console.error('✗ Failed to load planets:', error);
            this.planets = [];
        }
    }

    createSpacecraft() {
        console.log('  🚀 Creating spacecraft...');
        this.spacecraft = new Spacecraft();
        this.sceneManager.add(this.spacecraft.group);
        console.log('  ✓ Spacecraft ready');
    }

    initPlanetSelector() {
        // Initialize teleport manager
        this.teleportManager = new TeleportManager(
            this.spacecraft,
            this.cameraManager.camera
        );

        // Initialize planet navigator UI - loads all planets from PlanetDataService
        this.planetNavigator = new PlanetNavigator(
            this.planetDataService,
            this.teleportManager
        );
        
        // Start loading all planets in the navigator
        this.planetNavigator.loadPlanets();

        // Initialize planet hover info (for backward compatibility, kept minimal)
        this.planetHoverInfo = new PlanetHoverInfo(
            this.cameraManager.camera,
            [], // Empty array since we're using unified system
            this.planetDataService
        );

        console.log('✓ Planet navigator initialized - loading all planets...');
    }

    initExplorationDialog() {
        // Initialize AI services if configured
        let openAIService = null;
        let elevenLabsService = null;

        if (isAIConfigured()) {
            try {
                openAIService = new OpenAIService(CONFIG.openai.apiKey);
                console.log('✓ OpenAI service initialized');
            } catch (error) {
                console.warn('⚠ OpenAI service not initialized:', error.message);
            }
        } else {
            console.log('ℹ OpenAI not configured - AI descriptions disabled');
        }

        if (isNarrationConfigured()) {
            try {
                elevenLabsService = new ElevenLabsService(CONFIG.elevenLabs.apiKey);
                console.log('✓ Eleven Labs service initialized');
            } catch (error) {
                console.warn('⚠ Eleven Labs service not initialized:', error.message);
            }
        } else {
            console.log('ℹ Eleven Labs not configured - Audio narration disabled');
        }

        // Initialize exploration dialog
        this.explorationDialog = new PlanetExplorationDialog(openAIService, elevenLabsService);

        // Make it globally accessible for debugging
        window.planetExplorationDialog = this.explorationDialog;

        console.log('✓ Planet exploration dialog initialized');
    }

    setupUIControls() {
        // Toggle UI button
        const toggleBtn = document.getElementById('toggle-ui-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleUI());
        }

        // Modal controls
        const modalClose = document.getElementById('modal-close');
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalClose) modalClose.addEventListener('click', () => this.closeModal());
        if (modalOverlay) modalOverlay.addEventListener('click', () => this.closeModal());
    }

    togglePlanetNavigator() {
        if (this.planetNavigator) {
            this.planetNavigator.toggle();
        }
    }

    closePlanetNavigator() {
        if (this.planetNavigator) {
            this.planetNavigator.hide();
        }
    }

    toggleExoplanets() {
        this.exoplanetsVisible = !this.exoplanetsVisible;
        if (this.exoplanetField && this.exoplanetField.mesh) {
            this.exoplanetField.mesh.visible = this.exoplanetsVisible;
        }
        console.log(`Exoplanets ${this.exoplanetsVisible ? 'shown' : 'hidden'}`);
    }

    toggleUI() {
        this.uiVisible = !this.uiVisible;
        const panels = document.querySelectorAll('.ui-panel:not(#planet-modal)');
        panels.forEach(panel => {
            if (this.uiVisible) {
                panel.classList.remove('hidden');
            } else {
                panel.classList.add('hidden');
            }
        });
        const toggleBtn = document.getElementById('toggle-ui-btn');
        if (toggleBtn) {
            toggleBtn.style.opacity = this.uiVisible ? '1' : '0.3';
        }
    }

    showLastClickedPlanetInfo() {
        if (this.lastClickedPlanet && this.explorationDialog) {
            this.explorationDialog.show(this.lastClickedPlanet, (planet) => {
                if (this.teleportManager) {
                    this.teleportManager.teleportToPlanet(planet);
                }
            });
        } else {
            console.log('No planet selected yet. Click on a planet first.');
        }
    }

    closeModal() {
        const modal = document.getElementById('planet-modal');
        const overlay = document.getElementById('modal-overlay');
        if (modal) modal.classList.remove('visible');
        if (overlay) overlay.classList.remove('visible');
    }

    updateHUD() {
        if (!this.spacecraft) return;

        const velocity = this.spacecraft.velocity.length();
        const position = this.spacecraft.group.position;
        const rotation = this.spacecraft.group.rotation;

        // Update velocity
        const velElem = document.getElementById('hud-velocity');
        const cockpitSpd = document.getElementById('cockpit-speed');
        if (velElem) velElem.textContent = `${velocity.toFixed(2)} u/s`;
        if (cockpitSpd) cockpitSpd.textContent = `SPD: ${velocity.toFixed(2)}`;

        // Update position (convert to light years)
        const posX = document.getElementById('hud-pos-x');
        const posY = document.getElementById('hud-pos-y');
        const posZ = document.getElementById('hud-pos-z');
        if (posX) posX.textContent = (position.x / 10).toFixed(2);
        if (posY) posY.textContent = (position.y / 10).toFixed(2);
        if (posZ) posZ.textContent = (position.z / 10).toFixed(2);

        // Update heading
        const heading = document.getElementById('hud-heading');
        if (heading) {
            const degrees = ((rotation.y * 180 / Math.PI) % 360 + 360) % 360;
            heading.textContent = `${degrees.toFixed(1)}°`;
        }

        // Mission status UI has been removed - autopilot status no longer displayed
        /*
        // Update autopilot status
        if (this.spacecraft.autopilot && this.spacecraft.autopilot.active) {
            const statusDot = document.getElementById('autopilot-status');
            const statusText = document.getElementById('autopilot-text');
            const destCard = document.getElementById('destination-card');

            if (statusDot) statusDot.className = 'status-dot';
            if (statusText) statusText.textContent = 'Autopilot Active';
            if (destCard) destCard.style.display = 'block';

            const target = this.spacecraft.autopilot.target;
            if (target && target.userData && target.userData.planetData) {
                const data = target.userData.planetData;
                const destName = document.getElementById('destination-name');
                const destDistance = document.getElementById('destination-distance');
                const destHab = document.getElementById('destination-habitability');

                if (destName) destName.textContent = data.name || data.pl_name;
                if (destDistance) {
                    const dist = this.spacecraft.mesh.position.distanceTo(target.position);
                    destDistance.textContent = `${(dist / 10).toFixed(2)} ly`;
                }
                if (destHab && data.characteristics) {
                    destHab.textContent = `${data.characteristics.habitability_percent}%`;
                }
            }
        } else {
            const statusDot = document.getElementById('autopilot-status');
            const statusText = document.getElementById('autopilot-text');
            const destCard = document.getElementById('destination-card');

            if (statusDot) statusDot.className = 'status-dot inactive';
            if (statusText) statusText.textContent = 'Manual Flight';
            if (destCard) destCard.style.display = 'none';
        }
        */
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.clock.getDelta();

        // Update dynamic star field to follow camera
        if (this.dynamicStarField && this.spacecraft) {
            this.dynamicStarField.update(this.spacecraft.group.position);
        }

        // Update all solar system planets
        if (this.planets) {
            this.planets.forEach(planet => planet.update());
        }

        // Update exoplanet field
        if (this.exoplanetField) {
            this.exoplanetField.update(deltaTime);
        }

        // Control spacecraft
        if (this.spacecraft) {
            // Steer spacecraft with keyboard and mouse
            this.spacecraft.steer(this.keys, deltaTime, this.mouse);

            // Update spacecraft animation
            this.spacecraft.update(deltaTime);

            // Update camera to follow spacecraft
            this.spacecraft.updateCamera(this.cameraManager.camera);

            // Update HUD display
            this.updateHUD();

            // Update Space Dust
            if (this.spaceDust) {
                this.spaceDust.update(this.spacecraft.group.position);
            }
        }

        // Update planet hover info
        if (this.planetHoverInfo) {
            this.planetHoverInfo.update();
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
        this.planets?.forEach(planet => planet.dispose());
        this.rendererManager.dispose();
        this.exoplanetField?.dispose();
        this.dynamicStarField?.dispose();
    }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new App();
    });
} else {
    window.app = new App();
}
