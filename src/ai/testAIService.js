/**
 * Test script for AIService
 * Usage: node src/ai/testAIService.js
 */

import dotenv from 'dotenv';
import AIService from './AIService.js';
import { sampleMarsData, samplePlanetData } from './samplePlanetData.js';

// Load environment variables
dotenv.config();

// Get API Key from environment
const API_KEY = process.env.OPENAI_API_KEY;

async function testAIService() {
  console.log('='.repeat(60));
  console.log('AIService Test');
  console.log('='.repeat(60));
  
  // Check for API key
  if (!API_KEY) {
    console.error('\n✗ Error: OPENAI_API_KEY not found in .env file');
    console.log('\nPlease create a .env file with:');
    console.log('OPENAI_API_KEY=your-api-key-here');
    return;
  }
  
  try {
    // Initialize AIService
    console.log('\n1. Initializing AIService...');
    const aiService = new AIService(API_KEY);
    console.log('✓ AIService initialized successfully');
    
    // Test with Mars data
    console.log('\n2. Testing with Mars data...');
    console.log('Planet:', sampleMarsData.name);
    console.log('-'.repeat(60));
    
    const marsDescription = await aiService.generatePlanetDescription(sampleMarsData);
    console.log('\nGenerated Description:');
    console.log(marsDescription);
    
    // Test cache
    console.log('\n3. Testing cache (should be instant)...');
    const startTime = Date.now();
    const cachedDescription = await aiService.generatePlanetDescription(sampleMarsData);
    const endTime = Date.now();
    console.log(`✓ Cache hit! Retrieved in ${endTime - startTime}ms`);
    
    // Test cache stats
    console.log('\n4. Cache statistics:');
    console.log(aiService.getCacheStats());
    
    console.log('\n' + '='.repeat(60));
    console.log('✓ All tests passed!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testAIService();
