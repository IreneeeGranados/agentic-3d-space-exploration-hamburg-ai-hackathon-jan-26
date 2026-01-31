/**
 * Example: Using AIService in a Vite/Browser context
 * 
 * For browser usage with Vite, the API key should be accessed 
 * from import.meta.env instead of process.env
 */

import AIService from './AIService.js';

// Browser/Vite usage - load from import.meta.env
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Initialize service
const aiService = new AIService(API_KEY);

// Example: Generate description when planet is clicked
export async function onPlanetClick(planetData) {
  try {
    const description = await aiService.generatePlanetDescription(planetData);
    
    // Display description in UI
    displayDescription(planetData.name, description);
    
  } catch (error) {
    console.error('Failed to generate description:', error);
    // Show error to user
    displayError('Could not generate planet description');
  }
}

// Example UI functions (implement based on your UI)
function displayDescription(planetName, description) {
  // TODO: Show description in your 3D scene UI
  console.log(`Description for ${planetName}:`, description);
}

function displayError(message) {
  // TODO: Show error in your UI
  console.error(message);
}

// Export configured service for use in other modules
export { aiService };
