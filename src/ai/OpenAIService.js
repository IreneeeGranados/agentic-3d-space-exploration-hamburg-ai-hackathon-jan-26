/**
 * OpenAIService - OpenAI Integration for Planet Descriptions
 * Generates descriptive text about planets based on JSON data
 */

import OpenAI from 'openai';

class OpenAIService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    this.client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Note: For production, use a backend proxy
    });
    
    this.config = {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 300
    };
    
    this.cache = new Map();
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
      
      // Call OpenAI API
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        temperature: this.config.temperature,
        max_tokens: this.config.max_tokens,
        messages: [
          {
            role: 'system',
            content: 'You are an expert astronomer and science communicator who creates vivid, educational descriptions of celestial bodies.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // Extract description
      const description = response.choices[0]?.message?.content?.trim();
      
      if (!description) {
        throw new Error('No description generated from OpenAI');
      }

      // Cache the result
      this.cache.set(cacheKey, description);
      
      return description;
      
    } catch (error) {
      console.error('Error generating planet description:', error);
      
      // Handle specific error types
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your credentials.');
      } else if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      // Return fallback description
      return this.getFallbackDescription(planetData);
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
      
      // Call OpenAI API
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        temperature: 0.8,
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content: 'You are an expert astronomer who generates thoughtful, scientifically relevant questions about exoplanets. Your questions help people think deeply about what makes each planet interesting and what we could learn from studying it.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // Extract insights
      const insights = response.choices[0]?.message?.content?.trim();
      
      if (!insights) {
        throw new Error('No insights generated from OpenAI');
      }

      // Cache the result
      this.cache.set(cacheKey, insights);
      
      return insights;
      
    } catch (error) {
      console.error('Error generating characteristics insights:', error);
      
      // Handle specific error types
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your credentials.');
      } else if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
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
      
      // Build system message with planet context
      const systemMessage = `You are an expert astronomer assistant helping someone explore the exoplanet "${planetData.pl_name || planetData.name}". 

Planet Context:
- Distance: ${planetData.sy_dist ? (planetData.sy_dist * 3.262).toFixed(2) : 'Unknown'} light-years from Earth
- Type: ${char.radius_position || 'Unknown'}
- Radius: ${planetData.pl_rade ? planetData.pl_rade.toFixed(2) : 'Unknown'} Earth radii
- Mass: ${planetData.pl_masse ? planetData.pl_masse.toFixed(2) : 'Unknown'} Earth masses
- Temperature: ${planetData.pl_eqt || 'Unknown'} K
- Habitability Score: ${char.habitability_percent !== undefined ? char.habitability_percent + '%' : 'Unknown'}
- Atmosphere: ${char.atmosphere_type || 'Unknown'}

Answer questions about this planet in a friendly, conversational way. Be concise (2-3 sentences) but informative. Use emojis occasionally to keep it engaging.`;

      // Build messages array
      const messages = [
        { role: 'system', content: systemMessage },
        ...chatHistory.slice(-6), // Last 3 exchanges (6 messages)
        { role: 'user', content: userMessage }
      ];
      
      // Call OpenAI API
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        temperature: 0.7,
        max_tokens: 200,
        messages: messages
      });

      const reply = response.choices[0]?.message?.content?.trim();
      
      if (!reply) {
        throw new Error('No response generated from OpenAI');
      }
      
      return reply;
      
    } catch (error) {
      console.error('Error in chat:', error);
      
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key');
      } else if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment.');
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
    
    return `${name} is a ${type || 'mysterious'} planet${size ? ` with a relative size of ${size}` : ''}. ${
      temperature ? `Surface temperatures average around ${temperature}°C. ` : ''
    }${moons ? `It has ${moons} moon${moons > 1 ? 's' : ''}. ` : ''}${
      atmosphere ? `The atmosphere is composed of ${atmosphere}.` : ''
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
        const data = JSON.parse(key);
        return data.name || 'Unknown';
      })
    };
  }
}

export { OpenAIService };
export default OpenAIService;
