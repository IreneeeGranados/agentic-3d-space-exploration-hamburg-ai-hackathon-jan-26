/**
 * Test file for ElevenLabs Service
 * Demonstrates text-to-speech functionality
 */

import ElevenLabsService from './ElevenLabsService.js';
import dotenv from 'dotenv';
import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';

dotenv.config();

// Example usage of ElevenLabsService
async function testElevenLabsService() {
  console.log('=== ElevenLabs Service Test ===\n');
  
  // Initialize with API key from environment
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    console.error('Error: ELEVENLABS_API_KEY not found in environment variables');
    return;
  }
  
  const elevenLabs = new ElevenLabsService(apiKey);
  
  try {
    // Test 1: Get available voices
    console.log('1. Fetching available voices...');
    const voices = await elevenLabs.getVoices();
    console.log(`Found ${voices.length} voices:`);
    voices.slice(0, 5).forEach(voice => {
      console.log(`  - ${voice.name} (${voice.voice_id})`);
    });
    console.log('');
    
    // Test 2: Get subscription info
    console.log('2. Fetching subscription info...');
    const subscription = await elevenLabs.getSubscriptionInfo();
    console.log('Subscription:', subscription);
    console.log('');
    
    // Test 3: Convert text to speech and save to file
    console.log('3. Converting text to speech...');
    const sampleText = "Welcome to the solar system exploration. This planet is a fascinating celestial body with unique characteristics.";
    const audioData = await elevenLabs.textToSpeech(sampleText);
    console.log(`Generated audio: ${audioData.byteLength} bytes`);
    
    // Save audio to file
    const audioPath = path.join(process.cwd(), 'test-audio-sample.mp3');
    fs.writeFileSync(audioPath, Buffer.from(audioData));
    console.log(`Audio saved to: ${audioPath}`);
    
    // Play the audio file using system player
    console.log('Playing audio...\n');
    const platform = process.platform;
    const openCommand = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${openCommand} "${audioPath}"`, (error) => {
      if (error) {
        console.log('Note: Could not auto-play. Please open the file manually:', audioPath);
      }
    });
    
    // Wait a moment for playback to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('');
    
    // Test 4: Cache statistics
    console.log('5. Cache statistics:');
    const stats = elevenLabs.getCacheStats();
    console.log(stats);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Example usage with planet data
async function testPlanetSpeech() {
  console.log('\n=== Planet Description Speech Test ===\n');
  
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    console.error('Error: ELEVENLABS_API_KEY not found in environment variables');
    return;
  }
  
  const elevenLabs = new ElevenLabsService(apiKey);
  
  // Configure voice settings
  elevenLabs.configure({
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
    stability: 0.5,
    similarityBoost: 0.75
  });
  
  const planetDescription = `Mars, the Red Planet, is a cold, desert world with a thin atmosphere composed primarily of carbon dioxide. 
  Its rusty color comes from iron oxide covering much of its surface. Mars features the largest volcano in the solar system, 
  Olympus Mons, and a vast canyon system called Valles Marineris. Scientists believe Mars once had liquid water on its surface 
  and may have supported microbial life billions of years ago.`;
  
  try {
    console.log('Converting Mars description to speech...');
    const audioData = await elevenLabs.textToSpeech(planetDescription);
    console.log(`Generated audio: ${audioData.byteLength} bytes`);
    
    // Save Mars description audio to file
    const audioPath = path.join(process.cwd(), 'test-audio-mars.mp3');
    fs.writeFileSync(audioPath, Buffer.from(audioData));
    console.log(`Mars audio saved to: ${audioPath}`);
    
    // Play the audio file
    console.log('Playing Mars description...\n');
    const platform = process.platform;
    const openCommand = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${openCommand} "${audioPath}"`, (error) => {
      if (error) {
        console.log('Note: Could not auto-play. Please open the file manually:', audioPath);
      }
    });
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run tests if this file is executed directly
testElevenLabsService()
  .then(() => testPlanetSpeech())
  .catch(console.error);

export { testElevenLabsService, testPlanetSpeech };
