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
import { PLANETS_DATA } from './src/config/planets.js';
import { Universe } from './src/objects/Universe.js';
import { Spacecraft } from './src/objects/Spacecraft.js';
import { aiService } from './src/services/AIService.js';
import { planetService } from './src/services/FrontendPlanetService.js';


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
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.up = false;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.down = false;
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false;
        });
    }

    setupMouse() {
        // Track mouse position relative to center (for steering)
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Normalize -1 to 1 based on distance from center
            // Sensitive zone: full steering at 50% distance to edge
            this.mouse.x = (e.clientX - rect.left - centerX) / (centerX * 0.8);
            this.mouse.y = (e.clientY - rect.top - centerY) / (centerY * 0.8);

            // Clamp to -1 to 1
            this.mouse.x = Math.max(-1, Math.min(1, this.mouse.x));
            this.mouse.y = Math.max(-1, Math.min(1, this.mouse.y));

            // Update visual cursor
            const cursor = document.getElementById('flight-cursor');
            if (cursor) {
                cursor.style.left = `${e.clientX}px`;
                cursor.style.top = `${e.clientY}px`;

                // Add active style if steering hard
                if (Math.abs(this.mouse.x) > 0.3 || Math.abs(this.mouse.y) > 0.3) {
                    cursor.classList.add('flight-cursor-active');
                } else {
                    cursor.classList.remove('flight-cursor-active');
                }
            }
        });

        // Hide default cursor on canvas hover
        this.canvas.style.cursor = 'none';

        // Handle pointer lock click (optional, but good for immersive flight)
        this.canvas.addEventListener('click', () => {
            this.canvas.requestPointerLock();
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

        // Load NASA Data
        this.loadNasaContent();
    }

    async loadNasaContent() {
        console.log('🚀 Loading NASA exoplanet data...');

        try {
            const nasaPlanets = await planetService.loadNasaData();
            if (nasaPlanets && nasaPlanets.length > 0) {
                this.renderNasaPlanets(nasaPlanets);
            } else {
                console.warn('No NASA planets returned');
            }
        } catch (error) {
            console.error('Failed to load NASA data:', error);
        }
    }

    renderNasaPlanets(planets) {
        // Filter planets with valid 3D coordinates
        const planetsWithCoords = planets.filter(p =>
            p.characteristics?.coordinates_3d?.x_light_years != null
        );

        console.log(`🌍 Rendering ${planetsWithCoords.length} NASA planets with procedural textures...`);

        // Store NASA planet objects for later reference (search, fly-to, etc.)
        this.nasaPlanets = [];
        this.nasaPlanetMeshes = new Map();

        // Scale factor: Convert light-years to scene units
        // Original planets orbit at 40-260 units from center
        // Nearby exoplanets are 0-100 light-years away
        // Scale: 1 light-year = 3 units (so 100 ly = 300 units, spread nicely)
        const SCALE_FACTOR = 3;

        planetsWithCoords.forEach((p, index) => {
            const coords = p.characteristics.coordinates_3d;
            const chars = p.characteristics;

            // Determine planet type based on radius_position
            let planetType = 'rocky';
            let color = 0x888888;
            let detailColor = 0x666666;
            let gasColors = null;
            let radius = 2;

            const radiusPos = chars.radius_position;

            if (radiusPos === 'Jupiter-like') {
                planetType = 'gasGiant';
                gasColors = this.getGasGiantColors(chars.habitability_percent);
                radius = 5 + Math.random() * 2;
            } else if (radiusPos === 'Neptune-like') {
                planetType = 'iceGiant';
                color = this.getIceGiantColor(chars.habitability_percent);
                radius = 3.5 + Math.random() * 1.5;
            } else if (radiusPos === 'Super-Earth') {
                planetType = 'rocky';
                const colors = this.getRockyColors(chars.habitability_percent, chars.toxicity_percent);
                color = colors.base;
                detailColor = colors.detail;
                radius = 2.5 + Math.random() * 1;
            } else {
                // Sub-Earth or Unknown
                planetType = 'rocky';
                const colors = this.getRockyColors(chars.habitability_percent, chars.toxicity_percent);
                color = colors.base;
                detailColor = colors.detail;
                radius = 1.5 + Math.random() * 1;
            }

            // Create planet using Planet class
            const planet = new Planet({
                name: p.pl_name,
                planetType: planetType,
                radius: radius,
                color: color,
                detailColor: detailColor,
                gasColors: gasColors,
                position: {
                    x: coords.x_light_years * SCALE_FACTOR,
                    y: coords.y_light_years * SCALE_FACTOR,
                    z: coords.z_light_years * SCALE_FACTOR
                },
                orbitRadius: 0, // Static position
                orbitSpeed: 0,
                rotationSpeed: 0.002 + Math.random() * 0.008,
                tilt: Math.random() * 0.5
            });

            // Store reference data
            planet.mesh.userData = {
                type: 'nasaPlanet',
                isNasaPlanet: true,
                name: p.pl_name,
                hostname: p.hostname,
                data: p
            };

            this.sceneManager.add(planet.group);
            this.nasaPlanets.push(planet);
            this.nasaPlanetMeshes.set(p.pl_name, planet.mesh);
        });

        console.log(`✅ Rendered ${this.nasaPlanetMeshes.size} NASA exoplanets with realistic visuals`);
    }

    // Color helpers for planet generation
    getRockyColors(habitability, toxicity) {
        if (habitability > 60) {
            // Earth-like (blue/green)
            return { base: 0x4a90e2, detail: 0x2d8a5a };
        } else if (habitability > 30) {
            // Mars-like (red/orange)
            return { base: 0xcd5c5c, detail: 0x8b3a3a };
        } else if (toxicity > 70) {
            // Venus-like (yellow/orange)
            return { base: 0xffc649, detail: 0xe6b85c };
        } else {
            // Mercury-like (gray/brown)
            return { base: 0x8c7853, detail: 0x6b5d4f };
        }
    }

    getGasGiantColors(habitability) {
        if (habitability > 40) {
            // Saturn-like (golden)
            return [0xfad5a5, 0xf4c78a, 0xe8b975, 0xd4a05a];
        } else {
            // Jupiter-like (orange/brown)
            return [0xc88b3a, 0xe6a85c, 0xf4d7a8, 0xd4a05a];
        }
    }

    getIceGiantColor(habitability) {
        if (habitability > 30) {
            // Uranus-like (cyan)
            return 0x4fd0e7;
        } else {
            // Neptune-like (blue)
            return 0x4169e1;
        }
    }


    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = 0.016; // ~60 FPS

        // Update universe rotation
        if (this.universe) {
            this.universe.update();
        }

        // Update all planets (including NASA planets)
        if (this.planets) {
            this.planets.forEach(planet => planet.update());
        }
        if (this.nasaPlanets) {
            this.nasaPlanets.forEach(planet => planet.update());
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

    setupSearch() {
        const searchInput = document.getElementById('planet-search');
        const searchResults = document.getElementById('search-results');

        if (!searchInput || !searchResults) return;

        let debounceTimer;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const query = e.target.value.trim().toLowerCase();

            if (query.length < 2) {
                searchResults.classList.remove('active');
                searchResults.innerHTML = '';
                return;
            }

            debounceTimer = setTimeout(() => {
                this.performSearch(query);
            }, 200);
        });

        // Hide results when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.classList.remove('active');
            }
        });

        // Show results when focusing on input
        searchInput.addEventListener('focus', () => {
            if (searchResults.innerHTML) {
                searchResults.classList.add('active');
            }
        });
    }

    performSearch(query) {
        const searchResults = document.getElementById('search-results');
        if (!this.nasaPlanetMeshes || this.nasaPlanetMeshes.size === 0) {
            searchResults.innerHTML = '<div class="search-result-item">Loading planets...</div>';
            searchResults.classList.add('active');
            return;
        }

        // Search through loaded planets
        const matches = [];
        this.nasaPlanetMeshes.forEach((mesh, name) => {
            if (name.toLowerCase().includes(query) ||
                mesh.userData.hostname?.toLowerCase().includes(query)) {
                matches.push({ name, mesh, data: mesh.userData.data });
            }
        });

        // Limit results
        const limited = matches.slice(0, 10);

        if (limited.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item">No planets found</div>';
        } else {
            searchResults.innerHTML = limited.map(m => {
                const chars = m.data?.characteristics || {};
                const habitability = chars.habitability_percent || 0;
                let badgeClass = 'habitability-low';
                if (habitability > 60) badgeClass = 'habitability-high';
                else if (habitability > 30) badgeClass = 'habitability-medium';

                return `
                    <div class="search-result-item" data-planet="${m.name}">
                        <div class="planet-name">
                            ${m.name}
                            <span class="habitability-badge ${badgeClass}">${habitability}%</span>
                        </div>
                        <div class="planet-details">
                            Host: ${m.data?.hostname || 'Unknown'} | 
                            ${chars.distance_to_earth_ly?.toFixed(1) || '?'} ly | 
                            ${chars.radius_position || 'Unknown type'}
                        </div>
                    </div>
                `;
            }).join('');

            // Add click handlers
            searchResults.querySelectorAll('.search-result-item[data-planet]').forEach(item => {
                item.addEventListener('click', () => {
                    const planetName = item.dataset.planet;
                    this.flyToPlanet(planetName);
                    searchResults.classList.remove('active');
                    document.getElementById('planet-search').value = planetName;
                });
            });
        }

        searchResults.classList.add('active');
    }

    flyToPlanet(planetName) {
        const mesh = this.nasaPlanetMeshes?.get(planetName);
        if (!mesh) {
            console.warn(`Planet ${planetName} not found`);
            return;
        }

        // Get world position of the mesh using THREE.Vector3
        import('three').then(THREE => {
            const targetPos = mesh.getWorldPosition(new THREE.Vector3());
            console.log(`🚀 Flying to ${planetName} at`, targetPos);

            // Move spacecraft to planet location (with offset so we don't land inside it)
            if (this.spacecraft) {
                // Offset slightly so we approach from a viewable distance
                const offset = 20; // 20 units offset
                this.spacecraft.group.position.set(
                    targetPos.x + offset,
                    targetPos.y + offset,
                    targetPos.z + offset
                );

                // Make spacecraft face the planet
                this.spacecraft.group.lookAt(targetPos);
            }

            // Update planet info panel
            const infoEl = document.getElementById('planet-info');
            if (infoEl && mesh.userData.data) {
                const p = mesh.userData.data;
                const chars = p.characteristics || {};
                infoEl.innerHTML = `
                    <strong>${p.pl_name}</strong><br>
                    Host Star: ${p.hostname}<br>
                    Distance: ${chars.distance_to_earth_ly?.toFixed(2) || '?'} light-years<br>
                    Type: ${chars.radius_position || 'Unknown'}<br>
                    Habitability: ${chars.habitability_percent || 0}%
                `;
            }
        });
    }

    dispose() {
        this.planets?.forEach(planet => planet.dispose());
        this.nasaPlanets?.forEach(planet => planet.dispose());
        this.rendererManager.dispose();
    }
}

// Store app instance globally for debugging
let appInstance = null;

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        appInstance = new App();
        appInstance.setupSearch();
    });
} else {
    appInstance = new App();
    appInstance.setupSearch();
}
