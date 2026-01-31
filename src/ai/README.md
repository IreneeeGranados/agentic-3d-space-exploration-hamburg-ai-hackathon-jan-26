# AIService - OpenAI Integration

## Overview
The AIService module provides AI-powered planet description generation using OpenAI's GPT models.

## Location
`src/ai/AIService.js`

## Features
- ✅ Generate descriptive text from planet JSON data
- ✅ Customizable AI parameters (model, temperature, max tokens)
- ✅ Built-in caching to reduce API calls
- ✅ Error handling with fallback descriptions
- ✅ Support for custom prompts

## Installation

Dependencies are already installed:
```bash
npm install openai
```

## Usage

### Basic Example
```javascript
import AIService from './src/ai/AIService.js';

const apiKey = 'your-openai-api-key';
const aiService = new AIService(apiKey);

const planetData = {
  name: "Mars",
  type: "Terrestrial",
  temperature: -63,
  atmosphere: "Thin CO2",
  moons: 2
};

const description = await aiService.generatePlanetDescription(planetData);
console.log(description);
```

### Configuration
```javascript
// Customize AI behavior
aiService.configure({
  model: 'gpt-4',           // Use GPT-4 for better quality
  temperature: 0.8,          // More creative (0.0 - 1.0)
  max_tokens: 400            // Longer descriptions
});
```

### Cache Management
```javascript
// Get cache statistics
const stats = aiService.getCacheStats();
console.log(`Cached planets: ${stats.size}`);

// Clear cache
aiService.clearCache();
```

## Testing

Run the test script:
```bash
npm run test-ai
```

Or directly:
```bash
node src/ai/testAIService.js
```

## API Key Setup

### For Node.js Testing (Current Setup)

1. API key is stored in `.env` file:
```env
OPENAI_API_KEY=your-api-key-here
```

2. Load in your code:
```javascript
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
const aiService = new AIService(apiKey);
```

### For Vite/Browser (Three.js Frontend)

1. Add to `.env` file with `VITE_` prefix:
```env
VITE_OPENAI_API_KEY=your-api-key-here
```

2. Use in your code:
```javascript
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const aiService = new AIService(apiKey);
```

See `example-browser-usage.js` for a complete example.

**⚠️ Security Warning**: Environment variables in Vite are exposed to the browser. For production, use a backend proxy to keep your API key secure.

## Planet Data Format

Expected JSON structure:
```json
{
  "name": "Planet Name",
  "type": "Planet Type (e.g., Terrestrial, Gas Giant)",
  "size": 1.0,
  "color": "#RRGGBB",
  "atmosphere": "Atmospheric composition",
  "temperature": -50,
  "moons": 2,
  "distanceFromSun": 1.5,
  "characteristics": ["Feature 1", "Feature 2"],
  "discovered": 2020,
  "constellation": "Constellation Name"
}
```

All fields are optional. The service will work with any subset of these fields.

## Error Handling

The service handles various error scenarios:
- **401 Unauthorized**: Invalid API key
- **429 Rate Limit**: Too many requests
- **Network errors**: Connection issues
- **Fallback**: If API fails, returns basic description from planet data

## Methods

### `constructor(apiKey)`
Initialize the service with your OpenAI API key.

### `configure(options)`
Update AI configuration (model, temperature, max_tokens).

### `async generatePlanetDescription(planetData, useCache = true)`
Generate a description for the given planet data.
- Returns: `Promise<string>`
- Uses cache by default

### `buildPrompt(planetData)`
Build a custom prompt from planet data (useful for customization).

### `getFallbackDescription(planetData)`
Generate a basic description without AI (used as fallback).

### `clearCache()`
Clear all cached descriptions.

### `getCacheStats()`
Get information about cached entries.

## Sample Data

Two sample planets are provided in `src/ai/samplePlanetData.js`:
- `sampleMarsData` - Our solar system's Mars
- `samplePlanetData` - Kepler-442b exoplanet

## Security Notes

⚠️ **Important**: 
- Never commit API keys to version control
- `.env` is already in `.gitignore`
- For production apps, use a backend proxy to keep keys secure
- `dangerouslyAllowBrowser: true` is set for development only

## Next Steps

1. Test with your own planet JSON data
2. Integrate with Three.js planet objects
3. Display descriptions in UI when planets are clicked
4. Consider implementing a backend proxy for production
