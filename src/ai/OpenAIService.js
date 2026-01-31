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

export default OpenAIService;
