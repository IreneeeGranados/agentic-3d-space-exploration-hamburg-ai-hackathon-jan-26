# AI Services - OpenAI & ElevenLabs Integration

## Overview
The AI Services module provides two main capabilities:
1. **OpenAI Integration** - Generate descriptive text about planets using GPT models
2. **ElevenLabs Integration** - Convert text descriptions into natural-sounding voice

## Architecture

### Files Structure
```
src/ai/
├── AIService.js              # Unified interface (combines both services)
├── OpenAIService.js          # OpenAI text generation
├── ElevenLabsService.js      # ElevenLabs text-to-speech
├── testAIService.js          # OpenAI tests
├── testElevenLabsService.js  # ElevenLabs tests
├── example-combined-usage.js # Combined usage examples
├── example-browser-usage.js  # Browser integration example
└── samplePlanetData.js       # Sample planet data
```

## Services

### 1. AIService (Unified Interface)
Main service that combines OpenAI and ElevenLabs functionality.

```javascript
import AIService from './src/ai/AIService.js';

// Initialize with both services
const aiService = new AIService(
  openAIKey,      // Required
  elevenLabsKey   // Optional
);

// Generate text description
const description = await aiService.generatePlanetDescription(planetData);

// Convert text to speech
const audioData = await aiService.textToSpeech(description);

// Generate description AND speech in one call
const result = await aiService.generatePlanetDescriptionWithSpeech(
  planetData,
  true  // Play immediately
);
```

### 2. OpenAIService
Generates descriptive text from planet JSON data.

**Features:**
- ✅ Generate descriptions from planet data
- ✅ Customizable AI parameters (model, temperature, tokens)
- ✅ Built-in caching to reduce API calls
- ✅ Error handling with fallback descriptions

```javascript
import OpenAIService from './src/ai/OpenAIService.js';

const openAI = new OpenAIService(apiKey);

// Configure
openAI.configure({
  model: 'gpt-4',
  temperature: 0.8,
  max_tokens: 400
});

// Generate description
const description = await openAI.generatePlanetDescription(planetData);
```

### 3. ElevenLabsService
Converts text into natural-sounding speech.

**Features:**
- ✅ Text-to-speech conversion
- ✅ Multiple voice options
- ✅ Configurable voice settings (stability, similarity)
- ✅ Audio caching
- ✅ Streaming support for long texts
- ✅ Play audio immediately or get audio data

```javascript
import ElevenLabsService from './src/ai/ElevenLabsService.js';

const elevenLabs = new ElevenLabsService(apiKey);

// Configure voice
elevenLabs.configure({
  voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
  stability: 0.5,
  similarityBoost: 0.75
});

// Convert and play
const audio = await elevenLabs.textToSpeechAndPlay(text);

// Just get audio data
const audioData = await elevenLabs.textToSpeech(text);

// Get available voices
const voices = await elevenLabs.getVoices();
```

## Installation

Dependencies are already in package.json:
```bash
npm install openai
```

No additional package needed for ElevenLabs (uses native Fetch API).

## API Key Setup

Add both keys to `.env` file:
```env
# OpenAI
OPENAI_API_KEY=sk-proj-...
VITE_OPENAI_API_KEY=sk-proj-...

# ElevenLabs
ELEVENLABS_API_KEY=sk_...
VITE_ELEVENLABS_API_KEY=sk_...
```

### For Node.js Testing
```javascript
import dotenv from 'dotenv';
dotenv.config();

const aiService = new AIService(
  process.env.OPENAI_API_KEY,
  process.env.ELEVENLABS_API_KEY
);
```

### For Vite/Browser
```javascript
const aiService = new AIService(
  import.meta.env.VITE_OPENAI_API_KEY,
  import.meta.env.VITE_ELEVENLABS_API_KEY
);
```

## Usage Examples

### Example 1: Generate Planet Description
```javascript
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

### Example 2: Convert Text to Speech
```javascript
const text = "Mars is the fourth planet from the Sun...";
const audio = await aiService.textToSpeechAndPlay(text);
// Audio plays automatically
```

### Example 3: Combined (Description + Speech)
```javascript
// Generate description and play as speech
const result = await aiService.generatePlanetDescriptionWithSpeech(
  planetData,
  true  // Play immediately
);

console.log(result.description);
// result.audio is the HTMLAudioElement playing
```

### Example 4: Browser Integration
```javascript
// When user clicks on a planet
async function onPlanetClick(planetData) {
  try {
    // Show loading state
    showLoading();
    
    // Generate and play description
    const { description, audio } = await aiService.generatePlanetDescriptionWithSpeech(
      planetData,
      true  // Play speech immediately
    );
    
    // Display text
    document.getElementById('description').textContent = description;
    
    // Audio is already playing
    audio.addEventListener('ended', () => {
      console.log('Finished speaking');
    });
    
  } catch (error) {
    console.error('Error:', error);
    showError(error.message);
  }
}
```

## Testing

### Test OpenAI Service
```bash
node src/ai/testAIService.js
```

### Test ElevenLabs Service
```bash
node src/ai/testElevenLabsService.js
```

### Combined Test
See `src/ai/example-combined-usage.js` for complete examples.

## ElevenLabs Voice Options

Common voice IDs:
- `21m00Tcm4TlvDq8ikWAM` - Rachel (female, clear)
- `AZnzlk1XvdvUeBnXmlld` - Domi (female, warm)
- `EXAVITQu4vr4xnSDxMaL` - Bella (female, soft)
- `ErXwobaYiN019PkySvjV` - Antoni (male, clear)
- `VR6AewLTigWG4xSOukaG` - Arnold (male, crisp)

Get all available voices:
```javascript
const voices = await aiService.getVoices();
voices.forEach(v => console.log(`${v.name}: ${v.voice_id}`));
```

## Cache Management

```javascript
// Get statistics
const stats = aiService.getCacheStats();
console.log('OpenAI cache:', stats.openAI);
console.log('ElevenLabs cache:', stats.elevenLabs);

// Clear all caches
aiService.clearCache();
```

## Error Handling

Both services handle common errors:
- **401 Unauthorized**: Invalid API key
- **429 Rate Limit**: Too many requests
- **Quota Exceeded**: ElevenLabs character limit reached
- **Network errors**: Connection issues

```javascript
try {
  const result = await aiService.generatePlanetDescriptionWithSpeech(planetData);
} catch (error) {
  if (error.message.includes('API key')) {
    // Handle authentication error
  } else if (error.message.includes('quota')) {
    // Handle quota exceeded
  }
}
```

## Planet Data Format

Expected JSON structure (all fields optional):
```json
{
  "name": "Planet Name",
  "type": "Planet Type",
  "size": 1.0,
  "color": "#RRGGBB",
  "atmosphere": "Atmospheric composition",
  "temperature": -50,
  "moons": 2,
  "distanceFromSun": 1.5,
  "characteristics": ["Feature 1", "Feature 2"]
}
```

## Security Notes

⚠️ **Important**: 
- Never commit API keys to version control
- `.env` is in `.gitignore`
- For production, use a backend proxy
- `dangerouslyAllowBrowser: true` is for development only
- ElevenLabs has character quotas - monitor usage

## API Methods

### AIService

| Method | Description | Returns |
|--------|-------------|---------|
| `generatePlanetDescription(data, cache)` | Generate text description | `Promise<string>` |
| `textToSpeech(text, cache)` | Convert text to audio | `Promise<ArrayBuffer>` |
| `textToSpeechAndPlay(text, cache)` | Convert and play audio | `Promise<HTMLAudioElement>` |
| `generatePlanetDescriptionWithSpeech(data, play, cache)` | Generate text + audio | `Promise<{description, audio}>` |
| `getVoices()` | Get available voices | `Promise<Array>` |
| `getSubscriptionInfo()` | Get ElevenLabs quota info | `Promise<Object>` |
| `configureOpenAI(options)` | Configure OpenAI | `void` |
| `configureElevenLabs(options)` | Configure ElevenLabs | `void` |
| `clearCache()` | Clear all caches | `void` |
| `getCacheStats()` | Get cache statistics | `Object` |

## Next Steps

1. ✅ Test both services with your API keys
2. ✅ Integrate with Three.js planet click events
3. ✅ Display descriptions and play audio in UI
4. ✅ Configure voice settings for best experience
5. ✅ Monitor API usage and quotas
6. ✅ Consider backend proxy for production
