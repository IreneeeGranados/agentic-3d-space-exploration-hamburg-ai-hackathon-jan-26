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
import { PlanetNavigator } from './src/controls/PlanetNavigator.js';
import { PlanetHoverInfo } from './src/utils/PlanetHoverInfo.js';
import { PlanetExplorationDialog } from './src/ui/PlanetExplorationDialog.js';
import { PlanetTargetingSquare } from './src/ui/PlanetTargetingSquare.js';
import { ProximityDetector } from './src/utils/ProximityDetector.js';
import { NarrationService } from './src/services/NarrationService.js';
import { NarratorDialog } from './src/ui/NarratorDialog.js';
import OpenAIService from './src/ai/OpenAIService.js';
import ElevenLabsService from './src/ai/ElevenLabsService.js';
import { CONFIG, isAIConfigured, isNarrationConfigured } from './src/config/config.js';
import { WarpTunnel } from './src/objects/WarpTunnel.js';
import { MultiplayerManager } from './src/multiplayer/MultiplayerManager.js';

class App {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.loadingManager = new LoadingManager();
        this.uiVisible = true;
        this.exoplanetsVisible = true;
        this.controlsEnabled = true; // Flag to enable/disable keyboard navigation
        this.multiplayerManager = null;
        this.multiplayerEnabled = false;
        
        // Multiplayer server URL (configurable)
        this.multiplayerServerUrl = localStorage.getItem('multiplayerServerUrl') || 'http://localhost:3000';
        
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
            
            // Add camera to scene so camera light works
            this.sceneManager.add(this.cameraManager.camera);
            
            this.loadingManager.completeStep('Engine');

            // Step 2: Setup controls
            this.loadingManager.updateStatus('Configuring Controls', 'Mapping keyboard and mouse...');
            this.keys = { up: false, down: false, left: false, right: false, speedUp: false, speedDown: false, boost: false, brake: false };
            this.setupControls();
            this.mouse = { x: 0, y: 0 };
            this.setupMouse();
            this.loadingManager.completeStep('Controls');

            // Step 3: Build Universe (environment, all planets)
            this.loadingManager.updateStatus('Building Universe', 'Loading from NASA data clusters...');
            await this.createSceneObjects(); // Environment + All Planets (unified)
            this.initPlanetSelector();       // UI and navigation
            this.initExplorationDialog();    // Planet info dialog
            this.initTargetingSquare();      // Planet targeting visual
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

            // Initialize multiplayer URL input
            this.initializeMultiplayerSettings();

            // Check multiplayer server availability and update status
            this.checkMultiplayerAvailability();

        } catch (error) {
            console.error('Initialization error:', error);
            this.loadingManager.error(error.message);
        }
    }

    initializeMultiplayerSettings() {
        const urlInput = document.getElementById('multiplayer-url');
        if (urlInput) {
            // Set initial value from localStorage or default
            urlInput.value = this.multiplayerServerUrl;
            
            // Save URL when user changes it
            urlInput.addEventListener('change', (e) => {
                const newUrl = e.target.value.trim() || 'http://localhost:3000';
                this.multiplayerServerUrl = newUrl;
                localStorage.setItem('multiplayerServerUrl', newUrl);
                console.log('🔧 Multiplayer server URL updated:', newUrl);
                
                // Re-check server availability with new URL
                this.checkMultiplayerAvailability();
            });
            
            // Also check on blur
            urlInput.addEventListener('blur', (e) => {
                const newUrl = e.target.value.trim() || 'http://localhost:3000';
                if (newUrl !== this.multiplayerServerUrl) {
                    this.multiplayerServerUrl = newUrl;
                    localStorage.setItem('multiplayerServerUrl', newUrl);
                    console.log('🔧 Multiplayer server URL updated:', newUrl);
                    this.checkMultiplayerAvailability();
                }
            });
        }
    }

    async checkMultiplayerAvailability() {
        console.log('🔍 Checking multiplayer server:', this.multiplayerServerUrl);
        const serverAvailable = await MultiplayerManager.checkServerAvailability(this.multiplayerServerUrl);
        
        const statusEl = document.getElementById('multiplayer-status-inline');
        const btnEl = document.getElementById('multiplayer-btn');
        
        if (serverAvailable) {
            console.log('✓ Multiplayer server detected');
            if (statusEl) statusEl.textContent = 'READY';
            if (statusEl) statusEl.style.color = '#00FF88';
            if (btnEl) btnEl.style.borderColor = '#00FF88';
        } else {
            console.log('ℹ Multiplayer server not available');
            if (statusEl) statusEl.textContent = 'SERVER OFFLINE';
            if (statusEl) statusEl.style.color = '#888';
            if (btnEl) btnEl.style.opacity = '0.5';
        }
    }

    async toggleMultiplayer() {
        const statusEl = document.getElementById('multiplayer-status-inline');
        const btnEl = document.getElementById('multiplayer-btn');
        
        if (this.multiplayerEnabled) {
            // Disconnect
            if (this.multiplayerManager) {
                this.multiplayerManager.disconnect();
                this.multiplayerManager = null;
            }
            this.multiplayerEnabled = false;
            this.updateMultiplayerUI(false);
            console.log('👋 Multiplayer disabled');
        } else {
            // Connect
            try {
                console.log('🔌 Enabling multiplayer...');
                this.multiplayerManager = new MultiplayerManager(this.sceneManager, this.spacecraft);
                await this.multiplayerManager.connect(this.multiplayerServerUrl);
                this.multiplayerEnabled = true;
                this.updateMultiplayerUI(true);
                console.log('✓ Multiplayer enabled');
            } catch (error) {
                console.error('Failed to connect to multiplayer:', error);
                this.multiplayerManager = null;
                this.multiplayerEnabled = false;
                alert(`Could not connect to multiplayer server at ${this.multiplayerServerUrl}\nMake sure the server is running.`);
            }
        }
    }

    updateMultiplayerUI(connected) {
        const mpBtn = document.getElementById('multiplayer-btn');
        const mpStatus = document.getElementById('multiplayer-status-inline');
        
        if (mpBtn) {
            mpBtn.textContent = connected ? '🔌 Disconnect' : '🌐 Join Multiplayer';
            if (connected) {
                mpBtn.style.background = 'rgba(0, 255, 136, 0.3)';
                mpBtn.style.borderColor = '#00FF88';
                mpBtn.style.opacity = '1';
            } else {
                mpBtn.style.background = 'rgba(0, 217, 255, 0.2)';
                mpBtn.style.borderColor = '#00D9FF';
                mpBtn.style.opacity = '1';
            }
        }
        
        if (mpStatus) {
            if (connected && this.multiplayerManager) {
                const status = this.multiplayerManager.getStatus();
                mpStatus.textContent = `CONNECTED (${status.playerCount} players)`;
                mpStatus.style.color = '#00FF88';
            } else {
                mpStatus.textContent = connected ? 'CONNECTED' : 'READY';
                mpStatus.style.color = connected ? '#00FF88' : '#00D9FF';
            }
        }
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            // Check if narrator dialog is open
            const narratorOpen = this.narratorDialog && this.narratorDialog.isShowing();
            
            // If narrator is open, only allow arrow keys for movement
            if (narratorOpen) {
                // Allow arrow keys
                if (e.code === 'ArrowUp') {
                    this.keys.up = true;
                    e.preventDefault();
                    return;
                }
                if (e.code === 'ArrowDown') {
                    this.keys.down = true;
                    e.preventDefault();
                    return;
                }
                if (e.code === 'ArrowLeft') {
                    this.keys.left = true;
                    e.preventDefault();
                    return;
                }
                if (e.code === 'ArrowRight') {
                    this.keys.right = true;
                    e.preventDefault();
                    return;
                }
                
                // Allow ESC (handled by NarratorDialog)
                if (e.code === 'Escape') {
                    return;
                }
                
                // Block all other keys
                return;
            }
            
            // Normal mode - skip controls if navigation is disabled
            if (!this.controlsEnabled) return;

            if (e.code === 'KeyW') this.keys.speedUp = true;
            if (e.code === 'KeyS') this.keys.speedDown = true;
            if (e.code === 'ArrowUp') this.keys.up = true;
            if (e.code === 'ArrowDown') this.keys.down = true;
            if (e.code === 'ArrowLeft') this.keys.left = true;
            if (e.code === 'ArrowRight') this.keys.right = true;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.boost = true;
            if (e.code === 'Space') this.keys.brake = true;

            if (e.code === 'KeyV' || e.key === 'v' || e.key === 'V') this.handleViewToggle();
            if (e.code === 'KeyT') this.togglePlanetNavigator();
            if (e.code === 'KeyH') this.toggleUI();
            if (e.code === 'KeyN') this.narrateClosestPlanet(); // Narrate closest planet

            if (e.code === 'Escape') this.closePlanetNavigator();
        });

        window.addEventListener('keyup', (e) => {
            // Check if narrator dialog is open
            const narratorOpen = this.narratorDialog && this.narratorDialog.isShowing();
            
            // If narrator is open, only handle arrow keys
            if (narratorOpen) {
                if (e.code === 'ArrowUp') this.keys.up = false;
                if (e.code === 'ArrowDown') this.keys.down = false;
                if (e.code === 'ArrowLeft') this.keys.left = false;
                if (e.code === 'ArrowRight') this.keys.right = false;
                return;
            }
            
            // Normal mode - skip controls if navigation is disabled
            if (!this.controlsEnabled) return;

            if (e.code === 'KeyW') this.keys.speedUp = false;
            if (e.code === 'KeyS') this.keys.speedDown = false;
            if (e.code === 'ArrowUp') this.keys.up = false;
            if (e.code === 'ArrowDown') this.keys.down = false;
            if (e.code === 'ArrowLeft') this.keys.left = false;
            if (e.code === 'ArrowRight') this.keys.right = false;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.boost = false;
            if (e.code === 'Space') this.keys.brake = false;

            // Speed controls
            if (e.code === 'Equal' || e.code === 'NumpadAdd' || e.key === '+' || e.key === '=') {
                this.keys.speedUp = false;
                console.log('🚀 Speed UP key released!');
            }
            if (e.code === 'Minus' || e.code === 'NumpadSubtract' || e.key === '-' || e.key === '_') {
                this.keys.speedDown = false;
                console.log('🔻 Speed DOWN key released!');
            }
        });
    }

    setupMouse() {
        console.log('Initializing Mouse Controls...');

        // Cursor logic removed per user request


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

        });

        // Hide default cursor on canvas hover
        // System cursor restored
        this.canvas.style.cursor = 'default';

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
                            if (this.planets && this.planets.some(p => p.mesh === obj || p.group === obj)) {
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

                            // Show targeting square on the planet
                            if (this.targetingSquare) {
                                // ALL planets (Solar + Exo) are in meshGroup with x10000 scale
                                const parentGroup = this.exoplanetField?.meshGroup;
                                this.targetingSquare.target(hit.object, planetData, parentGroup);
                            }

                            // Show exploration dialog with planet info
                            if (this.explorationDialog) {
                                this.explorationDialog.show(planetData);
                            }
                        } else {
                            // Object without planetData (shouldn't happen)
                            console.warn('⚠️ Clicked object has no planetData:', hit.object);
                        }
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
                this.handleViewToggle();
            });
        }
    }

    updateViewUI() {
        const overlay = document.getElementById('cockpit-overlay');
        const cursor = document.getElementById('flight-cursor');

        if (this.spacecraft.viewMode === 'COCKPIT') {
            if (overlay) overlay.classList.add('visible');
        } else {
            if (overlay) overlay.classList.remove('visible');
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

        // Warp Tunnel Effect
        this.warpTunnel = new WarpTunnel();
        this.sceneManager.add(this.warpTunnel.group);

        // SpaceDust removed - cleaner view
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
        // Initialize planet navigator UI with teleport callback
        this.planetNavigator = new PlanetNavigator(
            this.planetDataService,
            (planet) => this.teleportToPlanet(planet)
        );

        // Start loading all planets in the navigator
        this.planetNavigator.loadPlanets();

        // Setup SpAIce floating button
        setTimeout(() => this.setupSpAIceButton(), 100);

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
        this.explorationDialog = new PlanetExplorationDialog(openAIService, elevenLabsService, this);
        
        // Initialize proximity-based narration system
        this.proximityDetector = new ProximityDetector(this.planetDataService, this.exoplanetField);
        this.narrationService = new NarrationService(openAIService, elevenLabsService);
        this.narratorDialog = new NarratorDialog(this.narrationService); // Pass service for chat

        // Make it globally accessible for debugging
        window.planetExplorationDialog = this.explorationDialog;
        window.narratorDialog = this.narratorDialog;

        console.log('✓ Planet exploration dialog initialized');
        console.log('✓ Proximity narration system initialized');
    }

    initTargetingSquare() {
        // Initialize planet targeting square
        this.targetingSquare = new PlanetTargetingSquare(this.sceneManager.scene);
        console.log('✓ Planet targeting square initialized');
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

    handleViewToggle() {
        if (this.spacecraft) {
            console.log('🚀 Toggling viewpoint');
            this.spacecraft.toggleView();
            this.updateViewUI();
        } else {
            console.warn('⚠️ Spacecraft not ready for view toggle');
        }
    }

    toggleUI() {
        this.uiVisible = !this.uiVisible;

        // Toggle standard UI panels
        const panels = document.querySelectorAll('.ui-panel:not(#planet-modal)');
        panels.forEach(panel => {
            if (this.uiVisible) {
                panel.classList.remove('hidden');
            } else {
                panel.classList.add('hidden');
            }
        });

        // Toggle Planet Navigator
        if (this.planetNavigator) {
            if (this.uiVisible) {
                this.planetNavigator.container.style.display = 'flex';
            } else {
                this.planetNavigator.container.style.display = 'none';
            }
        }

        const toggleBtn = document.getElementById('toggle-ui-btn');
        if (toggleBtn) {
            toggleBtn.style.opacity = this.uiVisible ? '1' : '0.3';
        }
    }

    showLastClickedPlanetInfo() {
        if (this.lastClickedPlanet && this.explorationDialog) {
            this.explorationDialog.show(this.lastClickedPlanet);
        } else {
            console.log('No planet selected yet. Click on a planet first.');
        }
    }

    /**
     * Narrate closest planet (triggered by 'N' key)
     */
    async narrateClosestPlanet() {
        if (!this.spacecraft || !this.proximityDetector || !this.narrationService || !this.narratorDialog) {
            console.warn('⚠️ Narration system not initialized');
            return;
        }

        // Check if narrator is already showing
        if (this.narratorDialog.isShowing()) {
            console.log('⏩ Narration already in progress');
            return;
        }

        // Get closest planet
        const closest = this.proximityDetector.getClosestPlanet(this.spacecraft.group.position);
        
        if (!closest) {
            console.log('⚠️ No planet nearby to narrate');
            return;
        }

        const planet = closest.planet;
        const distance = closest.distance;
        
        console.log(`🎙️ Narrating ${planet.pl_name} (${(distance / 10000).toFixed(2)} scaled units away)`);

        // Show dialog with loading state first
        this.narratorDialog.container.classList.add('visible');
        this.narratorDialog.isVisible = true;
        this.narratorDialog.elements.planetName.textContent = planet.pl_name || 'Unknown Planet';
        this.narratorDialog.showLoading();

        // Target the planet (show targeting square)
        if (this.targetingSquare && closest.mesh) {
            // ALL planets (Solar + Exo) are in meshGroup with x10000 scale
            const parentGroup = this.exoplanetField?.meshGroup;
            this.targetingSquare.target(closest.mesh, planet, parentGroup);
            console.log('🎯 Targeting square shown for', planet.pl_name);
            console.log('   Mesh:', closest.mesh.type, 'Position:', closest.worldPosition);
            console.log('   Parent group scale:', parentGroup ? parentGroup.scale.x : 'none');
        } else {
            console.warn('⚠️ Could not show targeting square');
            console.warn('   targetingSquare exists:', !!this.targetingSquare);
            console.warn('   closest.mesh exists:', !!closest.mesh);
            console.warn('   closest object:', closest);
        }

        try {
            console.log('📝 Generating narration...');
            // Generate narration
            const { text, audio } = await this.narrationService.generateNarration(planet);
            
            console.log('💬 Showing narrator dialog...');
            // Show narrator dialog with text and audio
            await this.narratorDialog.show(planet, text, audio);
            
            console.log('✅ Narrator dialog displayed');
            
        } catch (error) {
            console.error('❌ Narration failed:', error);
            this.narratorDialog.hideLoading();
            this.narratorDialog.hide();
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

        // Update velocity (use actual forwardSpeed, not velocity.length())
        const velElem = document.getElementById('hud-velocity');
        const cockpitSpd = document.getElementById('cockpit-speed');
        const actualSpeed = this.spacecraft.getSpeed(); // Get actual forwardSpeed
        if (velElem) velElem.textContent = `${actualSpeed.toFixed(2)} u/s`;
        if (cockpitSpd) cockpitSpd.textContent = `SPD: ${actualSpeed.toFixed(2)}`;

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

        // Update target display in cockpit
        this.updateTargetDisplay();
    }

    updateTargetDisplay() {
        const targetElem = document.querySelector('.cockpit-data-right .data-line');
        if (!targetElem) return;

        if (this.targetingSquare && this.targetingSquare.isTargeting() && this.targetingSquare.planetData) {
            const planetName = this.targetingSquare.planetData.pl_name || 'Unknown';
            targetElem.textContent = `TARGET: ${planetName}`;
        } else {
            targetElem.textContent = 'TARGET: NONE';
        }
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
            this.planets.forEach(planet => planet.update(deltaTime));
        }

        // Update exoplanet field
        if (this.exoplanetField) {
            this.exoplanetField.update(deltaTime);
        }

        // Control spacecraft
        if (this.spacecraft) {
            // Steer spacecraft with keyboard and mouse
            this.spacecraft.steer(this.keys, deltaTime, this.mouse);

            // Collect potential obstacles/planets for proximity check
            // Filter scene children for objects that look like planets (have planetData)
            const nearbyObjects = this.sceneManager.scene.children.filter(obj => obj.userData && obj.userData.planetData);

            // Update spacecraft animation with proximity check
            this.spacecraft.update(deltaTime, nearbyObjects);

            // Update camera to follow spacecraft
            this.spacecraft.updateCamera(this.cameraManager.camera);

            // Update HUD display
            this.updateHUD();
        }

        // Update planet hover info
        if (this.planetHoverInfo) {
            this.planetHoverInfo.update();
        }

        // Update Warp Tunnel
        if (this.warpTunnel && this.spacecraft) {
            this.warpTunnel.update(
                deltaTime,
                this.spacecraft.getSpeed(),
                this.cameraManager.camera.position,
                this.cameraManager.camera.quaternion
            );
        }

        // Update targeting square animation
        if (this.targetingSquare) {
            this.targetingSquare.update(this.cameraManager.camera);
        }

        // Update multiplayer
        if (this.multiplayerEnabled && this.multiplayerManager) {
            this.multiplayerManager.sendUpdate();
            this.multiplayerManager.update(deltaTime);
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

    /**
     * Teleport spacecraft to planet location with visual effect
     * Adjusted for x10000 scaled system
     */
    teleportToPlanet(planet) {
        if (!planet) return;

        console.log(`🚀 Teleporting to ${planet.pl_name}`);

        let targetPosition;

        // IMPORTANTE: Los planetas ahora están escalados x10000
        const globalScale = 10000;

        // Solar system planets use position field
        const isSolarPlanet = planet.hostname === 'Sun';
        if (isSolarPlanet && planet.position) {
            targetPosition = new THREE.Vector3(
                planet.position.x * 10 * globalScale, // sceneScale * globalScale
                planet.position.y * 10 * globalScale,
                planet.position.z * 10 * globalScale
            );
        }
        // Exoplanets use coordinates_3d
        else if (planet.characteristics?.coordinates_3d) {
            const coords = planet.characteristics.coordinates_3d;
            targetPosition = new THREE.Vector3(
                coords.x_light_years * 10 * globalScale, // sceneScale * globalScale
                coords.y_light_years * 10 * globalScale,
                coords.z_light_years * 10 * globalScale
            );
        }

        if (!targetPosition) {
            console.warn(`Cannot teleport to ${planet.pl_name}: No coordinates available`);
            return;
        }

        // Create flash effect overlay
        this.createTeleportFlash();

        // Calculate approach position - cerca del planeta pero no dentro
        const planetRadius = (planet.pl_rade || 1.0) * 0.5 * globalScale; // Radio del planeta escalado
        const offset = planetRadius * 1.5; // 1.5x el radio -> Closer arrival per user request
        const direction = targetPosition.clone().normalize();
        const approachPosition = targetPosition.clone().sub(direction.multiplyScalar(offset));

        // Perform teleport during flash peak (200ms)
        setTimeout(() => {
            // Move spacecraft
            this.spacecraft.group.position.copy(approachPosition);

            // Reset velocity and set safe arrival speed
            if (this.spacecraft.velocity) {
                this.spacecraft.velocity.set(0, 0, 0);
                // Keep some forward momentum but slow
                this.spacecraft.forwardSpeed = 100.0;
            }

            // Point spacecraft towards planet
            this.spacecraft.group.lookAt(targetPosition);

            console.log(`✓ Teleported to ${planet.pl_name} at distance ${offset.toFixed(0)} units`);
        }, 200);
    }

    /**
     * Create visual flash effect for teleportation
     */
    createTeleportFlash() {
        // Create flash overlay
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle, rgba(0,212,255,0.9) 0%, rgba(255,255,255,0.7) 30%, rgba(0,212,255,0.4) 70%, transparent 100%);
            pointer-events: none;
            z-index: 10000;
            opacity: 0;
            animation: teleportFlash 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        `;

        // Add animation if not exists
        if (!document.getElementById('teleport-flash-animation')) {
            const style = document.createElement('style');
            style.id = 'teleport-flash-animation';
            style.textContent = `
                @keyframes teleportFlash {
                    0% { opacity: 0; transform: scale(0.8); }
                    15% { opacity: 1; transform: scale(1.1); }
                    50% { opacity: 1; transform: scale(1.2); }
                    100% { opacity: 0; transform: scale(1); }
                }
                
                @keyframes screenShake {
                    0%, 100% { transform: translate(0, 0); }
                    10% { transform: translate(-5px, 2px); }
                    20% { transform: translate(5px, -2px); }
                    30% { transform: translate(-5px, -2px); }
                    40% { transform: translate(5px, 2px); }
                    50% { transform: translate(-5px, 2px); }
                    60% { transform: translate(5px, -2px); }
                    70% { transform: translate(-5px, -2px); }
                    80% { transform: translate(5px, 2px); }
                    90% { transform: translate(-5px, 2px); }
                }
                
                .camera-shake {
                    animation: screenShake 0.4s cubic-bezier(.36,.07,.19,.97);
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(flash);

        // Screen shake effect
        const canvas = document.getElementById('canvas');
        if (canvas) {
            canvas.classList.add('camera-shake');
            setTimeout(() => canvas.classList.remove('camera-shake'), 400);
        }

        // Play warp sound
        this.playWarpSound();

        // Remove flash after animation
        setTimeout(() => {
            flash.remove();
        }, 600);
    }

    /**
     * Play warp sound effect using Web Audio API
     */
    playWarpSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();

            // Low frequency sweep (whoosh)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(60, ctx.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
            osc1.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.4);

            gain1.gain.setValueAtTime(0, ctx.currentTime);
            gain1.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
            gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

            osc1.connect(gain1);
            gain1.connect(ctx.destination);

            // High frequency shimmer
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(2000, ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);

            gain2.gain.setValueAtTime(0, ctx.currentTime);
            gain2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.08);
            gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            osc2.connect(gain2);
            gain2.connect(ctx.destination);

            osc1.start();
            osc2.start();
            osc1.stop(ctx.currentTime + 0.5);
            osc2.stop(ctx.currentTime + 0.5);

        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    setupSpAIceButton() {
        const spAIceBtn = document.getElementById('spaice-btn');
        if (!spAIceBtn) {
            console.warn('⚠️ SpAIce button not found in DOM');
            return;
        }

        spAIceBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🤖 SpAIce button clicked!');
            this.narrateClosestPlanet();
        });

        console.log('✅ SpAIce floating button initialized');
        
        // Setup multiplayer button
        const mpBtn = document.getElementById('multiplayer-btn');
        if (mpBtn) {
            mpBtn.addEventListener('click', () => {
                this.toggleMultiplayer();
            });
            console.log('✅ Multiplayer button initialized');
        }
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
