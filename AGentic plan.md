# 3D Space Exploration - OpenAI Integration Plan

## Problem Statement
Build an AI-powered agent that generates descriptive text about planets in a 3D space exploration application. The system should accept planet data as JSON input and use OpenAI API to create engaging, contextual descriptions that can be displayed when users interact with planets in the Three.js scene.

## Proposed Approach
Create an `AIService.js` module that handles OpenAI API communication, with proper error handling, security considerations, and a flexible architecture that allows customization of prompts and response formats.

## Technical Stack
- **Frontend**: Vite + Three.js + JavaScript/TypeScript
- **AI Integration**: OpenAI API (GPT models)
- **Build Tool**: Vite

## Workplan

### Phase 1: Project Setup & Dependencies
- [ ] Initialize Vite project structure (if not exists)
- [ ] Install necessary dependencies (openai SDK, dotenv for env management)
- [ ] Create `.env` file for API key storage (add to .gitignore)
- [ ] Set up TypeScript configuration (if using TS)

### Phase 2: AI Service Implementation
- [ ] Create `src/services/AIService.js` (or .ts) file
- [ ] Implement OpenAI client initialization with API key from environment
- [ ] Create `generatePlanetDescription()` function that accepts planet JSON
- [ ] Add prompt engineering logic to convert planet data to descriptive text
- [ ] Implement error handling and retry logic
- [ ] Add response caching mechanism (optional, to reduce API calls)

### Phase 3: Integration Layer
- [ ] Create types/interfaces for planet data structure
- [ ] Create example planet JSON schema/template
- [ ] Build utility functions to format planet data for AI prompts
- [ ] Add configuration options for customizing AI behavior (temperature, max tokens, model selection)

### Phase 4: Testing & Validation
- [ ] Test AIService with sample planet data
- [ ] Validate API key authentication
- [ ] Test error scenarios (rate limits, invalid responses, network errors)
- [ ] Verify response quality and relevance

### Phase 5: Documentation
- [ ] Document AIService API and usage examples
- [ ] Create sample planet JSON examples
- [ ] Add inline code comments
- [ ] Document environment setup instructions

## Architecture Overview

### File Structure
```
src/
├── services/
│   └── AIService.js          # Main AI service module
├── types/
│   └── planet.ts             # Planet data type definitions
├── utils/
│   └── promptBuilder.js      # Helper for building AI prompts
├── config/
│   └── aiConfig.js           # AI configuration settings
└── examples/
    └── samplePlanetData.json # Example planet data
```

### AIService Core Features
1. **API Key Management**: Securely load from environment variables
2. **Planet Description Generator**: Main function to generate text
3. **Prompt Customization**: Allow modification of system/user prompts
4. **Error Handling**: Graceful degradation and user-friendly error messages
5. **Response Formatting**: Clean, ready-to-display text output

### Example Planet JSON Schema
```json
{
  "name": "Mars",
  "type": "Terrestrial",
  "size": 0.53,
  "color": "#CD5C5C",
  "atmosphere": "Thin CO2",
  "temperature": -63,
  "moons": 2,
  "distanceFromSun": 1.52,
  "characteristics": ["Red Planet", "Iron Oxide Surface", "Polar Ice Caps"]
}
```

### Security Considerations
- **Never commit API keys** to version control
- Use `.env` file for environment variables
- Add `.env` to `.gitignore`
- Consider implementing rate limiting on client side
- Add request timeout limits
- Validate and sanitize planet data before sending to API

### API Usage Optimization
- **Caching**: Store generated descriptions to avoid redundant API calls
- **Batch Processing**: If generating multiple descriptions, consider batching
- **Model Selection**: Start with `gpt-3.5-turbo` for cost efficiency, upgrade to `gpt-4` if needed
- **Token Management**: Set reasonable max_tokens limit (e.g., 200-300 for descriptions)

## Configuration Options

### Customizable Parameters
- **model**: OpenAI model to use (default: "gpt-3.5-turbo")
- **temperature**: Creativity level (0.0-1.0, default: 0.7)
- **max_tokens**: Maximum response length (default: 250)
- **system_prompt**: Custom instructions for AI behavior
- **response_format**: Structured output format if needed

## Error Handling Strategy
- Network errors → Retry with exponential backoff
- Rate limit errors → Queue requests or show user-friendly message
- Invalid API key → Clear error message with setup instructions
- Malformed responses → Fallback to basic planet info display

## Testing Strategy
- Unit tests for prompt building functions
- Integration tests with mock API responses
- Manual testing with real OpenAI API
- Test with various planet data configurations

## Notes
- The OpenAI API key should be stored in `.env` file as `VITE_OPENAI_API_KEY` (Vite requires `VITE_` prefix for client-side env vars)
- Consider using a backend proxy for API calls in production to keep API key secure (client-side storage exposes the key)
- For production, recommend creating a backend API route that proxies OpenAI requests
- Keep prompts flexible to allow experimentation with different description styles

## Next Steps (After Plan Approval)
1. Confirm project structure preferences
2. Decide on TypeScript vs JavaScript
3. Implement AIService module
4. Create example integration with Three.js scene
5. Test with sample planet data
