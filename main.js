import * as THREE from 'three';
import { SceneManager } from './src/core/Scene.js';
import { CameraManager } from './src/core/Camera.js';
import { RendererManager } from './src/core/Renderer.js';
import { Planet } from './src/objects/Planet.js';
import { Star } from './src/objects/Star.js';
import { StarField } from './src/objects/StarField.js';
import { PLANETS_DATA, loadSolarSystemPlanets } from './src/config/planets.js';
import { Universe } from './src/objects/Universe.js';
import { Spacecraft } from './src/objects/Spacecraft.js';
import { PlanetDataService } from './src/services/PlanetDataService.js';
import { ExoplanetField } from './src/objects/ExoplanetField.js';
import { LoadingManager } from './src/utils/LoadingManager.js';
import { TeleportManager } from './src/utils/TeleportManager.js';
import { PlanetSelector } from './src/controls/PlanetSelector.js';
import { PlanetHoverInfo } from './src/utils/PlanetHoverInfo.js';

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
            this.loadingManager.completeStep('Engine');

            // Step 2: Setup controls
            this.loadingManager.updateStatus('Configuring Controls', 'Mapping keyboard and mouse...');
            this.keys = { forward: false, backward: false, left: false, right: false, up: false, down: false };
            this.setupControls();
            this.mouse = { x: 0, y: 0 };
            this.setupMouse();
            this.loadingManager.completeStep('Controls');

            this.loadingManager.updateStatus('Building Universe', 'Creating stars and planets...');
            await this.createSceneObjects();
            await this.loadExoplanets();
            this.initPlanetSelector();
            this.loadingManager.completeStep('Universe');

            // Step 4: Start animation and finalize
            this.loadingManager.updateStatus('Starting Mission', 'Engaging warp drive...');

            // Setup UI controls
            this.setupUIControls();

            // Handle window resize
            window.addEventListener('resize', () => this.onWindowResize());

            this.animate();
            this.loadingManager.completeStep('Animation');

            // Finish loading
            this.loadingManager.finish();

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
            if (e.code === 'KeyT') this.togglePlanetSelector();
            if (e.code === 'KeyE') this.toggleExoplanets();
            if (e.code === 'KeyH') this.toggleUI();
            if (e.code === 'Escape') this.closePlanetSelector();
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
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

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
                        // Check if it's an exoplanet
                        if (hit.object.userData && hit.object.userData.planetData) {
                            const planetData = hit.object.userData.planetData;
                            console.log('Exoplanet Selected:', planetData.pl_name);

                            if (this.teleportManager) {
                                this.teleportManager.teleportToPlanet(planetData);
                            }
                        } else {
                            // Solar system planet
                            let selectedObject = hit.object;
                            let selectedPlanet = this.planets.find(p => p.mesh === selectedObject || p.group === selectedObject);

                            if (!selectedPlanet) {
                                let obj = selectedObject;
                                while (obj) {
                                    selectedPlanet = this.planets.find(p => p.mesh === obj || p.group === obj);
                                    if (selectedPlanet) break;
                                    obj = obj.parent;
                                }
                            }

                            if (selectedPlanet) {
                                console.log('Planet Selected:', selectedPlanet.config.name);
                                const targetPosition = new THREE.Vector3();
                                selectedObject.getWorldPosition(targetPosition);
                                this.spacecraft.engageAutopilot(targetPosition);
                            }
                        }
                    }
                }
            }
        });

        // Speed Controls (Keyboard)
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
        // Create the universe background
        this.universe = new Universe(4000);
        this.sceneManager.add(this.universe.mesh);

        // Create background starfield
        const starField = new StarField(15000, 3500);
        this.sceneManager.add(starField.mesh);

        // Create central star (Sun)
        const sun = new Star({
            radius: 20,
            color: 0xffff00,
            emissiveIntensity: 2
        });
        this.sceneManager.add(sun.mesh);

        // Load solar system planets from dataset
        console.log('🌍 Loading solar system planet data from dataset...');
        const planetsData = await loadSolarSystemPlanets();

        // Create solar system planets with accurate dimensions from dataset
        this.planets = planetsData.map(planetData => {
            console.log(`  ✓ ${planetData.name}: radius=${planetData.radius.toFixed(3)} (${planetData.datasetValues?.pl_rade || 'N/A'} Earth radii)`);
            const planet = new Planet(planetData);
            this.sceneManager.add(planet.group);
            return planet;
        });

        console.log(`✓ Created ${this.planets.length} solar system planets with dataset dimensions`);

        // Create spacecraft
        this.spacecraft = new Spacecraft();
        this.sceneManager.add(this.spacecraft.group);
    }

    async loadExoplanets() {
        // Initialize data service
        this.planetDataService = new PlanetDataService();

        // Initialize cluster index first
        await this.planetDataService.initialize();

        // Create and load NASA exoplanet visualization
        this.exoplanetField = new ExoplanetField(this.planetDataService);
        await this.exoplanetField.load();

        if (this.exoplanetField.mesh) {
            this.sceneManager.add(this.exoplanetField.mesh);
            console.log('✓ NASA exoplanets added to scene');
        }

        console.log(`✓ Total visualization: ${this.planets.length} solar system + ${this.planetDataService.getAllPlanets().length} exoplanets`);
    }

    initPlanetSelector() {
        // Initialize teleport manager (correct parameters: spacecraft, camera)
        this.teleportManager = new TeleportManager(
            this.spacecraft,
            this.cameraManager.camera
        );

        // Initialize planet selector UI (correct parameters: dataService, teleportManager)
        this.planetSelector = new PlanetSelector(
            this.planetDataService,
            this.teleportManager
        );

        // Initialize planet hover info
        this.planetHoverInfo = new PlanetHoverInfo(
            this.sceneManager.scene,
            this.cameraManager.camera,
            this.canvas,
            this.planets
        );

        console.log('✓ Planet selector and teleport initialized');
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

    togglePlanetSelector() {
        if (this.planetSelector) {
            this.planetSelector.toggle();
        }
    }

    closePlanetSelector() {
        if (this.planetSelector) {
            this.planetSelector.hide();
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

    closeModal() {
        const modal = document.getElementById('planet-modal');
        const overlay = document.getElementById('modal-overlay');
        if (modal) modal.classList.remove('visible');
        if (overlay) overlay.classList.remove('visible');
    }

    updateHUD() {
        if (!this.spacecraft) return;

        const velocity = this.spacecraft.velocity.length();
        const position = this.spacecraft.mesh.position;
        const rotation = this.spacecraft.mesh.rotation;

        // Update velocity
        const velElem = document.getElementById('hud-velocity');
        if (velElem) velElem.textContent = `${velocity.toFixed(2)} u/s`;

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
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = 0.016; // ~60 FPS

        // Update universe rotation
        if (this.universe) {
            this.universe.update();
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
