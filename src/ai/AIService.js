/**
 * AIService - Unified AI Interface
 * Combines OpenAI (text generation) and ElevenLabs (text-to-speech) services
 */

import OpenAIService from './OpenAIService.js';
import ElevenLabsService from './ElevenLabsService.js';

class AIService {
  constructor(openAIKey, elevenLabsKey = null) {
    // Initialize OpenAI service (required)
    this.openAI = new OpenAIService(openAIKey);
    
    // Initialize ElevenLabs service (optional)
    this.elevenLabs = elevenLabsKey ? new ElevenLabsService(elevenLabsKey) : null;
  }

  /**
   * Configure OpenAI behavior
   * @param {Object} options - Configuration options for OpenAI
   */
  configureOpenAI(options) {
    this.openAI.configure(options);
  }

  /**
   * Configure ElevenLabs behavior
   * @param {Object} options - Configuration options for ElevenLabs
   */
  configureElevenLabs(options) {
    if (!this.elevenLabs) {
      throw new Error('ElevenLabs service not initialized. Provide API key in constructor.');
    }
    this.elevenLabs.configure(options);
  }

  /**
   * Generate a description for a planet using OpenAI
   * @param {Object} planetData - Planet information as JSON
   * @param {boolean} useCache - Whether to use cached results (default: true)
   * @returns {Promise<string>} Generated description
   */
  async generatePlanetDescription(planetData, useCache = true) {
    return this.openAI.generatePlanetDescription(planetData, useCache);
  }

  /**
   * Convert text to speech using ElevenLabs
   * @param {string} text - Text to convert to speech
   * @param {boolean} useCache - Whether to use cached audio (default: true)
   * @returns {Promise<ArrayBuffer>} Audio data
   */
  async textToSpeech(text, useCache = true) {
    if (!this.elevenLabs) {
      throw new Error('ElevenLabs service not initialized. Provide API key in constructor.');
    }
    return this.elevenLabs.textToSpeech(text, useCache);
  }

  /**
   * Convert text to speech and play it immediately
   * @param {string} text - Text to convert and play
   * @param {boolean} useCache - Whether to use cached audio (default: true)
   * @returns {Promise<HTMLAudioElement>} Audio element playing the speech
   */
  async textToSpeechAndPlay(text, useCache = true) {
    if (!this.elevenLabs) {
      throw new Error('ElevenLabs service not initialized. Provide API key in constructor.');
    }
    return this.elevenLabs.textToSpeechAndPlay(text, useCache);
  }

  /**
   * Generate planet description and convert to speech
   * @param {Object} planetData - Planet information
   * @param {boolean} playImmediately - Whether to play audio immediately (default: false)
   * @param {boolean} useCache - Whether to use cached results (default: true)
   * @returns {Promise<{description: string, audio: ArrayBuffer|HTMLAudioElement}>}
   */
  async generatePlanetDescriptionWithSpeech(planetData, playImmediately = false, useCache = true) {
    if (!this.elevenLabs) {
      throw new Error('ElevenLabs service not initialized. Provide API key in constructor.');
    }

    // Generate description
    const description = await this.generatePlanetDescription(planetData, useCache);
    
    // Convert to speech
    const audio = playImmediately 
      ? await this.textToSpeechAndPlay(description, useCache)
      : await this.textToSpeech(description, useCache);
    
    return { description, audio };
  }

  /**
   * Get available ElevenLabs voices
   * @returns {Promise<Array>} List of available voices
   */
  async getVoices() {
    if (!this.elevenLabs) {
      throw new Error('ElevenLabs service not initialized. Provide API key in constructor.');
    }
    return this.elevenLabs.getVoices();
  }

  /**
   * Get ElevenLabs subscription info
   * @returns {Promise<Object>} Subscription information
   */
  async getSubscriptionInfo() {
    if (!this.elevenLabs) {
      throw new Error('ElevenLabs service not initialized. Provide API key in constructor.');
    }
    return this.elevenLabs.getSubscriptionInfo();
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.openAI.clearCache();
    if (this.elevenLabs) {
      this.elevenLabs.clearCache();
    }
    console.log('All AI service caches cleared');
  }

  /**
   * Get cache statistics from all services
   * @returns {Object} Combined cache info
   */
  getCacheStats() {
    return {
      openAI: this.openAI.getCacheStats(),
      elevenLabs: this.elevenLabs ? this.elevenLabs.getCacheStats() : null
    };
  }
}

export default AIService;
export { OpenAIService, ElevenLabsService };
