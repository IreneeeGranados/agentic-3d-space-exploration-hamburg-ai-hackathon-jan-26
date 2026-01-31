/**
 * Example: Combined AI Service Usage
 * Demonstrates OpenAI + ElevenLabs integration
 */

import AIService from './AIService.js';
import dotenv from 'dotenv';

dotenv.config();

// Example: Initialize with both services
async function exampleCombinedService() {
  console.log('=== Combined AI Service Example ===\n');
  
  // Get API keys from environment
  const openAIKey = process.env.OPENAI_API_KEY;
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
  
  if (!openAIKey) {
    console.error('Error: OPENAI_API_KEY not found');
    return;
  }
  
  // Initialize service (ElevenLabs is optional)
  const aiService = new AIService(openAIKey, elevenLabsKey);
  
  // Configure services
  aiService.configureOpenAI({
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    max_tokens: 300
  });
  
  if (elevenLabsKey) {
    aiService.configureElevenLabs({
      voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
      stability: 0.5,
      similarityBoost: 0.75
    });
  }
  
  // Sample planet data
  const planetData = {
    name: "Jupiter",
    type: "Gas Giant",
    size: 11.2,
    mass: 318,
    moons: 79,
    atmosphere: "Hydrogen, Helium",
    temperature: -145,
    features: ["Great Red Spot", "Strong magnetic field", "Ring system"]
  };
  
  try {
    // Example 1: Generate description only
    console.log('1. Generating planet description...');
    const description = await aiService.generatePlanetDescription(planetData);
    console.log('\nDescription:');
    console.log(description);
    console.log('');
    
    // Example 2: Generate description with speech (if ElevenLabs available)
    if (elevenLabsKey) {
      console.log('2. Generating description with speech...');
      const result = await aiService.generatePlanetDescriptionWithSpeech(
        planetData,
        false, // Don't play immediately
        true   // Use cache
      );
      
      console.log(`\nDescription: ${result.description.substring(0, 100)}...`);
      console.log(`Audio data: ${result.audio.byteLength} bytes`);
      console.log('');
      
      // Example 3: Get available voices
      console.log('3. Available voices:');
      const voices = await aiService.getVoices();
      voices.slice(0, 5).forEach(voice => {
        console.log(`  - ${voice.name}`);
      });
      console.log('');
      
      // Example 4: Cache statistics
      console.log('4. Cache statistics:');
      const stats = aiService.getCacheStats();
      console.log('OpenAI cache:', stats.openAI);
      console.log('ElevenLabs cache:', stats.elevenLabs);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Browser usage example
function browserUsageExample() {
  console.log('\n=== Browser Usage Example ===\n');
  
  console.log(`
// Initialize AI Service
const aiService = new AIService(
  import.meta.env.VITE_OPENAI_API_KEY,
  import.meta.env.VITE_ELEVENLABS_API_KEY
);

// When user clicks on a planet
async function onPlanetClick(planetData) {
  try {
    // Generate description with speech and play immediately
    const result = await aiService.generatePlanetDescriptionWithSpeech(
      planetData,
      true  // Play immediately
    );
    
    // Display description in UI
    document.getElementById('planet-description').textContent = result.description;
    
    // Audio is already playing from the result.audio element
    console.log('Playing description...');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Convert any text to speech
async function speakText(text) {
  try {
    const audio = await aiService.textToSpeechAndPlay(text);
    console.log('Speaking:', text);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Get just the audio without playing
async function getAudioUrl(text) {
  try {
    const audioData = await aiService.textToSpeech(text);
    const blob = new Blob([audioData], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    return url;
  } catch (error) {
    console.error('Error:', error);
  }
}
  `);
}

// Run example
exampleCombinedService()
  .then(() => browserUsageExample())
  .catch(console.error);

export { exampleCombinedService, browserUsageExample };
