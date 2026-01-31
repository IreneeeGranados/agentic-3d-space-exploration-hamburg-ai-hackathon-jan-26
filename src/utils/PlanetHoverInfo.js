/**
 * PlanetHoverInfo - Displays planet information on mouseover in 3D scene
 * Uses raycasting to detect planet hover events
 */
import * as THREE from 'three';
export class PlanetHoverInfo {
    constructor(camera, planets, planetDataService) {
        this.camera = camera;
        this.planets = planets;
        this.dataService = planetDataService;
        this.raycaster = null;
        this.mouse = { x: 0, y: 0 };
        this.hoveredPlanet = null;
        this.infoPanel = null;

        this.init();
    }

    init() {
        // Create raycaster for hover detection
        if (typeof THREE !== 'undefined') {
            this.raycaster = new THREE.Raycaster();
            this.raycaster.params.Points.threshold = 5;
        }

        // Create info panel
        this.createInfoPanel();

        // Setup mouse tracking
        this.setupMouseTracking();
    }

    createInfoPanel() {
        this.infoPanel = document.createElement('div');
        this.infoPanel.id = 'planet-hover-info';
        this.infoPanel.className = 'planet-hover-info hidden';
        this.infoPanel.innerHTML = `
            <div class="hover-header"></div>
            <div class="hover-content"></div>
        `;
        document.body.appendChild(this.infoPanel);
    }

    setupMouseTracking() {
        window.addEventListener('mousemove', (event) => {
            // Only track when not over UI elements
            if (event.target.tagName === 'CANVAS') {
                this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

                // Position info panel near cursor
                this.infoPanel.style.left = `${event.clientX + 20}px`;
                this.infoPanel.style.top = `${event.clientY - 20}px`;

                this.checkHover();
            } else {
                this.hideInfo();
            }
        });
    }

    async checkHover() {
        if (!this.raycaster || !this.camera) return;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Get all planet meshes
        const planetMeshes = this.planets.map(p => p.mesh);
        const intersects = this.raycaster.intersectObjects(planetMeshes, true);

        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;

            // Find the planet object
            const planet = this.planets.find(p =>
                p.mesh === intersectedObject ||
                p.group === intersectedObject ||
                (p.group && p.group.children.includes(intersectedObject))
            );

            if (planet && planet.config) {
                // Get enriched data from NASA dataset if available
                const enrichedData = this.dataService ?
                    this.dataService.getPlanetByName(planet.config.name) :
                    null;

                if (enrichedData) {
                    this.showEnrichedInfo(enrichedData);
                } else {
                    this.showBasicInfo(planet.config);
                }

                this.hoveredPlanet = planet;
            }
        } else {
            if (this.hoveredPlanet) {
                this.hideInfo();
                this.hoveredPlanet = null;
            }
        }
    }

    showBasicInfo(planetConfig) {
        const header = this.infoPanel.querySelector('.hover-header');
        const content = this.infoPanel.querySelector('.hover-content');

        header.textContent = planetConfig.name || 'Unknown Planet';

        content.innerHTML = `
            <div class="hover-row">
                <span>Distance:</span>
                <span>${planetConfig.distance?.toFixed(1) || 'Unknown'} AU</span>
            </div>
            <div class="hover-row">
                <span>Radius:</span>
                <span>${planetConfig.radius?.toFixed(1) || 'Unknown'} km</span>
            </div>
            <div class="hover-row">
                <span>Color:</span>
                <span style="color: #${planetConfig.color?.toString(16).padStart(6, '0') || 'ffffff'}">●</span>
            </div>
        `;

        this.infoPanel.classList.remove('hidden');
    }

    showEnrichedInfo(planetData) {
        const header = this.infoPanel.querySelector('.hover-header');
        const content = this.infoPanel.querySelector('.hover-content');

        const chars = planetData.characteristics || {};
        const distance = planetData.sy_dist ? (planetData.sy_dist * 3.262).toFixed(1) : 'Unknown';

        header.textContent = planetData.pl_name || 'Unknown';

        content.innerHTML = `
            <div class="hover-row">
                <span>Type:</span>
                <span>${chars.radius_position || 'Unknown'}</span>
            </div>
            <div class="hover-row">
                <span>Distance:</span>
                <span>${distance} light-years</span>
            </div>
            <div class="hover-row">
                <span>Habitability:</span>
                <span class="${this.getHabitabilityClass(chars.habitability_percent)}">
                    ${chars.habitability_percent || 0}%
                </span>
            </div>
            <div class="hover-row">
                <span>Atmosphere:</span>
                <span>${chars.atmosphere_type || 'Unknown'}</span>
            </div>
            <div class="hover-row">
                <span>Host Star:</span>
                <span>${planetData.hostname || 'Unknown'}</span>
            </div>
            ${planetData.disc_year ? `
                <div class="hover-row">
                    <span>Discovered:</span>
                    <span>${planetData.disc_year}</span>
                </div>
            ` : ''}
        `;

        this.infoPanel.classList.remove('hidden');
    }

    hideInfo() {
        this.infoPanel.classList.add('hidden');
    }

    getHabitabilityClass(value) {
        if (!value) return '';
        if (value > 70) return 'value-high';
        if (value > 40) return 'value-medium';
        return 'value-low';
    }

    update(camera) {
        // Update camera reference if needed
        if (camera) {
            this.camera = camera;
        }
    }

    dispose() {
        this.hideInfo();
        if (this.infoPanel && this.infoPanel.parentNode) {
            this.infoPanel.parentNode.removeChild(this.infoPanel);
        }
    }
}
