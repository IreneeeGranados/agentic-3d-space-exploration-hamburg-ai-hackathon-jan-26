/**
 * PlanetService - Efficient Planet Data Management
 * Handles batch loading, caching, and AI description generation for all planets
 */

import OpenAI from 'openai';

class PlanetService {
    constructor(apiKey) {
        if (!apiKey) {
            console.warn('OpenAI API key not provided. AI descriptions will be disabled.');
            this.client = null;
        } else {
            this.client = new OpenAI({
                apiKey: apiKey,
                dangerouslyAllowBrowser: true
            });
        }
        
        this.config = {
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            max_tokens: 250
        };
        
        // Caching system
        this.descriptionCache = new Map();
        this.planetsData = new Map(); // Store planet data by name
        
        // Batch processing queue
        this.batchQueue = [];
        this.batchProcessing = false;
        this.batchSize = 3; // Process 3 planets at a time
        this.batchDelay = 1000; // 1 second between batches to avoid rate limits
    }

    /**
     * Initialize service with planet data
     * @param {Array} planetsArray - Array of planet configuration objects
     */
    initialize(planetsArray) {
        console.log(`Initializing PlanetService with ${planetsArray.length} planets`);
        
        // Store planet data
        planetsArray.forEach(planet => {
            this.planetsData.set(planet.name, planet);
        });
        
        return this;
    }

    /**
     * Preload AI descriptions for all planets efficiently
     * Uses batch processing to avoid rate limits
     * @returns {Promise<Object>} Results with success/failure counts
     */
    async preloadAllDescriptions() {
        if (!this.client) {
            console.warn('Cannot preload descriptions: OpenAI client not configured');
            return { success: 0, failed: 0, cached: 0 };
        }

        const planets = Array.from(this.planetsData.values());
        const results = {
            success: 0,
            failed: 0,
            cached: 0,
            total: planets.length
        };

        console.log(`Preloading descriptions for ${planets.length} planets...`);

        // Process in batches
        for (let i = 0; i < planets.length; i += this.batchSize) {
            const batch = planets.slice(i, i + this.batchSize);
            
            // Process batch in parallel
            const batchPromises = batch.map(async (planet) => {
                try {
                    // Check cache first
                    if (this.descriptionCache.has(planet.name)) {
                        results.cached++;
                        return { planet: planet.name, status: 'cached' };
                    }

                    // Generate description
                    const description = await this.generateDescription(planet, false);
                    results.success++;
                    return { planet: planet.name, status: 'success', description };
                    
                } catch (error) {
                    console.error(`Failed to generate description for ${planet.name}:`, error.message);
                    results.failed++;
                    return { planet: planet.name, status: 'failed', error: error.message };
                }
            });

            await Promise.all(batchPromises);

            // Wait between batches to respect rate limits
            if (i + this.batchSize < planets.length) {
                await this.delay(this.batchDelay);
            }
        }

        console.log('Preload complete:', results);
        return results;
    }

    /**
     * Get planet description (from cache or generate)
     * @param {string|Object} planetNameOrData - Planet name or full planet object
     * @returns {Promise<string>} Planet description
     */
    async getPlanetDescription(planetNameOrData) {
        const planet = typeof planetNameOrData === 'string'
            ? this.planetsData.get(planetNameOrData)
            : planetNameOrData;

        if (!planet) {
            throw new Error('Planet not found');
        }

        // Check cache
        if (this.descriptionCache.has(planet.name)) {
            console.log(`Using cached description for ${planet.name}`);
            return this.descriptionCache.get(planet.name);
        }

        // Generate new description
        return await this.generateDescription(planet);
    }

    /**
     * Generate AI description for a planet
     * @param {Object} planet - Planet data object
     * @param {boolean} useCache - Whether to use/store cache (default: true)
     * @returns {Promise<string>} Generated description
     */
    async generateDescription(planet, useCache = true) {
        if (!this.client) {
            return this.getFallbackDescription(planet);
        }

        try {
            const prompt = this.buildPrompt(planet);
            
            const response = await this.client.chat.completions.create({
                model: this.config.model,
                temperature: this.config.temperature,
                max_tokens: this.config.max_tokens,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert astronomer and science communicator who creates vivid, educational descriptions of celestial bodies for an interactive 3D space visualization.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            const description = response.choices[0]?.message?.content?.trim();
            
            if (!description) {
                throw new Error('No description generated');
            }

            // Cache the result
            if (useCache) {
                this.descriptionCache.set(planet.name, description);
            }

            console.log(`Generated AI description for ${planet.name}`);
            return description;
            
        } catch (error) {
            console.error(`Error generating description for ${planet.name}:`, error);
            
            // Return fallback
            const fallback = this.getFallbackDescription(planet);
            this.descriptionCache.set(planet.name, fallback);
            return fallback;
        }
    }

    /**
     * Build optimized prompt from planet data
     */
    buildPrompt(planet) {
        const data = {
            name: planet.name,
            type: planet.planetType || 'unknown',
            composition: planet.aiData?.composition || 'Unknown',
            atmosphere: planet.aiData?.atmosphere || 'Unknown',
            temperature: planet.aiData?.surfaceTemp || 'Unknown',
            description: planet.description || ''
        };

        return `Create a compelling 2-paragraph description for ${data.name}, a ${data.type} celestial body in an interactive 3D space visualization.

Key Facts:
- Type: ${data.type}
- Composition: ${data.composition}
- Atmosphere: ${data.atmosphere}
- Temperature: ${data.temperature}

Brief context: ${data.description}

Write an engaging, scientifically-accurate description that would educate and inspire someone exploring this planet. Focus on its unique characteristics and what makes it fascinating.`;
    }

    /**
     * Get fallback description when AI is unavailable
     */
    getFallbackDescription(planet) {
        const { name, description, aiData = {} } = planet;
        const { composition = 'Unknown', atmosphere = 'Unknown', surfaceTemp = 'Unknown' } = aiData;
        
        return `${description || name + ' is a fascinating celestial body.'} This ${composition.toLowerCase()} world features ${atmosphere.toLowerCase()} atmosphere with surface temperatures around ${surfaceTemp}. ${name} represents one of the many wonders of our cosmic neighborhood, each with its own unique characteristics and mysteries waiting to be discovered.`;
    }

    /**
     * Get all planets with their descriptions (cached)
     * @returns {Array<Object>} Array of planets with descriptions
     */
    getAllPlanetsWithDescriptions() {
        return Array.from(this.planetsData.values()).map(planet => ({
            ...planet,
            aiDescription: this.descriptionCache.get(planet.name) || null,
            hasAIDescription: this.descriptionCache.has(planet.name)
        }));
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            totalPlanets: this.planetsData.size,
            cachedDescriptions: this.descriptionCache.size,
            cachePercentage: Math.round((this.descriptionCache.size / this.planetsData.size) * 100),
            planets: Array.from(this.descriptionCache.keys())
        };
    }

    /**
     * Configure AI behavior
     */
    configure(options) {
        this.config = { ...this.config, ...options };
        return this;
    }

    /**
     * Set batch processing parameters
     */
    setBatchConfig(batchSize, batchDelay) {
        this.batchSize = batchSize;
        this.batchDelay = batchDelay;
        return this;
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this.descriptionCache.clear();
        console.log('Planet description cache cleared');
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Export all data (for debugging/backup)
     */
    exportData() {
        return {
            planets: Array.from(this.planetsData.entries()),
            descriptions: Array.from(this.descriptionCache.entries()),
            stats: this.getCacheStats()
        };
    }
}

export default PlanetService;
