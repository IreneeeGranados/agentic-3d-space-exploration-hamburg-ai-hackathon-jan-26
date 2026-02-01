/**
 * NarrationService - Generates AI descriptions and audio for planets
 */
export class NarrationService {
    constructor(openAIService, elevenLabsService) {
        this.openAIService = openAIService;
        this.elevenLabsService = elevenLabsService;
        this.textCache = new Map();
        this.audioCache = new Map();
        this.isGenerating = false;
        this.queue = [];
    }

    /**
     * Generate narration (text + audio) for a planet
     * @param {Object} planet - Planet data
     * @returns {Promise<{text: string, audio: Blob}>}
     */
    async generateNarration(planet) {
        const planetName = planet.pl_name || 'Unknown Planet';
        
        console.log(`🎙️ Generating narration for ${planetName}...`);

        // Check cache first
        if (this.textCache.has(planetName) && this.audioCache.has(planetName)) {
            console.log(`✅ Using cached narration for ${planetName}`);
            return {
                text: this.textCache.get(planetName),
                audio: this.audioCache.get(planetName)
            };
        }

        try {
            // Generate text description
            console.log('📝 Step 1: Generating text description...');
            const text = await this.generateDescription(planet);
            this.textCache.set(planetName, text);
            console.log(`✅ Text generated: "${text.substring(0, 60)}..."`);

            // Generate audio
            let audio = null;
            if (this.elevenLabsService) {
                console.log('🎤 Step 2: Generating audio narration...');
                audio = await this.generateAudio(text);
                if (audio) {
                    this.audioCache.set(planetName, audio);
                    console.log('✅ Audio cached successfully');
                } else {
                    console.log('⚠️ Continuing without audio');
                }
            } else {
                console.log('ℹ️ ElevenLabs not configured - text-only mode');
            }

            console.log(`✅ Narration ready for ${planetName}`);
            return { text, audio };

        } catch (error) {
            console.error('❌ Narration generation failed:', error);
            throw error;
        }
    }

    /**
     * Generate text description using OpenAI
     */
    async generateDescription(planet) {
        console.log('🤖 generateDescription called for', planet.pl_name);
        
        if (!this.openAIService) {
            console.log('⚠️ No OpenAI service, using fallback');
            return this.generateFallbackDescription(planet);
        }

        const planetName = planet.pl_name || 'Unknown Planet';
        const characteristics = planet.characteristics || {};
        const type = characteristics.radius_position || 'Unknown type';
        const distance = planet.sy_dist ? `${(planet.sy_dist * 3.26156).toFixed(2)} light years` : 'unknown distance';
        const habitability = characteristics.habitability_percent || 0;
        const material = characteristics.principal_material || 'unknown composition';
        const atmosphere = characteristics.atmosphere_type || 'unknown atmosphere';

        // Check if it's a Solar System planet
        const isSolarPlanet = planet.hostname === 'Sun' || planet.isSolar === true;
        const celestialBodyType = isSolarPlanet ? 'planet in our Solar System' : 'exoplanet';

        const prompt = `You are SpAIce, an enthusiastic AI space guide. Create a brief, engaging 2-3 sentence narration about this ${celestialBodyType} for a space explorer who just approached it:

Planet: ${planetName}
Type: ${type}
Distance from Earth: ${distance}
Habitability: ${habitability}%
Composition: ${material}
Atmosphere: ${atmosphere}

Make it sound like a friendly documentary narrator - informative but captivating. Focus on the most interesting characteristics. Keep it under 50 words.`;

        try {
            console.log('📡 Calling OpenAI...');
            const response = await this.openAIService.generateCompletion(prompt);
            console.log('✅ OpenAI response received');
            return response.trim();
        } catch (error) {
            console.error('❌ OpenAI call failed:', error);
            return this.generateFallbackDescription(planet);
        }
    }

    /**
     * Generate fallback description (no AI)
     */
    generateFallbackDescription(planet) {
        const planetName = planet.pl_name || 'Unknown Planet';
        const characteristics = planet.characteristics || {};
        const type = characteristics.radius_position || 'exoplanet';
        const distance = planet.sy_dist ? `${(planet.sy_dist * 3.26156).toFixed(2)} light years from Earth` : 'an unknown distance away';
        const habitability = characteristics.habitability_percent || 0;
        
        // Check if it's a Solar System planet
        const isSolarPlanet = planet.hostname === 'Sun' || planet.isSolar === true;
        
        if (isSolarPlanet) {
            let description = `${planetName}, a planet in our Solar System. `;
            if (habitability > 70) {
                description += `This world shows promising signs of habitability with conditions that could support life.`;
            } else if (habitability > 40) {
                description += `Conditions here are challenging, but not impossible for hardy organisms.`;
            } else {
                description += `A fascinating world that has captivated human imagination for millennia.`;
            }
            return description;
        }
        
        let description = `${planetName}, a ${type}, located ${distance}. `;
        
        if (habitability > 70) {
            description += `This world shows promising signs of habitability with conditions that could support life.`;
        } else if (habitability > 40) {
            description += `Conditions here are challenging, but not impossible for hardy organisms.`;
        } else {
            description += `A harsh environment where survival would be extremely difficult.`;
        }

        return description;
    }

    /**
     * Generate audio using Eleven Labs
     */
    async generateAudio(text) {
        if (!this.elevenLabsService) {
            console.warn('⚠️ Eleven Labs not configured, skipping audio');
            return null;
        }

        console.log('🎤 Generating audio with ElevenLabs...');
        console.log(`📝 Text length: ${text.length} characters`);

        try {
            const audioBlob = await this.elevenLabsService.textToSpeech(text);
            
            if (!audioBlob) {
                console.warn('⚠️ ElevenLabs returned no audio data');
                return null;
            }
            
            console.log(`✅ Audio generated: ${audioBlob.size} bytes (${(audioBlob.size / 1024).toFixed(2)} KB)`);
            return audioBlob;
            
        } catch (error) {
            console.error('❌ Audio generation failed:', error);
            console.error('Error details:', error.message);
            
            // Return null so narration continues without audio
            return null;
        }
    }

    /**
     * Clear caches
     */
    clearCache() {
        this.textCache.clear();
        this.audioCache.clear();
        console.log('🗑️ Narration cache cleared');
    }

    /**
     * Get cache stats
     */
    getCacheStats() {
        return {
            textCached: this.textCache.size,
            audioCached: this.audioCache.size
        };
    }
}
