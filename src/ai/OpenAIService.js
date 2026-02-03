/**
 * OpenAIService - OpenAI Integration for Planet Descriptions
 * Generates descriptive text about planets based on JSON data
 * Refactored to use fetch API for better browser compatibility
 */

class OpenAIService {
  constructor(apiKey) {
    if (!apiKey) {
      console.warn('OpenAI API key not provided. AI descriptions will be disabled.');
      this.enabled = false;
      return;
    }

    this.apiKey = apiKey;
    this.enabled = true;
    this.baseURL = 'https://api.openai.com/v1/chat/completions';

    this.config = {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 300
    };

    this.cache = new Map();
    console.log('✅ OpenAI service initialized (fetch mode)');
  }

  /**
   * Configure AI behavior
   * @param {Object} options - Configuration options (model, temperature, max_tokens)
   */
  configure(options) {
    this.config = { ...this.config, ...options };
  }

  /**
   * Build a prompt from planet data
   * @param {Object} planetData - Planet information as JSON
   * @returns {string} Formatted prompt
   */
  buildPrompt(planetData) {
    const planetInfo = JSON.stringify(planetData, null, 2);

    return `You are an expert astronomer and science communicator. Based on the following planet data, create an engaging and informative description (2-3 paragraphs) that would captivate someone exploring this celestial body in a 3D space visualization.

Planet Data:
${planetInfo}

Write a vivid, scientifically-inspired description that highlights the unique characteristics, atmosphere, and interesting facts about this planet. Make it immersive and educational.`;
  }

  /**
   * Generate a description for a planet
   * @param {Object} planetData - Planet information as JSON
   * @param {boolean} useCache - Whether to use cached results (default: true)
   * @returns {Promise<string>} Generated description
   */
  async generatePlanetDescription(planetData, useCache = true) {
    // If service is not enabled, return fallback immediately
    if (!this.enabled) {
      console.log('AI service not enabled, using fallback description');
      return this.getFallbackDescription(planetData);
    }

    try {
      // Generate cache key
      const cacheKey = JSON.stringify(planetData);

      // Check cache
      if (useCache && this.cache.has(cacheKey)) {
        console.log('Using cached description for planet:', planetData.name);
        return this.cache.get(cacheKey);
      }

      console.log('Generating AI description for planet:', planetData.name);

      // Build prompt
      const prompt = this.buildPrompt(planetData);

      // Call OpenAI API using fetch
      const description = await this.makeApiCall([
        {
          role: 'system',
          content: 'You are an expert astronomer and science communicator who creates vivid, educational descriptions of celestial bodies.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]);

      // Cache the result
      this.cache.set(cacheKey, description);

      return description;

    } catch (error) {
      console.error('Error generating planet description:', error);
      // Return fallback description
      return this.getFallbackDescription(planetData);
    }
  }

  /**
   * Generate a completion from a custom prompt (for chat functionality)
   * @param {string} prompt - The prompt to send to OpenAI
   * @param {boolean} useCache - Whether to use cached results (default: false for chat)
   * @returns {Promise<string>} Generated response
   */
  async generateCompletion(prompt, useCache = false) {
    try {
      // Generate cache key
      const cacheKey = `completion_${prompt}`;

      // Check cache
      if (useCache && this.cache.has(cacheKey)) {
        console.log('Using cached completion');
        return this.cache.get(cacheKey);
      }

      console.log('Generating AI completion...');

      const completion = await this.makeApiCall([
        {
          role: 'user',
          content: prompt
        }
      ]);

      // Cache the result if requested
      if (useCache) {
        this.cache.set(cacheKey, completion);
      }

      return completion;

    } catch (error) {
      console.error('Error generating completion:', error);
      throw error;
    }
  }

  /**
   * Generate AI insights for planet characteristics
   * @param {Object} planetData - Planet information with characteristics
   * @param {boolean} useCache - Whether to use cached results (default: true)
   * @returns {Promise<string>} Generated insights
   */
  async generateCharacteristicsInsights(planetData, useCache = true) {
    try {
      // Generate cache key
      const cacheKey = `insights_${planetData.pl_name || planetData.name}`;

      // Check cache
      if (useCache && this.cache.has(cacheKey)) {
        console.log('Using cached insights for planet:', planetData.pl_name || planetData.name);
        return this.cache.get(cacheKey);
      }

      console.log('Generating AI questions for planet:', planetData.pl_name || planetData.name);

      // Build characteristics-specific prompt
      const char = planetData.characteristics || {};
      const prompt = `You are an expert astronomer analyzing exoplanet data. Based on the following planet characteristics, generate 4-5 thought-provoking questions that a scientist or space enthusiast might ask about this planet. Make them specific to this planet's unique features.

Planet: ${planetData.pl_name || planetData.name}
Distance: ${planetData.sy_dist ? (planetData.sy_dist * 3.262).toFixed(2) : 'Unknown'} light-years from Earth

PHYSICAL PROPERTIES:
- Type: ${char.radius_position || 'Unknown'}
- Radius: ${planetData.pl_rade ? planetData.pl_rade.toFixed(2) : 'Unknown'} Earth radii
- Mass: ${planetData.pl_masse ? planetData.pl_masse.toFixed(2) : 'Unknown'} Earth masses
- Temperature: ${planetData.pl_eqt || 'Unknown'} K
- Material Composition: ${char.principal_material || 'Unknown'}

ORBITAL CHARACTERISTICS:
- Orbital Period: ${planetData.pl_orbper ? planetData.pl_orbper.toFixed(2) : 'Unknown'} days
- Semi-major Axis: ${planetData.pl_orbsmax ? planetData.pl_orbsmax.toFixed(3) : 'Unknown'} AU
- Orbit Type: ${char.orbit_type || 'Unknown'}

HABITABILITY:
- Habitability Score: ${char.habitability_percent !== undefined ? char.habitability_percent + '%' : 'Unknown'}
- Toxicity Level: ${char.toxicity_percent !== undefined ? char.toxicity_percent + '%' : 'Unknown'}
- Atmosphere: ${char.atmosphere_type || 'Unknown'}

Generate 4-5 specific questions that scientists would want to answer about this planet. Format each question on a new line starting with "•". Focus on:
- What makes this planet unique or interesting?
- What could we learn from studying it?
- How does it compare to Earth or other known planets?
- What mysteries does it present?

Make the questions engaging and scientifically relevant.`;

      const insights = await this.makeApiCall([
        {
          role: 'system',
          content: 'You are an expert astronomer who generates thoughtful, scientifically relevant questions about exoplanets. Your questions help people think deeply about what makes each planet interesting and what we could learn from studying it.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], { temperature: 0.8 });

      // Cache the result
      this.cache.set(cacheKey, insights);

      return insights;

    } catch (error) {
      console.error('Error generating characteristics insights:', error);
      throw error;
    }
  }

  /**
   * Chat about a planet (conversational interface)
   * @param {string} userMessage - User's question
   * @param {Object} planetData - Planet information
   * @param {Array} chatHistory - Previous conversation history
   * @returns {Promise<string>} AI response
   */
  async chatAboutPlanet(userMessage, planetData, chatHistory = []) {
    try {
      console.log('Chat about planet:', planetData.pl_name || planetData.name);

      const char = planetData.characteristics || {};

      // Build concise system message - only include key data
      const systemMessage = `You are an astronomer assistant for "${planetData.pl_name || planetData.name}". Answer briefly (1-2 sentences). Data: ${(planetData.sy_dist * 3.262).toFixed(1)}ly away, ${char.radius_position || 'Unknown type'}, ${planetData.pl_rade?.toFixed(1) || '?'}R⊕, ${planetData.pl_eqt || '?'}K, ${char.habitability_percent || 0}% habitable.`;

      // Build messages array
      const messages = [
        { role: 'system', content: systemMessage },
        ...chatHistory.slice(-6), // Last 3 exchanges (6 messages)
        { role: 'user', content: userMessage }
      ];

      return await this.makeApiCall(messages, { max_tokens: 150 });

    } catch (error) {
      console.error('Error in chat:', error);
      throw error;
    }
  }

  /**
   * Helper to make OpenAI API calls via fetch
   * @param {Array} messages - Array of message objects
   * @param {Object} optionsOverride - Optional overrides for this specific call
   * @returns {Promise<string>} Content of the response
   */
  async makeApiCall(messages, optionsOverride = {}) {
    if (!this.enabled || !this.apiKey) {
      throw new Error('OpenAI service not enabled');
    }

    const requestConfig = { ...this.config, ...optionsOverride };

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: requestConfig.model,
          messages: messages,
          temperature: requestConfig.temperature,
          max_tokens: requestConfig.max_tokens
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Throw specific errors based on status
        if (response.status === 401) {
          throw new Error('Invalid OpenAI API key. Please check your credentials.');
        } else if (response.status === 429 || (errorData.error && errorData.error.type === 'insufficient_quota')) {
          const error = new Error('Quota Exceeded');
          error.code = 'QUOTA_EXCEEDED';
          throw error;
        } else {
          throw new Error(`OpenAI API Error: ${response.status} ${errorData.error?.message || ''}`);
        }
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim();

      if (!content) {
        throw new Error('No content generated from OpenAI');
      }

      return content;
    } catch (error) {
      // Re-throw if it's already one of our custom errors
      if (error.message.includes('API key') || error.code === 'QUOTA_EXCEEDED') {
        throw error;
      }

      // Check for network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      }

      throw error;
    }
  }

  /**
   * Generate fallback description when AI fails
   * @param {Object} planetData - Planet information
   * @returns {string} Basic description
   */
  getFallbackDescription(planetData) {
    const { name, type, size, temperature, moons, atmosphere } = planetData;

    // Check if we have enriched characteristics
    const char = planetData.characteristics;

    if (char) {
      return `${planetData.pl_name || name} is a ${char.radius_position || 'mysterious'} planet located ${(planetData.sy_dist * 3.262).toFixed(1)} light years away. It has a radius of ${planetData.pl_rade?.toFixed(2) || '?'} Earth radii and ${char.atmosphere_type || 'unknown'} atmosphere.`;
    }

    return `${name} is a ${type || 'mysterious'} planet${size ? ` with a relative size of ${size}` : ''}. ${temperature ? `Surface temperatures average around ${temperature}°C. ` : ''
      }${moons ? `It has ${moons} moon${moons > 1 ? 's' : ''}. ` : ''}${atmosphere ? `The atmosphere is composed of ${atmosphere}.` : ''
      }`;
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
    console.log('OpenAI description cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache info
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()).map(key => {
        try {
          const data = JSON.parse(key);
          return data.name || data.pl_name || 'Unknown';
        } catch {
          return key.substring(0, 20) + '...';
        }
      })
    };
  }
}

export { OpenAIService };
export default OpenAIService;
