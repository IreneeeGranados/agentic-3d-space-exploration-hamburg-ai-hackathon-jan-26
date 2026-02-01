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
    constructor(openAIService = null, elevenLabsService = null, app = null) {
        this.openAIService = openAIService;
        this.elevenLabsService = elevenLabsService;
        this.app = app; // Reference to main App instance
        this.currentPlanet = null;
        this.currentTab = 'overview';
        this.audioElement = null;
        this.insightsAudioElement = null;
        this.isAudioPlaying = false;
        this.isInsightsAudioPlaying = false;
        this.cachedDescriptions = new Map();
        this.cachedInsights = new Map();
        this.cachedAudio = new Map();
this.cachedInsightsAudio = new Map();
        this.chatHistory = []; // Store chat messages

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
                    <button class="exploration-tab" data-tab="ai-description">💬 AI Chat</button>
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
                    
                    <!-- AI Chat Tab -->
                    <div class="exploration-tab-panel" id="panel-ai-description">
                        <div class="ai-chat-section">
                            <h3 class="ai-chat-title">💬 Chat with AI</h3>
                            
                            <!-- Chat messages container -->
                            <div class="ai-chat-messages" id="ai-chat-messages">
                                <!-- Messages appear here -->
                            </div>
                            
                            <!-- Input container -->
                            <div class="ai-chat-input-container">
                                <input 
                                    type="text" 
                                    id="ai-chat-input" 
                                    class="ai-chat-input" 
                                    placeholder="💬 Ask a question..."
                                    maxlength="200"
                                />
                                <button class="ai-chat-send-btn" id="ai-chat-send-btn">
                                    <span class="btn-icon">🚀</span>
                                    <span class="btn-text">Send</span>
                                </button>
                            </div>
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

        // Cache DOM references - use querySelector on dialog element for reliability
        this.elements = {
            title: this.dialog.querySelector('#exploration-title'),
            subtitle: this.dialog.querySelector('#exploration-subtitle'),
            overviewGrid: this.dialog.querySelector('#overview-grid'),
            characteristicsContent: this.dialog.querySelector('#characteristics-content'),
            chatMessages: this.dialog.querySelector('#ai-chat-messages'),
            chatInput: this.dialog.querySelector('#ai-chat-input'),
            chatSendBtn: this.dialog.querySelector('#ai-chat-send-btn'),
            tabs: this.dialog.querySelectorAll('.exploration-tab'),
            tabPanels: this.dialog.querySelectorAll('.exploration-tab-panel'),
            heroContainer: document.getElementById('exploration-hero')
        };

        // Verify critical elements were found
        const criticalElements = ['title', 'subtitle', 'overviewGrid', 'characteristicsContent', 'chatMessages', 'chatInput', 'chatSendBtn'];
        const missing = criticalElements.filter(key => !this.elements[key]);

        if (missing.length > 0) {
            console.error('❌ Missing dialog elements:', missing);
            console.error('Dialog HTML:', this.dialog.innerHTML.substring(0, 500));
        } else {
            console.log('✅ All dialog elements cached successfully');
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close buttons - use cached references
        const closeBtn = this.dialog.querySelector('#exploration-close');
        const closeFooterBtn = this.dialog.querySelector('#exploration-close-btn');

        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hide();
            });
        } else {
            console.warn('⚠️ Close button not found');
        }

        if (closeFooterBtn) {
            closeFooterBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hide();
            });
        } else {
            console.warn('⚠️ Footer close button not found');
        }

        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hide();
            });
        }

        // Tab switching
        if (this.elements.tabs && this.elements.tabs.length > 0) {
            this.elements.tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const tabName = tab.dataset.tab;
                    console.log('🔄 Switching to tab:', tabName);
                this.switchTab(tabName);
            });
        });
console.log(`✅ Attached ${this.elements.tabs.length} tab listeners`);
        } else {
            console.error('❌ No tabs found for event listeners');
        }

        // Chat send button
        if (this.elements.chatSendBtn) {
            this.elements.chatSendBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('🚀 Chat send button clicked');
                this.handleChatSend();
            });
            console.log('✅ Chat send button listener attached');
        } else {
            console.warn('⚠️ Chat send button not found');
        }

        // Chat input - Enter key
        if (this.elements.chatInput) {
            this.elements.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('⏎ Enter key pressed in chat');
                    this.handleChatSend();
                }
            });
            console.log('✅ Chat input listener attached');
        } else {
            console.warn('⚠️ Chat input not found');
        }
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
// Disable keyboard navigation controls
        if (this.app) {
            this.app.controlsEnabled = false;
        }

        // Stop any playing audio from previous planet
        this.stopAudio();
        this.stopInsightsAudio();

        // Clear previous content
        this.clearAllContent();

        // Update header
        this.elements.title.textContent = planetData.pl_name || 'Unknown Planet';
        this.elements.subtitle.textContent = this.getPlanetType(planetData);

        // Update hero image
        this.updateHeroImage(planetData);

        // Populate overview tab
        this.populateOverview(planetData);

        // Populate characteristics tab
        this.populateCharacteristics(planetData);
// Initialize chat for this planet (clears previous chat)
        this.initializeChatForPlanet(planetData);

        // Reset to overview tab
        this.switchTab('overview');

        // Show dialog
        this.overlay.classList.add('visible');
        this.dialog.classList.add('visible');
    }

    /**
     * Clear all content from previous planet
     */
    clearAllContent() {
        // Clear overview
        if (this.elements.overviewGrid) {
            this.elements.overviewGrid.innerHTML = '';
        }

        // Clear characteristics
        if (this.elements.characteristicsContent) {
            this.elements.characteristicsContent.innerHTML = '<div class="loading">Loading characteristics...</div>';
        }

        // Clear chat
        if (this.elements.chatMessages) {
            this.elements.chatMessages.innerHTML = '';
        }
        if (this.elements.chatInput) {
            this.elements.chatInput.value = '';
        }

        // Reset chat history
        this.chatHistory = [];
    }

    /**
     * Hide dialog
     */
    hide() {
        this.overlay.classList.remove('visible');
        this.dialog.classList.remove('visible');
        this.stopAudio();
        this.stopInsightsAudio();

        // Clear chat state
        this.chatHistory = [];
        if (this.elements.chatMessages) {
            this.elements.chatMessages.innerHTML = '';
        }
        if (this.elements.chatInput) {
            this.elements.chatInput.value = '';
        }

        this.currentPlanet = null;

        // Re-enable keyboard navigation controls
        if (this.app) {
            this.app.controlsEnabled = true;
        }
    }

    /**
     * Handle chat message send
     */
    handleChatSend() {
        if (!this.elements.chatInput) {
            console.error('❌ Chat input element not found');
            return;
        }

        if (!this.currentPlanet) {
            console.error('❌ No current planet set');
            return;
        }

        const message = this.elements.chatInput.value.trim();

        if (!message) {
            console.log('Empty message, ignoring');
            return;
        }

        console.log('📤 Sending chat message:', message);

        // Clear input immediately
        this.elements.chatInput.value = '';

        // Send to AI
        this.sendChatMessage(message, this.currentPlanet);
    }

    /**
     * Initialize chat for current planet
     */
    initializeChatForPlanet(planetData) {
        console.log('🔧 Initializing chat for planet:', planetData.pl_name);

        if (!this.elements.chatMessages) {
            console.error('❌ Chat messages container not found');
            return;
        }

        // Clear previous chat
        this.chatHistory = [];

        // Show welcome message
        this.elements.chatMessages.innerHTML = `
            <div class="ai-chat-welcome">
                <span class="welcome-icon">👋</span>
                <p>Hi! I'm your AI assistant for <strong>${planetData.pl_name}</strong>.</p>
                <p>Ask me anything about this planet!</p>
            </div>
        `;

        // Enable/disable input based on OpenAI availability
        if (this.elements.chatInput && this.elements.chatSendBtn) {
            if (this.openAIService) {
                this.elements.chatInput.disabled = false;
                this.elements.chatSendBtn.disabled = false;
                this.elements.chatInput.placeholder = `💬 Ask about ${planetData.pl_name}...`;
                console.log('✅ Chat interface enabled');
            } else {
                this.elements.chatInput.disabled = true;
                this.elements.chatSendBtn.disabled = true;
                this.elements.chatInput.placeholder = 'AI not configured';

                // Show error message
                this.elements.chatMessages.innerHTML += `
                    <div class="ai-chat-message error-message">
                        <div class="message-avatar">⚠️</div>
                        <div class="message-content">OpenAI service is not configured. Please check your API key.</div>
                    </div>
                `;
                console.warn('⚠️ OpenAI service not available');
            }
        } else {
            console.error('❌ Chat input or send button not found');
        }
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
        if (!this.elements.overviewGrid) {
            console.error('❌ Overview grid element not found');
            return;
        }

        console.log('📊 Populating overview for:', planetData.pl_name);

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

        console.log('✅ Overview populated successfully');
    }

    /**
     * Populate characteristics tab
     */
    populateCharacteristics(planetData) {
        if (!this.elements.characteristicsContent) {
            console.error('❌ Characteristics content element not found');
            return;
        }

        console.log('📋 Populating characteristics for:', planetData.pl_name);

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

        console.log('✅ Characteristics populated successfully');
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
                <p>Generating questions...</p>
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
     * Load AI-generated characteristics insights
     */
    async loadCharacteristicsInsights(planetData) {
        const planetName = planetData.pl_name;
        const container = document.getElementById('ai-insights-container');
        const btn = document.getElementById('generate-insights-btn');

        if (!container || !btn) return;

        // Check cache
        if (this.cachedInsights.has(planetName)) {
            this.displayCharacteristicsInsights(this.cachedInsights.get(planetName), planetData);
            return;
        }

        // Disable button and show loading state
        btn.disabled = true;
        btn.innerHTML = `
            <span class="btn-icon">⏳</span>
            <span class="btn-text">Generating...</span>
        `;

        container.innerHTML = `
            <div class="ai-insights-loading">
                <div class="ai-spinner"></div>
                <p>Generating questions...</p>
            </div>
        `;

        try {
            // Generate insights using OpenAI
            const insights = await this.openAIService.generateCharacteristicsInsights(planetData);

            // Cache it
            this.cachedInsights.set(planetName, insights);

            // Display it
            this.displayCharacteristicsInsights(insights, planetData);

            // Update button to "Regenerate"
            btn.disabled = false;
            btn.innerHTML = `
                <span class="btn-icon">🔄</span>
                <span class="btn-text">Regenerate Questions</span>
            `;

        } catch (error) {
            console.error('Error generating characteristics insights:', error);

            container.innerHTML = `
                <div class="ai-insights-error">
                    <p>❌ Failed to generate insights: ${error.message}</p>
                    <button class="ai-retry-btn" onclick="document.getElementById('generate-insights-btn').click()">
                        Try Again
                    </button>
                </div>
            `;

            // Reset button
            btn.disabled = false;
            btn.innerHTML = `
                <span class="btn-icon">✨</span>
                <span class="btn-text">Generate AI Insights</span>
            `;
        }
    }

    /**
     * Display AI-generated characteristics insights
     */
    displayCharacteristicsInsights(insights, planetData) {
        const container = document.getElementById('ai-insights-container');
        if (!container) return;

        container.innerHTML = `
            <div class="ai-insights-content">
                <div class="ai-insights-text">${insights}</div>
                <div class="ai-insights-footer">
                    <small class="ai-insights-attribution">✨ Generated by AI • Based on NASA Exoplanet Archive data</small>
                </div>
            </div>
        `;
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

            // Generate audio - returns ArrayBuffer
            const audioArrayBuffer = await this.elevenLabsService.textToSpeech(text);

            // Convert ArrayBuffer to Blob
            const audioBlob = new Blob([audioArrayBuffer], { type: 'audio/mpeg' });
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
     * Load audio narration for insights
     */
    async loadInsightsAudio(text, planetName) {
        const cacheKey = `insights_${planetName}`;

        console.log('loadInsightsAudio called for:', planetName);

        // Check cache
        if (this.cachedInsightsAudio.has(cacheKey)) {
            console.log('Using cached insights audio');
            this.setupInsightsAudioPlayer(this.cachedInsightsAudio.get(cacheKey));
            return;
        }

        try {
            console.log('Calling ElevenLabs textToSpeech...');
            // Generate audio - returns ArrayBuffer
            const audioArrayBuffer = await this.elevenLabsService.textToSpeech(text);
            console.log('Audio ArrayBuffer received:', audioArrayBuffer);

            // Convert ArrayBuffer to Blob
            const audioBlob = new Blob([audioArrayBuffer], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            console.log('Audio URL created:', audioUrl);

            // Cache it
            this.cachedInsightsAudio.set(cacheKey, audioUrl);

            // Setup player
            this.setupInsightsAudioPlayer(audioUrl);
        } catch (error) {
            console.error('Error generating insights audio:', error);

            // Hide loading bar and show error
            const loadingBarContainer = document.getElementById('audio-loading-bar-container');
            if (loadingBarContainer) {
                loadingBarContainer.innerHTML = `
                    <div class="audio-loading-error">
                        ❌ Audio generation failed: ${error.message}
                    </div>
                `;
            }
        }
    }

    /**
     * Setup insights audio player
     */
    setupInsightsAudioPlayer(audioUrl) {
        console.log('setupInsightsAudioPlayer called with URL:', audioUrl);
        this.insightsAudioElement = new Audio(audioUrl);

        // Hide loading bar
        const loadingBarContainer = document.getElementById('audio-loading-bar-container');
        if (loadingBarContainer) {
            loadingBarContainer.style.display = 'none';
        }

        // Show audio player
        const playerEl = document.getElementById('insights-audio-player');
        const statusEl = document.getElementById('insights-audio-status');

        console.log('Player element found:', !!playerEl);

        if (playerEl) {
            playerEl.style.display = 'block';
        }

        if (statusEl) statusEl.textContent = 'Ready to play';

        // Audio event listeners
        this.insightsAudioElement.addEventListener('ended', () => {
            this.isInsightsAudioPlaying = false;
            const playBtn = document.getElementById('insights-audio-play');
            const pauseBtn = document.getElementById('insights-audio-pause');
            if (playBtn) playBtn.style.display = 'block';
            if (pauseBtn) pauseBtn.style.display = 'none';
            if (statusEl) statusEl.textContent = 'Playback complete';
        });
    }

    /**
     * Play insights audio
     */
    playInsightsAudio() {
        if (this.insightsAudioElement) {
            this.insightsAudioElement.play();
            this.isInsightsAudioPlaying = true;
            const playBtn = document.getElementById('insights-audio-play');
            const pauseBtn = document.getElementById('insights-audio-pause');
            const statusEl = document.getElementById('insights-audio-status');
            if (playBtn) playBtn.style.display = 'none';
            if (pauseBtn) pauseBtn.style.display = 'block';
            if (statusEl) statusEl.textContent = 'Playing...';
        }
    }

    /**
     * Pause insights audio
     */
    pauseInsightsAudio() {
        if (this.insightsAudioElement) {
            this.insightsAudioElement.pause();
            this.isInsightsAudioPlaying = false;
            const playBtn = document.getElementById('insights-audio-play');
            const pauseBtn = document.getElementById('insights-audio-pause');
            const statusEl = document.getElementById('insights-audio-status');
            if (playBtn) playBtn.style.display = 'block';
            if (pauseBtn) pauseBtn.style.display = 'none';
            if (statusEl) statusEl.textContent = 'Paused';
        }
    }

    /**
     * Stop insights audio
     */
    stopInsightsAudio() {
        if (this.insightsAudioElement) {
            this.insightsAudioElement.pause();
            this.insightsAudioElement.currentTime = 0;
            this.isInsightsAudioPlaying = false;
            const playBtn = document.getElementById('insights-audio-play');
            const pauseBtn = document.getElementById('insights-audio-pause');
            const statusEl = document.getElementById('insights-audio-status');
            if (playBtn) playBtn.style.display = 'block';
            if (pauseBtn) pauseBtn.style.display = 'none';
            if (statusEl) statusEl.textContent = 'Stopped';
        }
    }

    /**
     * Send a chat message to AI
     */
    async sendChatMessage(message, planetData) {
        if (!this.elements.chatMessages) {
            console.error('Chat messages container not found!');
            return;
        }

        console.log('📤 Sending:', message);

        // Add user message
        this.addChatMessage('user', message);

        // Add loading message
        const loadingId = this.addChatMessage('loading', 'Thinking...');

        // Disable input while processing
        if (this.elements.chatInput) this.elements.chatInput.disabled = true;
        if (this.elements.chatSendBtn) this.elements.chatSendBtn.disabled = true;

        try {
            // Call AI
            const response = await this.openAIService.chatAboutPlanet(
                message,
                planetData,
                this.chatHistory
            );

            // Update history
            this.chatHistory.push({ role: 'user', content: message });
            this.chatHistory.push({ role: 'assistant', content: response });

            // Remove loading, add AI response
            this.removeChatMessage(loadingId);
            this.addChatMessage('ai', response);

        } catch (error) {
            console.error('Chat error:', error);
            this.removeChatMessage(loadingId);
            this.addChatMessage('error', `Sorry, I couldn't process that. ${error.message}`);
        } finally {
            // Re-enable input
            if (this.elements.chatInput) this.elements.chatInput.disabled = false;
            if (this.elements.chatSendBtn) this.elements.chatSendBtn.disabled = false;
        }
    }

    /**
     * Add message to chat UI
     * @returns {string} Message ID for removal
     */
    addChatMessage(type, text) {
        if (!this.elements.chatMessages) return;

        const messageId = `msg-${Date.now()}-${Math.random()}`;
        const messageEl = document.createElement('div');
        messageEl.id = messageId;
        messageEl.className = `ai-chat-message ${type}-message`;

        const avatar = type === 'user' ? '👤' :
                       type === 'ai' ? '🤖' :
                       type === 'loading' ? '⏳' : '⚠️';

        messageEl.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">${text}</div>
        `;

        this.elements.chatMessages.appendChild(messageEl);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;

        return messageId;
    }

    /**
     * Remove message from chat UI
     */
    removeChatMessage(messageId) {
        const el = document.getElementById(messageId);
        if (el) el.remove();
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
