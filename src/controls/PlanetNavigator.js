/**
 * PlanetNavigator - Simple, prominent GUI for quick planet navigation
 * Always visible, easy to use interface
 */
export class PlanetNavigator {
    constructor(planetDataService, teleportManager) {
        this.dataService = planetDataService;
        this.teleportManager = teleportManager;
        this.nearbyPlanets = [];
        this.currentPage = 0;
        this.planetsPerPage = 10;
        
        this.createUI();
        this.attachEventListeners();
    }

    createUI() {
        // Main container - always visible on right side
        this.container = document.createElement('div');
        this.container.id = 'planet-navigator';
        this.container.className = 'planet-navigator';
        
        this.container.innerHTML = `
            <div class="nav-header">
                <h2>🌍 PLANET NAVIGATOR</h2>
                <p class="nav-subtitle">Click any planet to travel instantly</p>
            </div>
            
            <div class="nav-search">
                <input 
                    type="text" 
                    id="nav-search" 
                    placeholder="🔍 Search planets..."
                    class="nav-search-input"
                />
            </div>
            
            <div class="nav-filters">
                <button class="filter-btn active" data-filter="all">All</button>
                <button class="filter-btn" data-filter="habitable">Habitable</button>
                <button class="filter-btn" data-filter="nearby">Nearby</button>
            </div>
            
            <div id="nav-planet-list" class="nav-planet-list">
                <div class="nav-loading">Loading planets...</div>
            </div>
            
            <div class="nav-pagination">
                <button id="nav-prev" class="nav-btn">« Prev</button>
                <span id="nav-page-info" class="nav-page-info">Page 1</span>
                <button id="nav-next" class="nav-btn">Next »</button>
            </div>
            
            <div class="nav-footer">
                <button id="nav-toggle" class="nav-toggle-btn">◀ Minimize</button>
            </div>
        `;

        document.body.appendChild(this.container);
    }

    attachEventListeners() {
        // Search
        document.getElementById('nav-search').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.applyFilter(btn.dataset.filter);
            });
        });

        // Pagination
        document.getElementById('nav-prev').addEventListener('click', () => this.prevPage());
        document.getElementById('nav-next').addEventListener('click', () => this.nextPage());

        // Toggle minimize
        document.getElementById('nav-toggle').addEventListener('click', () => this.toggle());
    }

    async loadPlanets() {
        try {
            console.log('🗺️ Navigator: Waiting for all planet data...');
            
            // Get initial count
            this.nearbyPlanets = this.dataService.getAllPlanets();
            this.renderPlanetList();
            
            // Update display every 2 seconds as more planets load
            const updateInterval = setInterval(() => {
                const currentCount = this.dataService.getAllPlanets().length;
                if (currentCount > this.nearbyPlanets.length) {
                    this.nearbyPlanets = this.dataService.getAllPlanets();
                    this.renderPlanetList();
                    console.log(`🗺️ Navigator updated: ${this.nearbyPlanets.length} planets`);
                }
            }, 2000);
            
            // Wait for all clusters to be loaded by the main system
            // The ExoplanetField is loading clusters progressively
            // We just need to wait until it's done
            await this.waitForAllClusters();
            
            // Stop the update interval
            clearInterval(updateInterval);
            
            // Final update
            this.nearbyPlanets = this.dataService.getAllPlanets();
            const stats = this.dataService.getStats();
            console.log(`✓ Navigator complete: ${this.nearbyPlanets.length} planets from ${stats.clustersLoaded} clusters`);
            this.renderPlanetList();
        } catch (error) {
            console.error('❌ Navigator: Error loading planets:', error);
            const listElement = document.getElementById('nav-planet-list');
            if (listElement) {
                listElement.innerHTML = `
                    <div class="nav-error">
                        <p>❌ Failed to load planet data</p>
                        <p style="font-size: 12px;">${error.message}</p>
                    </div>
                `;
            }
        }
    }
    
    async waitForAllClusters() {
        // Wait until the cluster index says all clusters are loaded
        const clusterIndex = await this.dataService.initialize();
        const totalClusters = Object.keys(clusterIndex.clusters).length;
        
        console.log(`🗺️ Navigator: Waiting for ${totalClusters} clusters to load...`);
        
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const stats = this.dataService.getStats();
                if (stats.clustersLoaded >= totalClusters) {
                    console.log(`✅ Navigator: All ${stats.clustersLoaded} clusters loaded!`);
                    console.log(`📋 Loaded clusters: ${stats.clusterNames.join(', ')}`);
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 1000);
            
            // Timeout after 60 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                const stats = this.dataService.getStats();
                console.warn(`⚠️ Navigator: Timeout after 60s (${stats.clustersLoaded}/${totalClusters} clusters loaded)`);
                resolve();
            }, 60000);
        });
    }

    handleSearch(query) {
        if (!query) {
            this.nearbyPlanets = this.dataService.getAllPlanets();
        } else {
            this.nearbyPlanets = this.dataService.searchByName(query);
        }
        this.currentPage = 0;
        this.renderPlanetList();
    }

    applyFilter(filter) {
        const allPlanets = this.dataService.getAllPlanets();
        
        switch(filter) {
            case 'habitable':
                this.nearbyPlanets = allPlanets.filter(p => 
                    (p.characteristics?.habitability_percent || 0) > 50
                );
                break;
            case 'nearby':
                this.nearbyPlanets = allPlanets.filter(p => 
                    (p.sy_dist || 0) * 3.262 < 100 // Less than 100 light years
                );
                break;
            default:
                this.nearbyPlanets = allPlanets;
        }
        
        this.currentPage = 0;
        this.renderPlanetList();
    }

    renderPlanetList() {
        const listContainer = document.getElementById('nav-planet-list');
        const start = this.currentPage * this.planetsPerPage;
        const end = start + this.planetsPerPage;
        const planetsToShow = this.nearbyPlanets.slice(start, end);

        if (this.nearbyPlanets.length === 0) {
            const stats = this.dataService.getStats();
            listContainer.innerHTML = `
                <div class="nav-loading">
                    <p>⏳ Loading planets...</p>
                    <p style="font-size: 12px;">${stats.clustersLoaded} clusters loaded</p>
                </div>
            `;
            return;
        }

        if (planetsToShow.length === 0) {
            listContainer.innerHTML = '<div class="nav-no-results">No planets found</div>';
            return;
        }

        listContainer.innerHTML = planetsToShow.map(planet => {
            const chars = planet.characteristics || {};
            const habitability = chars.habitability_percent || 0;
            const distance = planet.sy_dist ? (planet.sy_dist * 3.262).toFixed(1) : '?';
            const planetType = chars.radius_position || 'Unknown';
            
            const habitClass = habitability > 70 ? 'high' : habitability > 40 ? 'medium' : 'low';
            
            return `
                <div class="nav-planet-item" data-planet-name="${planet.pl_name}">
                    <div class="nav-planet-info">
                        <div class="nav-planet-name">${planet.pl_name}</div>
                        <div class="nav-planet-meta">
                            <span class="nav-distance">${distance} ly</span>
                            <span class="nav-type">${planetType}</span>
                        </div>
                    </div>
                    <div class="nav-planet-hab ${habitClass}">
                        <div class="nav-hab-bar">
                            <div class="nav-hab-fill" style="width: ${habitability}%"></div>
                        </div>
                        <span class="nav-hab-text">${habitability}%</span>
                    </div>
                    <button class="nav-go-btn" data-planet-name="${planet.pl_name}">
                        GO →
                    </button>
                </div>
            `;
        }).join('');

        // Add click handlers to GO buttons
        listContainer.querySelectorAll('.nav-go-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const planetName = btn.dataset.planetName;
                const planet = this.dataService.getPlanetByName(planetName);
                if (planet) this.goToPlanet(planet);
            });
        });

        // Add click handlers to planet items (click anywhere to teleport)
        listContainer.querySelectorAll('.nav-planet-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking the GO button (it has its own handler)
                if (e.target.classList.contains('nav-go-btn')) return;
                
                const planetName = item.dataset.planetName;
                const planet = this.dataService.getPlanetByName(planetName);
                if (planet) this.goToPlanet(planet);
            });
            
            // Add hover effect
            item.style.cursor = 'pointer';
        });

        // Update pagination
        this.updatePagination();
    }

    updatePagination() {
        const totalPages = Math.ceil(this.nearbyPlanets.length / this.planetsPerPage);
        const pageInfo = document.getElementById('nav-page-info');
        const prevBtn = document.getElementById('nav-prev');
        const nextBtn = document.getElementById('nav-next');

        pageInfo.textContent = `Page ${this.currentPage + 1} of ${totalPages} (${this.nearbyPlanets.length} planets)`;
        prevBtn.disabled = this.currentPage === 0;
        nextBtn.disabled = this.currentPage >= totalPages - 1;
    }

    prevPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.renderPlanetList();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.nearbyPlanets.length / this.planetsPerPage);
        if (this.currentPage < totalPages - 1) {
            this.currentPage++;
            this.renderPlanetList();
        }
    }

    goToPlanet(planet) {
        console.log(`Navigating to ${planet.pl_name}`);
        
        // Validate coordinates
        if (!planet.characteristics?.coordinates_3d?.x_light_years) {
            alert(`Cannot navigate to ${planet.pl_name}: No coordinates available`);
            return;
        }

        // Teleport with effect
        this.teleportManager.teleportWithEffect(planet, () => {
            // Update HUD
            const hudStatus = document.getElementById('hud-status');
            if (hudStatus) {
                hudStatus.textContent = `Traveling to: ${planet.pl_name}`;
            }
        });

        // Visual feedback
        const btn = document.querySelector(`[data-planet-name="${planet.pl_name}"].nav-go-btn`);
        if (btn) {
            btn.textContent = '✓ GOING!';
            btn.style.background = '#39ff14';
            setTimeout(() => {
                btn.textContent = 'GO →';
                btn.style.background = '';
            }, 2000);
        }
    }

    toggle() {
        this.container.classList.toggle('minimized');
        const toggleBtn = document.getElementById('nav-toggle');
        if (this.container.classList.contains('minimized')) {
            toggleBtn.textContent = '▶ Show';
        } else {
            toggleBtn.textContent = '◀ Minimize';
        }
    }

    show() {
        this.container.classList.remove('minimized');
        document.getElementById('nav-toggle').textContent = '◀ Minimize';
    }

    hide() {
        this.container.classList.add('minimized');
        document.getElementById('nav-toggle').textContent = '▶ Show';
    }

    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
