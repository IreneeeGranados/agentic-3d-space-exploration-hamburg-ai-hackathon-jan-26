import * as THREE from 'three';
import { SceneManager } from './src/core/Scene.js';
import { CameraManager } from './src/core/Camera.js';
import { RendererManager } from './src/core/Renderer.js';
import { Planet } from './src/objects/Planet.js';
import { Star } from './src/objects/Star.js';
import { StarField } from './src/objects/StarField.js';
import { PLANETS_DATA } from './src/config/planets.js';
import { Universe } from './src/objects/Universe.js';
import { Spacecraft } from './src/objects/Spacecraft.js';
import { aiService } from './src/services/AIService.js';

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

        // Keyboard state
        this.keys = { forward: false, backward: false, left: false, right: false, up: false, down: false };
        this.setupControls();

        // Mouse state for steering
        this.mouse = { x: 0, y: 0 };
        this.setupMouse();

        // Create scene objects
        this.createSceneObjects();

        // Start animation loop
        this.animate();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        console.log('App Initialized');
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.up = true;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.down = true;
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = true;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = true;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.boost = true;
            if (e.code === 'Space') this.keys.brake = true;
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
            cursor.style.left = `${e.clientX}px`;
            cursor.style.top = `${e.clientY}px`;

            // Add active style (glow red when steering hard)
            // Tweak to match actual deadzone of 0.15
            if (Math.abs(this.mouse.x) > 0.15 || Math.abs(this.mouse.y) > 0.15) {
                cursor.style.borderBottomColor = '#ff0055';
                cursor.style.filter = 'drop-shadow(0 0 15px #ff0055)';
            } else {
                cursor.style.borderBottomColor = '#00d4ff';
                cursor.style.filter = 'drop-shadow(0 0 10px #00d4ff)';
            }
        });

        // Hide default cursor on canvas hover
        this.canvas.style.cursor = 'none';

        // Raycasting for planet selection
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        // Use window listener to ensure we catch clicks over overlay elements if necessary
        window.addEventListener('click', (event) => {
            console.log('Window Click Detected', event.clientX, event.clientY);

            // Calculate mouse position in normalized device coordinates (-1 to +1) for raycasting
            // Use window dimensions since we want full screen raycasting potentially
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            if (this.cameraManager && this.cameraManager.camera) {
                raycaster.setFromCamera(mouse, this.cameraManager.camera);

                // Get all planet meshes to check for intersection
                // Ensure we are checking children recursively if needed
                const planetMeshes = this.planets.map(p => p.mesh);

                // Allow recursive checking in case mesh has children
                const intersects = raycaster.intersectObjects(this.sceneManager.scene.children, true);

                if (intersects.length > 0) {
                    // Filter for planets only
                    // We need to traverse up from the intersection object to see if it belongs to a planet
                    const hit = intersects.find(intersect => {
                        let obj = intersect.object;
                        // Check if this object or any parent is one of our planets
                        while (obj) {
                            if (this.planets.some(p => p.mesh === obj || p.group === obj)) {
                                return true;
                            }
                            obj = obj.parent;
                        }
                        return false;
                    });

                    if (hit) {
                        let selectedObject = hit.object;
                        // Trace back to the planet object
                        let selectedPlanet = this.planets.find(p => p.mesh === selectedObject || p.group === selectedObject);

                        // If direct match failed, try walking up parents
                        if (!selectedPlanet) {
                            let obj = selectedObject;
                            while (obj) {
                                selectedPlanet = this.planets.find(p => p.mesh === obj || p.group === obj);
                                if (selectedPlanet) break;
                                obj = obj.parent;
                            }
                        }

                        if (selectedPlanet) {
                            console.log('Planet Selected via Raycast:', selectedPlanet.config.name);

                            // Get world position
                            const targetPosition = new THREE.Vector3();
                            selectedObject.getWorldPosition(targetPosition);

                            this.spacecraft.engageAutopilot(targetPosition);

                            // Update HUD with selection
                            const hud = document.getElementById('hud-status');
                            if (hud) hud.textContent = `Autopilot: ${selectedPlanet.config.name}`;
                        }
                    } else {
                        console.log('Raycast did not hit a planet. Hit:', intersects[0].object.type);
                    }
                } else {
                    console.log('Raycast hit nothing.');
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
        });
    }

    createSceneObjects() {
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

        // Create planets
        this.planets = PLANETS_DATA.map(planetData => {
            const planet = new Planet(planetData);
            this.sceneManager.add(planet.group);
            return planet;
        });

        // Create spacecraft
        this.spacecraft = new Spacecraft();
        this.sceneManager.add(this.spacecraft.group);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = 0.016; // ~60 FPS

        // Update universe rotation
        if (this.universe) {
            this.universe.update();
        }

        // Update all planets
        if (this.planets) {
            this.planets.forEach(planet => planet.update());
        }

        // Control spacecraft
        if (this.spacecraft) {
            // Steer spacecraft with keyboard and mouse
            this.spacecraft.steer(this.keys, deltaTime, this.mouse);

            // Update spacecraft animation
            this.spacecraft.update(deltaTime);

            // Update camera to follow spacecraft
            this.spacecraft.updateCamera(this.cameraManager.camera);

            // Update HUD
            this.updateHUD();
        }

        // Render the scene
        this.rendererManager.render(
            this.sceneManager.scene,
            this.cameraManager.camera
        );
    }

    updateHUD() {
        const speedElement = document.getElementById('hud-speed');
        if (speedElement && this.spacecraft) {
            const speed = this.spacecraft.getSpeed();
            speedElement.textContent = speed.toFixed(1);
        }

        const coordsElement = document.getElementById('hud-coords');
        if (coordsElement && this.spacecraft) {
            const pos = this.spacecraft.getPosition();
            coordsElement.textContent = `${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}, ${pos.z.toFixed(0)}`;
        }
    }

    onWindowResize() {
        this.cameraManager.updateAspect(this.canvas);
        this.rendererManager.updateSize(this.canvas);
    }

    dispose() {
        this.planets?.forEach(planet => planet.dispose());
        this.rendererManager.dispose();
    }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new App());
} else {
    new App();
}
