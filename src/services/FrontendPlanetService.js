/**
 * Frontend Planet Manager
 * Browser-compatible service for managing planet data and AI descriptions
 * Works with Vite and Three.js
 */

class FrontendPlanetService {
    constructor() {
        this.planetsData = new Map();
        this.descriptionCache = new Map();
        this.isInitialized = false;

        // Configuration
        this.config = {
            apiKey: null,
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            max_tokens: 250,
            batchSize: 3,
            batchDelay: 1000,
            enablePreload: true
        };
    }

    /**
     * Initialize with API key from environment
     */
    init(apiKey) {
        this.config.apiKey = apiKey || import.meta.env.VITE_OPENAI_API_KEY;

        if (!this.config.apiKey) {
            console.warn('⚠️  OpenAI API key not configured. AI descriptions will be disabled.');
            console.warn('   Add VITE_OPENAI_API_KEY to your .env file');
        } else {
            console.log('✅ FrontendPlanetService initialized with API key');
        }

        this.isInitialized = true;
        return this;
    }

    /**
     * Load planets data
     * @param {Array} planetsArray - Array of planet configurations
     */
    loadPlanets(planetsArray) {
        console.log(`📦 Loading ${planetsArray.length} planets...`);

        planetsArray.forEach(planet => {
            this.planetsData.set(planet.name, planet);
        });

        console.log(`✅ Loaded ${this.planetsData.size} planets`);
        return this;
    }

    /**
     * Preload all planet descriptions efficiently
     */
    async preloadDescriptions() {
        if (!this.config.enablePreload) {
            console.log('Preload disabled in config');
            return { success: 0, failed: 0, cached: 0 };
        }

        if (!this.config.apiKey) {
            console.log('⚠️  Skipping preload: No API key configured');
            return { success: 0, failed: 0, cached: 0 };
        }

        const planets = Array.from(this.planetsData.values());
        const results = {
            success: 0,
            failed: 0,
            cached: 0,
            total: planets.length
        };

        console.log(`🤖 Preloading AI descriptions for ${planets.length} planets...`);
        const startTime = Date.now();

        // Process in batches to avoid rate limits
        for (let i = 0; i < planets.length; i += this.config.batchSize) {
            const batch = planets.slice(i, i + this.config.batchSize);
            const batchNum = Math.floor(i / this.config.batchSize) + 1;
            const totalBatches = Math.ceil(planets.length / this.config.batchSize);

            console.log(`   Processing batch ${batchNum}/${totalBatches}...`);

            const batchPromises = batch.map(async (planet) => {
                try {
                    if (this.descriptionCache.has(planet.name)) {
                        results.cached++;
                        return;
                    }

                    await this.fetchDescription(planet);
                    results.success++;
                } catch (error) {
                    console.error(`   ❌ Failed: ${planet.name} - ${error.message}`);
                    results.failed++;
                    // Store fallback in cache
                    this.descriptionCache.set(planet.name, this.getFallbackDescription(planet));
                }
            });

            await Promise.all(batchPromises);

            // Delay between batches
            if (i + this.config.batchSize < planets.length) {
                await this.delay(this.config.batchDelay);
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Preload complete in ${duration}s:`, results);

        return results;
    }

    /**
     * Get planet description (cached or fetch new)
     */
    async getDescription(planetNameOrObject) {
        const planet = typeof planetNameOrObject === 'string'
            ? this.planetsData.get(planetNameOrObject)
            : planetNameOrObject;

        if (!planet) {
            throw new Error(`Planet not found: ${planetNameOrObject}`);
        }

        // Return cached if available
        if (this.descriptionCache.has(planet.name)) {
            return this.descriptionCache.get(planet.name);
        }

        // Fetch new description
        if (!this.config.apiKey) {
            const fallback = this.getFallbackDescription(planet);
            this.descriptionCache.set(planet.name, fallback);
            return fallback;
        }

        try {
            return await this.fetchDescription(planet);
        } catch (error) {
            console.error(`Error getting description for ${planet.name}:`, error);
            const fallback = this.getFallbackDescription(planet);
            this.descriptionCache.set(planet.name, fallback);
            return fallback;
        }
    }

    /**
     * Fetch description from OpenAI API
     */
    async fetchDescription(planet) {
        const prompt = this.buildPrompt(planet);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model,
                temperature: this.config.temperature,
                max_tokens: this.config.max_tokens,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert astronomer creating engaging descriptions for an interactive 3D space visualization. Keep descriptions vivid but concise (2 short paragraphs).'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const description = data.choices[0]?.message?.content?.trim();

        if (!description) {
            throw new Error('No description generated');
        }

        // Cache it
        this.descriptionCache.set(planet.name, description);
        return description;
    }

    /**
     * Build prompt for OpenAI
     */
    buildPrompt(planet) {
        return `Describe ${planet.name} for an interactive 3D space visualization.

Planet: ${planet.name}
Type: ${planet.planetType || 'unknown'}
Composition: ${planet.aiData?.composition || 'Unknown'}
Atmosphere: ${planet.aiData?.atmosphere || 'Unknown'}
Temperature: ${planet.aiData?.surfaceTemp || 'Unknown'}
Context: ${planet.description || ''}

Write 2 engaging paragraphs highlighting what makes this planet unique and fascinating.`;
    }

    /**
     * Fallback description when API unavailable
     */
    getFallbackDescription(planet) {
        const { name, description, aiData = {} } = planet;
        return `${description || name + ' is a fascinating celestial body.'} This ${aiData.composition || 'mysterious'} world features ${aiData.atmosphere || 'an atmosphere'} with temperatures around ${aiData.surfaceTemp || 'extreme conditions'}.`;
    }

    /**
     * Get all planets with their descriptions
     */
    getAllPlanetsData() {
        return Array.from(this.planetsData.values()).map(planet => ({
            ...planet,
            aiDescription: this.descriptionCache.get(planet.name),
            hasDescription: this.descriptionCache.has(planet.name)
        }));
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            totalPlanets: this.planetsData.size,
            cachedDescriptions: this.descriptionCache.size,
            cacheRate: `${Math.round((this.descriptionCache.size / this.planetsData.size) * 100)}%`,
            planetsWithDescriptions: Array.from(this.descriptionCache.keys())
        };
    }

    /**
     * Update configuration
     */
    configure(options) {
        this.config = { ...this.config, ...options };
        return this;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.descriptionCache.clear();
        console.log('Cache cleared');
    }

    /**
     * Utility: delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
export const planetService = new FrontendPlanetService();
export default FrontendPlanetService;

// Import ClusterLoader (dynamic import with promise to handle async initialization)
let clusterLoader = null;
let clusterLoaderReady = false;
let clusterLoaderPromise = null;

// Initialize ClusterLoader
clusterLoaderPromise = import('/nasa_data/cluster-loader.js').then(module => {
    const { ClusterLoader } = module;
    clusterLoader = new ClusterLoader('/nasa_data/clusters');
    clusterLoaderReady = true;
    console.log('✅ ClusterLoader module loaded');
    return clusterLoader;
}).catch(err => {
    console.warn('Could not load ClusterLoader:', err);
    clusterLoaderReady = false;
    return null;
});

// Wait for ClusterLoader to be ready
async function waitForClusterLoader(maxWait = 5000) {
    const start = Date.now();
    while (!clusterLoaderReady && (Date.now() - start) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return clusterLoaderReady;
}

// Extend FrontendPlanetService to handle NASA data
FrontendPlanetService.prototype.loadNasaData = async function () {
    // Wait for ClusterLoader to be ready
    const ready = await waitForClusterLoader();
    if (!ready || !clusterLoader) {
        console.error('❌ ClusterLoader not initialized after waiting');
        return [];
    }

    try {
        await clusterLoader.init();
        console.log('✅ NASA Cluster Loader initialized');

        // Load nearby planets first (high priority)
        const nearbyPlanets = await clusterLoader.loadNearby();
        console.log(`🪐 Loaded ${nearbyPlanets.length} nearby NASA planets`);

        // Print sample info (using correct field names from FRONTEND_AGENT_README)
        if (nearbyPlanets.length > 0) {
            console.groupCollapsed('🪐 NASA Exoplanet Data Sample (first 5)');
            console.table(nearbyPlanets.slice(0, 5).map(p => ({
                Name: p.pl_name,
                Host: p.hostname,
                Distance: (p.characteristics?.distance_to_earth_ly?.toFixed(2) || '?') + ' ly',
                Type: p.characteristics?.radius_position || 'Unknown',
                Habitability: (p.characteristics?.habitability_percent || 0) + '%'
            })));
            console.groupEnd();
        }

        // Normalize and store in our service using correct field names
        nearbyPlanets.forEach(p => {
            this.planetsData.set(p.pl_name, {
                ...p,
                name: p.pl_name, // Alias for compatibility
                description: `Exoplanet ${p.pl_name} in the ${p.hostname} system, ${p.characteristics?.distance_to_earth_ly?.toFixed(2) || 'unknown'} light years from Earth.`,
                aiData: {
                    composition: p.characteristics?.principal_material || 'Unknown',
                    atmosphere: p.characteristics?.atmosphere_type || 'Unknown',
                    surfaceTemp: p.pl_eqt ? `${p.pl_eqt} K` : 'Unknown'
                }
            });
        });

        // Trigger background loading of other clusters
        this.loadBackgroundClusters();

        return nearbyPlanets;
    } catch (error) {
        console.error('❌ Error loading NASA data:', error);
        return [];
    }
};

FrontendPlanetService.prototype.loadBackgroundClusters = function () {
    if (!clusterLoader) return;

    // Example: Preload medium distance clusters
    const mediumClusters = ['medium_quad1', 'medium_quad2', 'medium_quad3', 'medium_quad4'];
    console.log('📦 Initiating background load of medium distance clusters...');
    clusterLoader.preloadClusters(mediumClusters);
};
