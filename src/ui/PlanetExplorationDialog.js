/**
 * PlanetExplorationDialog - AI-Powered Planet Exploration Interface
 * 
 * A modular dialog component that displays rich planet information with:
 * - Basic planet data and characteristics
 * - AI-generated descriptions (OpenAI)
 * - Text-to-speech narration (Eleven Labs)
 * - Tabbed interface for organized information
 * 
 * Extension Points:
 * - Add Q&A functionality
 * - Add audio tours
 * - Add planet comparison mode
 * - Add bookmark/favorites
 */

export class PlanetExplorationDialog {
    constructor(openAIService = null, elevenLabsService = null) {
        this.openAIService = openAIService;
        this.elevenLabsService = elevenLabsService;
        this.currentPlanet = null;
        this.currentTab = 'overview';
        this.audioElement = null;
        this.isAudioPlaying = false;
        this.cachedDescriptions = new Map();
        this.cachedAudio = new Map();

        this.init();
    }

    /**
     * Initialize the dialog and create DOM elements
     */
    init() {
        this.createDialogElements();
        this.attachEventListeners();
        console.log('✓ Planet Exploration Dialog initialized');
    }

    /**
     * Create dialog DOM structure
     */
    createDialogElements() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'exploration-dialog-overlay';
        this.overlay.id = 'exploration-dialog-overlay';

        // Create dialog
        this.dialog = document.createElement('div');
        this.dialog.className = 'planet-exploration-dialog';
        this.dialog.id = 'planet-exploration-dialog';

        this.dialog.innerHTML = `
            <div class="exploration-dialog-header">
                <h2 class="exploration-dialog-title" id="exploration-title">Planet Name</h2>
                <p class="exploration-dialog-subtitle" id="exploration-subtitle">Planet Type</p>
                <button class="exploration-dialog-close" id="exploration-close" aria-label="Close">×</button>
            </div>
            
            <div class="exploration-dialog-body">
                <div class="exploration-hero-container" id="exploration-hero">
                    <!-- Hero image set dynamically -->
                </div>
                
                <div class="exploration-tabs">
                    <button class="exploration-tab active" data-tab="overview">Overview</button>
                    <button class="exploration-tab" data-tab="characteristics">Characteristics</button>
                    <button class="exploration-tab" data-tab="ai-description">AI Description</button>
                </div>
                
                <div class="exploration-content">
                    <!-- Overview Tab -->
                    <div class="exploration-tab-panel active" id="panel-overview">
                        <div class="overview-grid" id="overview-grid">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                    
                    <!-- Characteristics Tab -->
                    <div class="exploration-tab-panel" id="panel-characteristics">
                        <div id="characteristics-content">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                    
                    <!-- AI Description Tab -->
                    <div class="exploration-tab-panel" id="panel-ai-description">
                        <div class="ai-description-container" id="ai-description-container">
                            <div class="ai-description-loading">
                                <div class="ai-spinner"></div>
                                <p>Generating description...</p>
                            </div>
                        </div>
                        
                        <!-- Audio Player -->
                        <div class="audio-player" id="audio-player" style="display: none;">
                            <div class="audio-player-header">
                                <span class="audio-player-title">Audio Narration</span>
                            </div>
                            <div class="audio-controls">
                                <button class="audio-btn" id="audio-play" title="Play">▶</button>
                                <button class="audio-btn secondary" id="audio-pause" title="Pause" style="display: none;">⏸</button>
                                <button class="audio-btn secondary" id="audio-stop" title="Stop">⏹</button>
                            </div>
                            <div class="audio-status" id="audio-status">Ready to play</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="exploration-dialog-footer">
                <button class="exploration-btn" id="exploration-close-btn">Close</button>
            </div>
        `;

        // Append to body
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.dialog);

        // Cache DOM references
        this.elements = {
            title: document.getElementById('exploration-title'),
            subtitle: document.getElementById('exploration-subtitle'),
            overviewGrid: document.getElementById('overview-grid'),
            characteristicsContent: document.getElementById('characteristics-content'),
            aiDescriptionContainer: document.getElementById('ai-description-container'),
            audioPlayer: document.getElementById('audio-player'),
            audioStatus: document.getElementById('audio-status'),
            tabs: this.dialog.querySelectorAll('.exploration-tab'),
            tabPanels: this.dialog.querySelectorAll('.exploration-tab-panel'),
            heroContainer: document.getElementById('exploration-hero')
        };
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close buttons
        document.getElementById('exploration-close').addEventListener('click', () => this.hide());
        document.getElementById('exploration-close-btn').addEventListener('click', () => this.hide());
        this.overlay.addEventListener('click', () => this.hide());

        // Tab switching
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Audio controls
        document.getElementById('audio-play').addEventListener('click', () => this.playAudio());
        document.getElementById('audio-pause').addEventListener('click', () => this.pauseAudio());
        document.getElementById('audio-stop').addEventListener('click', () => this.stopAudio());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.isVisible()) {
                if (e.key === 'Escape') {
                    this.hide();
                }
            }
        });
    }

    /**
     * Show dialog with planet data
     * @param {Object} planetData - Planet information
     */
    async show(planetData) {
        this.currentPlanet = planetData;

        // Update header
        this.elements.title.textContent = planetData.pl_name || 'Unknown Planet';
        this.elements.subtitle.textContent = this.getPlanetType(planetData);

        // Update hero image
        this.updateHeroImage(planetData);

        // Populate overview tab
        this.populateOverview(planetData);

        // Populate characteristics tab
        this.populateCharacteristics(planetData);

        // Reset to overview tab
        this.switchTab('overview');

        // Show dialog
        this.overlay.classList.add('visible');
        this.dialog.classList.add('visible');

        // Load AI description if service is available
        if (this.openAIService) {
            this.loadAIDescription(planetData);
        }
    }

    /**
     * Hide dialog
     */
    hide() {
        this.overlay.classList.remove('visible');
        this.dialog.classList.remove('visible');
        this.stopAudio();
        this.currentPlanet = null;
    }

    /**
     * Update hero image based on planet
     */
    updateHeroImage(planetData) {
        const isEarth = planetData.pl_name === 'Earth' || planetData.name === 'Earth';

        if (isEarth) {
            this.elements.heroContainer.innerHTML = `
                <img src="/textures/planets/earth/earth_day_2048.jpg" class="exploration-hero-img" alt="Planet Earth">
                <div class="exploration-hero-overlay"></div>
            `;
            this.elements.heroContainer.style.display = 'block';
        } else {
            this.elements.heroContainer.innerHTML = '';
            this.elements.heroContainer.style.display = 'none';
        }
    }

    /**
     * Check if dialog is visible
     */
    isVisible() {
        return this.dialog.classList.contains('visible');
    }

    /**
     * Switch between tabs
     * @param {string} tabName - Tab identifier
     */
    switchTab(tabName) {
        this.currentTab = tabName;

        // Update tab buttons
        this.elements.tabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update tab panels
        this.elements.tabPanels.forEach(panel => {
            if (panel.id === `panel-${tabName}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
    }

    /**
     * Populate overview tab with planet data
     */
    populateOverview(planetData) {
        const char = planetData.characteristics || {};

        const fields = [
            {
                label: 'Distance',
                value: planetData.sy_dist !== undefined && planetData.sy_dist !== null
                    ? `${(planetData.sy_dist * 3.262).toFixed(4)} light-years`
                    : 'Unknown',
                highlight: false
            },
            {
                label: 'Host Star',
                value: planetData.hostname || 'Unknown',
                highlight: false
            },
            {
                label: 'Radius',
                value: planetData.pl_rade ? `${planetData.pl_rade.toFixed(2)} Earth radii` : 'Unknown',
                highlight: false
            },
            {
                label: 'Mass',
                value: planetData.pl_masse ? `${planetData.pl_masse.toFixed(2)} Earth masses` : 'Unknown',
                highlight: false
            },
            {
                label: 'Temperature',
                value: planetData.pl_eqt ? `${planetData.pl_eqt} K` : 'Unknown',
                highlight: false
            },
            {
                label: 'Discovery Year',
                value: planetData.disc_year > 0 ? planetData.disc_year : 'Ancient',
                highlight: false
            },
            {
                label: 'Habitability',
                value: char.habitability_percent !== undefined ? `${char.habitability_percent}%` : 'Unknown',
                highlight: char.habitability_percent > 50 ? 'highlight' : (char.habitability_percent > 0 ? 'warning' : 'danger')
            },
            {
                label: 'Toxicity',
                value: char.toxicity_percent !== undefined ? `${char.toxicity_percent}%` : 'Unknown',
                highlight: char.toxicity_percent > 70 ? 'danger' : (char.toxicity_percent > 30 ? 'warning' : 'highlight')
            },
            {
                label: 'Planet Type',
                value: char.radius_position || 'Unknown',
                highlight: false
            },
            {
                label: 'Atmosphere',
                value: char.atmosphere_type || 'Unknown',
                highlight: false
            },
            {
                label: 'Material',
                value: char.principal_material || 'Unknown',
                highlight: false
            },
            {
                label: 'Orbit',
                value: char.orbit_type || 'Unknown',
                highlight: false
            }
        ];

        this.elements.overviewGrid.innerHTML = fields.map(field => `
            <div class="overview-field">
                <div class="overview-field-label">${field.label}</div>
                <div class="overview-field-value ${field.highlight}">${field.value}</div>
            </div>
        `).join('');
    }

    /**
     * Populate characteristics tab
     */
    populateCharacteristics(planetData) {
        const char = planetData.characteristics || {};

        const sections = [
            {
                title: 'Orbital Data',
                items: [
                    { label: 'Orbital Period', value: planetData.pl_orbper ? `${planetData.pl_orbper.toFixed(2)} days` : 'N/A' },
                    { label: 'Semi-major Axis', value: planetData.pl_orbsmax ? `${planetData.pl_orbsmax.toFixed(3)} AU` : 'N/A' },
                    { label: 'Eccentricity', value: planetData.pl_orbeccen !== undefined ? planetData.pl_orbeccen.toFixed(4) : 'N/A' },
                    { label: 'Inclination', value: planetData.pl_orbincl ? `${planetData.pl_orbincl.toFixed(2)}°` : 'N/A' },
                    { label: 'Orbit Classification', value: char.orbit_type || 'Unknown' }
                ]
            },
            {
                title: 'Physical Properties',
                items: [
                    { label: 'Radius', value: planetData.pl_rade ? `${planetData.pl_rade.toFixed(3)} R⊕` : 'N/A' },
                    { label: 'Mass', value: planetData.pl_masse ? `${planetData.pl_masse.toFixed(3)} M⊕` : 'N/A' },
                    { label: 'Temperature', value: planetData.pl_eqt ? `${planetData.pl_eqt} K` : 'N/A' },
                    { label: 'Size Category', value: char.radius_position || 'Unknown' },
                    { label: 'Principal Material', value: char.principal_material || 'Unknown' }
                ]
            },
            {
                title: 'Habitability Assessment',
                items: [
                    { label: 'Habitability Score', value: char.habitability_percent !== undefined ? `${char.habitability_percent}%` : 'N/A' },
                    { label: 'Toxicity Level', value: char.toxicity_percent !== undefined ? `${char.toxicity_percent}%` : 'N/A' },
                    { label: 'Atmosphere Type', value: char.atmosphere_type || 'Unknown' },
                    { label: 'Has Moons', value: char.satellites?.has_satellites ? 'Yes' : 'No' },
                    { label: 'Moon Count', value: char.satellites?.count || 0 }
                ]
            },
            {
                title: '3D Coordinates',
                items: [
                    { label: 'X Position', value: char.coordinates_3d?.x_light_years ? `${char.coordinates_3d.x_light_years.toFixed(2)} ly` : 'N/A' },
                    { label: 'Y Position', value: char.coordinates_3d?.y_light_years ? `${char.coordinates_3d.y_light_years.toFixed(2)} ly` : 'N/A' },
                    { label: 'Z Position', value: char.coordinates_3d?.z_light_years ? `${char.coordinates_3d.z_light_years.toFixed(2)} ly` : 'N/A' },
                    { label: 'System', value: char.coordinates_3d?.system || 'Unknown' }
                ]
            },
            {
                title: 'Discovery',
                items: [
                    { label: 'Discovery Method', value: planetData.discoverymethod || 'Unknown' },
                    { label: 'Discovery Year', value: planetData.disc_year > 0 ? planetData.disc_year : 'Ancient' },
                    { label: 'Host Star', value: planetData.hostname || 'Unknown' },
                    { label: 'Distance to Earth', value: planetData.sy_dist ? `${(planetData.sy_dist * 3.262).toFixed(2)} light-years` : 'N/A' }
                ]
            }
        ];

        this.elements.characteristicsContent.innerHTML = sections.map(section => `
            <div class="characteristics-section">
                <h3 class="characteristics-title">${section.title}</h3>
                <div class="characteristics-grid">
                    ${section.items.map(item => `
                        <div class="characteristic-item">
                            <div class="characteristic-label">${item.label}</div>
                            <div class="characteristic-value">${item.value}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    /**
     * Load AI-generated description
     */
    async loadAIDescription(planetData) {
        const planetName = planetData.pl_name;

        // Check cache
        if (this.cachedDescriptions.has(planetName)) {
            this.displayAIDescription(this.cachedDescriptions.get(planetName));
            return;
        }

        // Show loading state
        this.elements.aiDescriptionContainer.innerHTML = `
            <div class="ai-description-loading">
                <div class="ai-spinner"></div>
                <p>Generating AI description...</p>
            </div>
        `;

        try {
            // Generate description using OpenAI
            const description = await this.openAIService.generatePlanetDescription(planetData);

            // Cache it
            this.cachedDescriptions.set(planetName, description);

            // Display it
            this.displayAIDescription(description);

            // Load audio if Eleven Labs is available
            if (this.elevenLabsService) {
                this.loadAudio(description, planetName);
            }
        } catch (error) {
            console.error('Error generating AI description:', error);
            this.elements.aiDescriptionContainer.innerHTML = `
                <div class="ai-description-error">
                    <p>Failed to generate description. Please try again.</p>
                    <div class="ai-description-actions">
                        <button class="ai-regenerate-btn" onclick="window.planetExplorationDialog.loadAIDescription(window.planetExplorationDialog.currentPlanet)">
                            Retry
                        </button>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Display AI description
     */
    displayAIDescription(description) {
        this.elements.aiDescriptionContainer.innerHTML = `
            <div class="ai-description-text">${description}</div>
            <div class="ai-description-actions">
                <button class="ai-regenerate-btn" id="regenerate-description">
                    Regenerate Description
                </button>
            </div>
        `;

        // Add regenerate handler
        document.getElementById('regenerate-description').addEventListener('click', () => {
            if (this.currentPlanet) {
                // Clear cache
                this.cachedDescriptions.delete(this.currentPlanet.pl_name);
                this.cachedAudio.delete(this.currentPlanet.pl_name);
                // Reload
                this.loadAIDescription(this.currentPlanet);
            }
        });
    }

    /**
     * Load audio narration
     */
    async loadAudio(text, planetName) {
        // Check cache
        if (this.cachedAudio.has(planetName)) {
            this.setupAudioPlayer(this.cachedAudio.get(planetName));
            return;
        }

        try {
            document.getElementById('audio-status').textContent = 'Generating audio...';

            // Generate audio
            const audioBlob = await this.elevenLabsService.textToSpeech(text);
            const audioUrl = URL.createObjectURL(audioBlob);

            // Cache it
            this.cachedAudio.set(planetName, audioUrl);

            // Setup player
            this.setupAudioPlayer(audioUrl);
        } catch (error) {
            console.error('Error generating audio:', error);
            document.getElementById('audio-status').textContent = 'Audio generation failed';
        }
    }

    /**
     * Setup audio player
     */
    setupAudioPlayer(audioUrl) {
        this.audioElement = new Audio(audioUrl);
        this.elements.audioPlayer.style.display = 'block';
        document.getElementById('audio-status').textContent = 'Ready to play';

        // Audio event listeners
        this.audioElement.addEventListener('ended', () => {
            this.isAudioPlaying = false;
            document.getElementById('audio-play').style.display = 'block';
            document.getElementById('audio-pause').style.display = 'none';
            document.getElementById('audio-status').textContent = 'Playback complete';
        });
    }

    /**
     * Play audio
     */
    playAudio() {
        if (this.audioElement) {
            this.audioElement.play();
            this.isAudioPlaying = true;
            document.getElementById('audio-play').style.display = 'none';
            document.getElementById('audio-pause').style.display = 'block';
            document.getElementById('audio-status').textContent = 'Playing...';
        }
    }

    /**
     * Pause audio
     */
    pauseAudio() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.isAudioPlaying = false;
            document.getElementById('audio-play').style.display = 'block';
            document.getElementById('audio-pause').style.display = 'none';
            document.getElementById('audio-status').textContent = 'Paused';
        }
    }

    /**
     * Stop audio
     */
    stopAudio() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
            this.isAudioPlaying = false;
            document.getElementById('audio-play').style.display = 'block';
            document.getElementById('audio-pause').style.display = 'none';
            document.getElementById('audio-status').textContent = 'Stopped';
        }
    }

    /**
     * Get planet type from data
     */
    getPlanetType(planetData) {
        return planetData.characteristics?.radius_position || 'Unknown Type';
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.stopAudio();
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        if (this.dialog && this.dialog.parentNode) {
            this.dialog.parentNode.removeChild(this.dialog);
        }

        // Clear caches
        this.cachedDescriptions.clear();
        this.cachedAudio.forEach(url => URL.revokeObjectURL(url));
        this.cachedAudio.clear();
    }
}

// Export for global access
if (typeof window !== 'undefined') {
    window.PlanetExplorationDialog = PlanetExplorationDialog;
}
