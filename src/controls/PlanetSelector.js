/**
 * PlanetSelector - NASA UI control for planet selection and teleportation
 * Works with existing NASA mission control HTML interface
 */
export class PlanetSelector {
    constructor(planetDataService, teleportManager) {
        this.dataService = planetDataService;
        this.teleportManager = teleportManager;
        this.isVisible = false;
        this.selectedPlanet = null;
        this.filteredPlanets = [];
        this.currentFilter = 'all';
        
        this.init();
    }

    init() {
        // Use existing HTML elements
        this.container = document.getElementById('planet-selector');
        this.searchInput = document.getElementById('planet-search');
        this.planetList = document.getElementById('planet-list');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        
        if (!this.container) {
            console.error('Planet selector container not found in HTML');
            return;
        }
        
        this.attachEventListeners();
        this.loadPlanets();
    }

    attachEventListeners() {
        // Search input
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
        
        // Filter buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.applyFilters();
            });
        });
        
        // Modal controls
        const modalClose = document.getElementById('modal-close');
        const modalTeleport = document.getElementById('modal-teleport');
        const modalOverlay = document.getElementById('modal-overlay');
        
        if (modalClose) modalClose.addEventListener('click', () => this.closeModal());
        if (modalOverlay) modalOverlay.addEventListener('click', () => this.closeModal());
        if (modalTeleport) modalTeleport.addEventListener('click', () => {
            if (this.selectedPlanet) {
                this.teleport(this.selectedPlanet);
                this.closeModal();
            }
        });
    }

    async loadPlanets() {
        try {
            // Ensure clusters are loaded
            if (!this.dataService.clusterIndex) {
                console.log('Initializing planet data service...');
                await this.dataService.initialize();
            }
            
            // Get all planets from data service
            this.filteredPlanets = this.dataService.getAllPlanets();
            
            // If no planets loaded yet, load them now
            if (this.filteredPlanets.length === 0) {
                console.log('Loading nearby planets...');
                await this.dataService.loadNearbyFirst();
                this.filteredPlanets = this.dataService.getAllPlanets();
                
                // Load all clusters in background
                this.dataService.loadAllClusters().then(() => {
                    this.filteredPlanets = this.dataService.getAllPlanets();
                    console.log(`Updated planet selector with ${this.filteredPlanets.length} total planets`);
                    this.renderPlanetList();
                });
            }
            
            console.log(`Planet selector loaded ${this.filteredPlanets.length} planets`);
            this.renderPlanetList();
        } catch (error) {
            console.error('Error loading planets:', error);
        }
    }

    handleSearch(query) {
        this.applyFilters();
    }

    applyFilters() {
        const searchQuery = this.searchInput?.value.toLowerCase() || '';
        const allPlanets = this.dataService.getAllPlanets();
        
        // Start with all planets
        let filtered = [...allPlanets];
        
        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(p => 
                p.pl_name?.toLowerCase().includes(searchQuery) ||
                p.hostname?.toLowerCase().includes(searchQuery)
            );
        }
        
        // Apply category filter
        if (this.currentFilter === 'solar') {
            // No exoplanets in selector, only for canvas
            filtered = [];
        } else if (this.currentFilter === 'nearby') {
            filtered = filtered.filter(p => {
                const dist = p.sy_dist || 0;
                return dist > 0 && dist < 100; // Within 100 parsecs (~326 light years)
            });
        } else if (this.currentFilter === 'habitable') {
            filtered = filtered.filter(p => 
                p.characteristics?.habitability_percent > 50
            );
        }
        
        this.filteredPlanets = filtered;
        this.renderPlanetList();
    }

    renderPlanetList() {
        if (!this.planetList) return;
        
        if (this.filteredPlanets.length === 0) {
            this.planetList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-dim);">No planets found</div>';
            return;
        }
        
        // Show first 50 planets for performance
        const planetsToShow = this.filteredPlanets.slice(0, 50);
        
        this.planetList.innerHTML = planetsToShow.map(planet => {
            const chars = planet.characteristics || {};
            const habitability = chars.habitability_percent || 0;
            const distance = planet.sy_dist ? (planet.sy_dist * 3.262).toFixed(1) : '?';
            
            const habitabilityClass = habitability > 70 ? 'high' : habitability > 40 ? 'medium' : 'low';
            
            return `
                <div class="planet-item" data-planet-name="${planet.pl_name}">
                    <div class="planet-item-name">${planet.pl_name}</div>
                    <div class="planet-item-info">
                        <span class="planet-item-distance">${distance} ly</span>
                        <span class="planet-item-habitability ${habitabilityClass}">${habitability}%</span>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click handlers
        this.planetList.querySelectorAll('.planet-item').forEach(item => {
            const planetName = item.dataset.planetName;
            const planet = this.dataService.getPlanetByName(planetName);
            
            item.addEventListener('click', () => {
                if (planet) {
                    this.selectPlanet(planet);
                }
            });
        });
        
        // Show count
        if (this.filteredPlanets.length > 50) {
            this.planetList.innerHTML += `
                <div style="padding: 12px; text-align: center; color: var(--text-dim); font-size: 11px;">
                    Showing 50 of ${this.filteredPlanets.length} planets
                </div>
            `;
        }
    }

    selectPlanet(planet) {
        this.selectedPlanet = planet;
        this.showPlanetModal(planet);
    }

    showPlanetModal(planet) {
        const modal = document.getElementById('planet-modal');
        const overlay = document.getElementById('modal-overlay');
        const modalName = document.getElementById('modal-planet-name');
        const modalType = document.getElementById('modal-planet-type');
        const modalBody = document.getElementById('modal-body');
        
        if (!modal || !overlay) return;
        
        const chars = planet.characteristics || {};
        const coords = chars.coordinates_3d || {};
        const distance = planet.sy_dist ? (planet.sy_dist * 3.262).toFixed(2) : 'Unknown';
        
        // Update modal header
        if (modalName) modalName.textContent = planet.pl_name || 'Unknown';
        if (modalType) modalType.textContent = chars.radius_position || 'Unknown Type';
        
        // Update modal body
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="modal-section">
                    <div class="modal-section-title">Physical Properties</div>
                    <div class="modal-grid">
                        <div class="modal-field">
                            <div class="modal-field-label">Radius</div>
                            <div class="modal-field-value">${planet.pl_rade?.toFixed(2) || '?'} R⊕</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">Mass</div>
                            <div class="modal-field-value">${planet.pl_bmasse?.toFixed(2) || '?'} M⊕</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">Distance</div>
                            <div class="modal-field-value">${distance} ly</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">Host Star</div>
                            <div class="modal-field-value">${planet.hostname || 'Unknown'}</div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-section">
                    <div class="modal-section-title">Habitability Assessment</div>
                    <div class="modal-grid">
                        <div class="modal-field">
                            <div class="modal-field-label">Habitability</div>
                            <div class="modal-field-value">${chars.habitability_percent || 0}%</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">Toxicity</div>
                            <div class="modal-field-value">${chars.toxicity_percent || 0}%</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">Atmosphere</div>
                            <div class="modal-field-value">${chars.atmosphere_type || 'Unknown'}</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">Material</div>
                            <div class="modal-field-value">${chars.principal_material || 'Unknown'}</div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-section">
                    <div class="modal-section-title">Coordinates (Light Years)</div>
                    <div class="modal-grid">
                        <div class="modal-field">
                            <div class="modal-field-label">X</div>
                            <div class="modal-field-value">${coords.x_light_years?.toFixed(2) || '?'}</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">Y</div>
                            <div class="modal-field-value">${coords.y_light_years?.toFixed(2) || '?'}</div>
                        </div>
                        <div class="modal-field">
                            <div class="modal-field-label">Z</div>
                            <div class="modal-field-value">${coords.z_light_years?.toFixed(2) || '?'}</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Show modal
        modal.classList.add('visible');
        overlay.classList.add('visible');
    }

    closeModal() {
        const modal = document.getElementById('planet-modal');
        const overlay = document.getElementById('modal-overlay');
        if (modal) modal.classList.remove('visible');
        if (overlay) overlay.classList.remove('visible');
    }

    teleport(planet) {
        // Validate planet has coordinates
        if (!planet.characteristics?.coordinates_3d?.x_light_years) {
            alert(`Cannot teleport to ${planet.pl_name}: No 3D coordinates available.`);
            console.warn('Planet missing coordinates:', planet);
            return;
        }

        console.log('Initiating teleport to:', planet.pl_name);
        
        // Use teleport manager with visual effect
        this.teleportManager.teleportWithEffect(planet, () => {
            console.log(`Successfully teleported to ${planet.pl_name}`);
        });
    }

    show() {
        if (this.container) {
            this.isVisible = true;
            this.container.classList.remove('hidden');
            
            // Reload planets if needed
            if (this.filteredPlanets.length === 0) {
                this.loadPlanets();
            }
        }
    }

    hide() {
        if (this.container) {
            this.isVisible = false;
            this.container.classList.add('hidden');
        }
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    dispose() {
        this.closeModal();
    }
}
