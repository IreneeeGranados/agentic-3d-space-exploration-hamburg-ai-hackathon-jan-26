/**
 * Configuration File
 * API keys and application settings
 * 
 * IMPORTANT: For production, use environment variables or a secure backend
 * DO NOT commit real API keys to version control
 */

// Safe access to environment variables (handles cases where import.meta.env may be undefined)
const getEnvVar = (key) => {
    try {
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            return import.meta.env[key] || null;
        }
        return null;
    } catch {
        return null;
    }
};

export const CONFIG = {
    // OpenAI Configuration
    openai: {
        apiKey: getEnvVar('VITE_OPENAI_API_KEY'),
        model: 'gpt-3.5-turbo', // Using gpt-3.5-turbo for faster/cheaper responses
        baseURL: 'https://api.openai.com/v1/chat/completions'
    },

    // Eleven Labs Configuration (optional)
    elevenLabs: {
        apiKey: getEnvVar('VITE_ELEVENLABS_API_KEY'),
        voiceId: '21m00Tcm4TlvDq8ikWAM', // Default voice
        baseURL: 'https://api.elevenlabs.io/v1/text-to-speech'
    },

    // Feature flags
    features: {
        enableAI: true, // Set to false to disable AI features
        enableNarration: true, // Set to true when Eleven Labs key is added
        cacheResponses: true // Cache AI responses to save API calls
    },

    // AI Prompt Templates
    prompts: {
        planetDescription: `You are an expert astronomer providing fascinating information about planets. 
Given the following planet data, provide an engaging 2-3 sentence description that would interest space enthusiasts:

Planet: {name}
Type: {composition}
Atmosphere: {atmosphere}
Temperature: {surfaceTemp}

Make it educational but captivating.`
    }
};

// Simple flag to check if AI is configured
export function isAIConfigured() {
    const hasKey = CONFIG.openai.apiKey && CONFIG.openai.apiKey !== 'YOUR_OPENAI_API_KEY_HERE';
    const enabled = CONFIG.features.enableAI && hasKey;

    // Log configuration status (helpful for debugging in production)
    if (!hasKey) {
        console.warn('⚠️ OpenAI API key is missing or invalid in config');
    } else if (!CONFIG.features.enableAI) {
        console.log('ℹ️ AI features are disabled in config');
    }

    return enabled;
}

export function isNarrationConfigured() {
    return CONFIG.features.enableNarration &&
        CONFIG.elevenLabs.apiKey &&
        CONFIG.elevenLabs.apiKey !== 'YOUR_ELEVENLABS_API_KEY_HERE';
}
