/**
 * PlanetSelector - Vaporwave UI control for planet selection and teleportation
 * Follows modular architecture with separation of concerns
 */
export class PlanetSelector {
    constructor(planetDataService, teleportManager) {
        this.dataService = planetDataService;
        this.teleportManager = teleportManager;
        this.isVisible = false;
        this.selectedPlanet = null;
        this.filteredPlanets = [];
        this.hoveredPlanet = null;
        
        this.init();
    }

    init() {
        this.createUI();
        this.attachEventListeners();
    }

    createUI() {
        this.container = document.createElement('div');
        this.container.id = 'planet-selector';
        this.container.className = 'planet-selector hidden';
        
        this.container.innerHTML = `
            <div class="vaporwave-container">
                <div class="vw-grid-bg"></div>
                
                <div class="selector-header">
                    <h1 class="vw-title">
                        <span class="glitch" data-text="◢ PLANET SELECTOR ◣">◢ PLANET SELECTOR ◣</span>
                    </h1>
                    <button class="vw-close-btn" id="close-selector">×</button>
                </div>

                <div class="selector-controls">
                    <div class="search-bar">
                        <span class="search-icon">🔍</span>
                        <input 
                            type="text" 
                            id="planet-search" 
                            placeholder="SEARCH EXOPLANETS..."
                            class="vw-input"
                        />
                    </div>
                    
                    <div class="filter-controls">
                        <div class="filter-group">
                            <label class="vw-label">HABITABILITY</label>
                            <input type="range" id="habitability-filter" min="0" max="100" value="0" class="vw-slider" />
                            <span class="vw-value" id="habitability-value">0%+</span>
                        </div>
                        
                        <div class="filter-group">
                            <label class="vw-label">MAX DISTANCE</label>
                            <input type="range" id="distance-filter" min="10" max="1000" value="1000" class="vw-slider" />
                            <span class="vw-value" id="distance-value">1000 ly</span>
                        </div>

                        <button id="reset-filters" class="vw-btn secondary">RESET</button>
                    </div>
                </div>

                <div class="planet-list-container">
                    <div id="planet-count" class="planet-count">INITIALIZING...</div>
                    <div id="planet-list" class="planet-list">
                        <div class="loading-animation">
                            <div class="vw-spinner"></div>
                            <p>LOADING EXOPLANET DATABASE...</p>
                        </div>
                    </div>
                </div>

                <div id="selected-planet-info" class="selected-planet-info hidden">
                    <h3 class="vw-subtitle">▸ SELECTED DESTINATION</h3>
                    <div id="planet-details" class="detail-grid"></div>
                    <button id="teleport-btn" class="vw-btn primary pulse">
                        ⚡ INITIATE TELEPORT ⚡
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
    }

    attachEventListeners() {
        document.getElementById('close-selector').addEventListener('click', () => this.hide());
        document.getElementById('planet-search').addEventListener('input', (e) => this.handleSearch(e.target.value));
        
        document.getElementById('habitability-filter').addEventListener('input', (e) => {
            document.getElementById('habitability-value').textContent = `${e.target.value}%+`;
            this.applyFilters();
        });

        document.getElementById('distance-filter').addEventListener('input', (e) => {
            document.getElementById('distance-value').textContent = `${e.target.value} ly`;
            this.applyFilters();
        });

        document.getElementById('reset-filters').addEventListener('click', () => this.resetFilters());
        document.getElementById('teleport-btn').addEventListener('click', () => {
            if (this.selectedPlanet) this.teleport(this.selectedPlanet);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) this.hide();
        });
    }

    async loadPlanets() {
        try {
            await this.dataService.loadNearbyFirst();
            this.filteredPlanets = this.dataService.getAllPlanets();
            this.renderPlanetList();
            
            this.dataService.loadAllClusters().then(() => {
                this.filteredPlanets = this.dataService.getAllPlanets();
                this.renderPlanetList();
            });
        } catch (error) {
            console.error('Error loading planets:', error);
            document.getElementById('planet-count').textContent = 'ERROR LOADING DATA';
        }
    }

    handleSearch(query) {
        this.applyFilters();
    }

    applyFilters() {
        const searchQuery = document.getElementById('planet-search').value;
        const minHabitability = parseInt(document.getElementById('habitability-filter').value);
        const maxDistance = parseInt(document.getElementById('distance-filter').value);

        this.filteredPlanets = this.dataService.filter({
            name: searchQuery,
            minHabitability: minHabitability,
            maxDistance: maxDistance
        });

        this.renderPlanetList();
    }

    resetFilters() {
        document.getElementById('planet-search').value = '';
        document.getElementById('habitability-filter').value = '0';
        document.getElementById('distance-filter').value = '1000';
        document.getElementById('habitability-value').textContent = '0%+';
        document.getElementById('distance-value').textContent = '1000 ly';
        
        this.filteredPlanets = this.dataService.getAllPlanets();
        this.renderPlanetList();
    }

    renderPlanetList() {
        const listContainer = document.getElementById('planet-list');
        const countElement = document.getElementById('planet-count');
        
        countElement.textContent = `${this.filteredPlanets.length} PLANETS FOUND`;

        if (this.filteredPlanets.length === 0) {
            listContainer.innerHTML = '<div class="no-results">NO PLANETS MATCH CRITERIA</div>';
            return;
        }

        const planetsToShow = this.filteredPlanets.slice(0, 100);
        
        listContainer.innerHTML = planetsToShow.map(planet => this.createPlanetCard(planet)).join('');

        listContainer.querySelectorAll('.planet-card').forEach(card => {
            const planetName = card.dataset.planetName;
            const planet = this.dataService.getPlanetByName(planetName);
            
            card.addEventListener('click', () => this.selectPlanet(planet));
            card.addEventListener('mouseenter', () => this.showPlanetTooltip(planet, card));
            card.addEventListener('mouseleave', () => this.hidePlanetTooltip());
        });

        if (this.filteredPlanets.length > 100) {
            listContainer.innerHTML += `
                <div class="more-results">
                    DISPLAYING 100 OF ${this.filteredPlanets.length} RESULTS
                    <br>REFINE SEARCH FOR MORE
                </div>
            `;
        }
    }

    createPlanetCard(planet) {
        const chars = planet.characteristics || {};
        const habitability = chars.habitability_percent || 0;
        const distance = planet.sy_dist ? (planet.sy_dist * 3.262).toFixed(1) : 'Unknown';
        const planetType = chars.radius_position || 'Unknown';
        
        const habitabilityClass = habitability > 70 ? 'high' : habitability > 40 ? 'medium' : 'low';
        
        return `
            <div class="planet-card" data-planet-name="${planet.pl_name}">
                <div class="card-glow"></div>
                <div class="planet-card-header">
                    <h4 class="planet-name">${planet.pl_name || 'UNKNOWN'}</h4>
                    <span class="planet-distance">${distance} ly</span>
                </div>
                <div class="planet-stats">
                    <div class="stat">
                        <span class="stat-label">TYPE</span>
                        <span class="stat-value">${planetType}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">HABITABILITY</span>
                        <div class="stat-bar ${habitabilityClass}">
                            <div class="stat-bar-fill" style="width: ${habitability}%"></div>
                            <div class="stat-bar-glow" style="width: ${habitability}%"></div>
                        </div>
                        <span class="stat-percentage">${habitability}%</span>
                    </div>
                </div>
            </div>
        `;
    }

    selectPlanet(planet) {
        this.selectedPlanet = planet;
        
        document.querySelectorAll('.planet-card').forEach(card => card.classList.remove('selected'));
        const selectedCard = document.querySelector(`[data-planet-name="${planet.pl_name}"]`);
        if (selectedCard) selectedCard.classList.add('selected');

        this.showPlanetDetails(planet);
    }

    showPlanetDetails(planet) {
        const infoPanel = document.getElementById('selected-planet-info');
        const detailsContainer = document.getElementById('planet-details');
        
        infoPanel.classList.remove('hidden');

        const chars = planet.characteristics || {};
        const coords = chars.coordinates_3d || {};
        const distance = planet.sy_dist ? (planet.sy_dist * 3.262).toFixed(2) : 'Unknown';
        
        detailsContainer.innerHTML = `
            <div class="detail-item">
                <span class="detail-label">NAME</span>
                <span class="detail-value">${planet.pl_name || 'Unknown'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">CLASSIFICATION</span>
                <span class="detail-value">${chars.radius_position || 'Unknown'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">DISTANCE</span>
                <span class="detail-value">${distance} LY</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">HABITABILITY</span>
                <span class="detail-value ${this.getHabitabilityClass(chars.habitability_percent)}">${chars.habitability_percent || 0}%</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">TOXICITY</span>
                <span class="detail-value ${this.getToxicityClass(chars.toxicity_percent)}">${chars.toxicity_percent || 0}%</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">ATMOSPHERE</span>
                <span class="detail-value">${chars.atmosphere_type || 'Unknown'}</span>
            </div>
            <div class="detail-item full-width">
                <span class="detail-label">COORDINATES</span>
                <span class="detail-value mono">
                    X: ${coords.x_light_years?.toFixed(1) || '?'} 
                    Y: ${coords.y_light_years?.toFixed(1) || '?'} 
                    Z: ${coords.z_light_years?.toFixed(1) || '?'}
                </span>
            </div>
        `;
    }

    showPlanetTooltip(planet, cardElement) {
        this.hoveredPlanet = planet;
        
        let tooltip = document.getElementById('planet-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'planet-tooltip';
            tooltip.className = 'planet-tooltip';
            document.body.appendChild(tooltip);
        }

        const chars = planet.characteristics || {};
        const orbPeriod = planet.pl_orbper ? `${(planet.pl_orbper / 365).toFixed(1)} years` : 'Unknown';
        const mass = planet.pl_bmasse ? `${planet.pl_bmasse.toFixed(1)} M⊕` : 'Unknown';
        const radius = planet.pl_rade ? `${planet.pl_rade.toFixed(1)} R⊕` : 'Unknown';
        
        tooltip.innerHTML = `
            <div class="tooltip-header">${planet.pl_name}</div>
            <div class="tooltip-content">
                <div class="tooltip-row"><span>Host Star:</span> ${planet.hostname || 'Unknown'}</div>
                <div class="tooltip-row"><span>Discovered:</span> ${planet.disc_year || 'Unknown'}</div>
                <div class="tooltip-row"><span>Method:</span> ${planet.discoverymethod || 'Unknown'}</div>
                <div class="tooltip-row"><span>Mass:</span> ${mass}</div>
                <div class="tooltip-row"><span>Radius:</span> ${radius}</div>
                <div class="tooltip-row"><span>Orbital Period:</span> ${orbPeriod}</div>
                <div class="tooltip-row"><span>Material:</span> ${chars.principal_material || 'Unknown'}</div>
                <div class="tooltip-row"><span>Orbit Type:</span> ${chars.orbit_type || 'Unknown'}</div>
            </div>
        `;

        const rect = cardElement.getBoundingClientRect();
        tooltip.style.left = `${rect.right + 10}px`;
        tooltip.style.top = `${rect.top}px`;
        tooltip.classList.add('visible');
    }

    hidePlanetTooltip() {
        const tooltip = document.getElementById('planet-tooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
        this.hoveredPlanet = null;
    }

    teleport(planet) {
        // Validate planet has coordinates
        if (!planet.characteristics?.coordinates_3d?.x_light_years) {
            alert(`Cannot teleport to ${planet.pl_name}: No 3D coordinates available in dataset.`);
            console.warn('Planet missing coordinates:', planet);
            return;
        }

        this.teleportManager.teleportWithEffect(planet, () => {
            console.log(`Teleported to ${planet.pl_name}`);
            
            const hudStatus = document.getElementById('hud-status');
            if (hudStatus) hudStatus.textContent = `En Route: ${planet.pl_name}`;
        });

        this.hide();
    }

    show() {
        this.isVisible = true;
        this.container.classList.remove('hidden');
        
        if (this.dataService.getAllPlanets().length === 0) {
            this.loadPlanets();
        } else {
            this.renderPlanetList();
        }
    }

    hide() {
        this.isVisible = false;
        this.container.classList.add('hidden');
        this.hidePlanetTooltip();
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    getHabitabilityClass(value) {
        if (!value) return '';
        if (value > 70) return 'value-high';
        if (value > 40) return 'value-medium';
        return 'value-low';
    }

    getToxicityClass(value) {
        if (!value) return '';
        if (value > 70) return 'value-danger';
        if (value > 40) return 'value-warning';
        return 'value-safe';
    }

    dispose() {
        this.hidePlanetTooltip();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
