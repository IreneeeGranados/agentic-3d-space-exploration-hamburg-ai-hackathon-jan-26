/**
 * ElevenLabsService - Text-to-Speech Integration
 * Converts text descriptions into natural-sounding voice audio
 */

class ElevenLabsService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('ElevenLabs API key is required');
    }
    
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    
    this.config = {
      voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice (default)
      model: 'eleven_monolingual_v1',
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.0,
      useSpeakerBoost: true
    };
    
    this.cache = new Map();
    this.audioContext = null;
  }

  /**
   * Initialize Web Audio API context
   */
  initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Configure TTS behavior
   * @param {Object} options - Configuration options (voiceId, model, stability, etc.)
   */
  configure(options) {
    this.config = { ...this.config, ...options };
  }

  /**
   * Get list of available voices
   * @returns {Promise<Array>} List of available voices
   */
  async getVoices() {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices;
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  /**
   * Convert text to speech
   * @param {string} text - Text to convert to speech
   * @param {boolean} useCache - Whether to use cached audio (default: true)
   * @returns {Promise<ArrayBuffer>} Audio data as ArrayBuffer
   */
  async textToSpeech(text, useCache = true) {
    try {
      // Generate cache key
      const cacheKey = `${this.config.voiceId}-${text}`;
      
      // Check cache
      if (useCache && this.cache.has(cacheKey)) {
        console.log('Using cached audio for text:', text.substring(0, 50) + '...');
        return this.cache.get(cacheKey);
      }

      console.log('Generating speech for text:', text.substring(0, 50) + '...');

      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${this.config.voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          body: JSON.stringify({
            text: text,
            model_id: this.config.model,
            voice_settings: {
              stability: this.config.stability,
              similarity_boost: this.config.similarityBoost,
              style: this.config.style,
              use_speaker_boost: this.config.useSpeakerBoost
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const audioData = await response.arrayBuffer();
      
      // Cache the result
      this.cache.set(cacheKey, audioData);
      
      return audioData;
      
    } catch (error) {
      console.error('Error generating speech:', error);
      
      // Handle specific error types
      if (error.message.includes('401')) {
        throw new Error('Invalid ElevenLabs API key. Please check your credentials.');
      } else if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.message.includes('quota')) {
        throw new Error('Character quota exceeded. Please upgrade your plan.');
      }
      
      throw error;
    }
  }

  /**
   * Convert text to speech and play it immediately
   * @param {string} text - Text to convert and play
   * @param {boolean} useCache - Whether to use cached audio (default: true)
   * @returns {Promise<HTMLAudioElement>} Audio element playing the speech
   */
  async textToSpeechAndPlay(text, useCache = true) {
    try {
      const audioData = await this.textToSpeech(text, useCache);
      
      // Create blob from audio data
      const blob = new Blob([audioData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      
      // Create and play audio element
      const audio = new Audio(audioUrl);
      
      // Clean up URL when audio finishes
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      });
      
      await audio.play();
      
      return audio;
      
    } catch (error) {
      console.error('Error playing speech:', error);
      throw error;
    }
  }

  /**
   * Convert text to speech and return as downloadable URL
   * @param {string} text - Text to convert
   * @param {boolean} useCache - Whether to use cached audio (default: true)
   * @returns {Promise<string>} Blob URL for the audio
   */
  async textToSpeechUrl(text, useCache = true) {
    const audioData = await this.textToSpeech(text, useCache);
    const blob = new Blob([audioData], { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
  }

  /**
   * Stream text to speech (for longer texts)
   * @param {string} text - Text to convert
   * @param {Function} onChunk - Callback for each audio chunk
   * @returns {Promise<void>}
   */
  async textToSpeechStream(text, onChunk) {
    try {
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${this.config.voiceId}/stream`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          body: JSON.stringify({
            text: text,
            model_id: this.config.model,
            voice_settings: {
              stability: this.config.stability,
              similarity_boost: this.config.similarityBoost,
              style: this.config.style,
              use_speaker_boost: this.config.useSpeakerBoost
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        if (onChunk) {
          onChunk(value);
        }
      }
      
    } catch (error) {
      console.error('Error streaming speech:', error);
      throw error;
    }
  }

  /**
   * Clear the audio cache
   */
  clearCache() {
    this.cache.clear();
    console.log('ElevenLabs audio cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache info
   */
  getCacheStats() {
    const entries = Array.from(this.cache.keys());
    return {
      size: this.cache.size,
      totalBytes: Array.from(this.cache.values()).reduce(
        (sum, buffer) => sum + buffer.byteLength,
        0
      ),
      entries: entries.map(key => key.substring(0, 50) + '...')
    };
  }

  /**
   * Get user subscription info
   * @returns {Promise<Object>} Subscription information
   */
  async getSubscriptionInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/user/subscription`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching subscription info:', error);
      throw error;
    }
  }
}

export default ElevenLabsService;
