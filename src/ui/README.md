# UI Components

This directory contains UI components for the 3D Space Exploration application.

## Components

### PlanetExplorationDialog

An AI-powered dialog that displays detailed information about planets when they are clicked or selected.

#### Features
- **Tabbed Interface**: Overview, Characteristics, and AI Description tabs
- **AI-Generated Descriptions**: Uses OpenAI to create engaging planet descriptions
- **Audio Narration**: Text-to-speech via Eleven Labs (optional)
- **Smooth Animations**: Fade in/out effects
- **Keyboard Support**: ESC to close, tab navigation
- **Responsive Design**: Works on desktop and mobile

#### Usage

```javascript
import { PlanetExplorationDialog } from './src/ui/PlanetExplorationDialog.js';
import { OpenAIService } from './src/ai/OpenAIService.js';
import { ElevenLabsService } from './src/ai/ElevenLabsService.js';

// Initialize AI services (optional)
const openAIService = new OpenAIService('your-api-key');
const elevenLabsService = new ElevenLabsService('your-api-key');

// Create dialog
const dialog = new PlanetExplorationDialog(openAIService, elevenLabsService);

// Show dialog with planet data
dialog.show(planetData, (planet) => {
    // Callback when user clicks "Teleport"
    console.log('Teleporting to:', planet.pl_name);
});

// Hide dialog
dialog.hide();
```

#### Without AI Services

The dialog works perfectly fine without AI services - it will simply show the basic planet information:

```javascript
// Create dialog without AI
const dialog = new PlanetExplorationDialog();

// Show dialog
dialog.show(planetData);
```

#### Configuration

Configure AI services in `/src/config/config.js`:

```javascript
export const CONFIG = {
    openai: {
        apiKey: 'YOUR_OPENAI_API_KEY',
        model: 'gpt-4'
    },
    elevenLabs: {
        apiKey: 'YOUR_ELEVENLABS_API_KEY',
        voiceId: '21m00Tcm4TlvDq8ikWAM'
    },
    features: {
        enableAI: true,
        enableNarration: true,
        cacheResponses: true
    }
};
```

#### Planet Data Format

The dialog expects planet data in this format:

```javascript
{
    pl_name: "Planet Name",
    sy_dist: 14.6427,  // Distance in parsecs
    pl_rade: 2.847,    // Radius in Earth radii
    characteristics: {
        habitability_percent: 65,
        toxicity_percent: 50,
        radius_position: "Neptune-like",
        atmosphere_type: "Hydrogen-Helium",
        principal_material: "Gas (H/He)",
        orbit_type: "Circular",
        satellites: { has_satellites: false },
        coordinates_3d: {
            x_light_years: 8.5249,
            y_light_years: -6.3332,
            z_light_years: -12.2222
        },
        icrs_coordinates: {
            right_ascension: { hours_format: "21h33m33.90s" },
            declination: { dms_format: "-49d00m45.06s" },
            parallax: { value: 201.407 }
        }
    }
}
```

#### Keyboard Shortcuts

- **I** - Show info for last clicked planet
- **ESC** - Close dialog
- **Tab** - Navigate between tabs (when focused)

#### Styling

The dialog uses CSS variables from `ui-style.css` for consistent styling:

```css
--primary-bg: rgba(10, 15, 25, 0.85);
--accent-blue: #00D9FF;
--text-primary: #FFFFFF;
```

To customize the dialog appearance, edit `/src/ui/planet-exploration-dialog.css`.

#### Extension Points

The dialog is designed to be easily extended:

##### 1. Add Custom Tabs

```javascript
// In PlanetExplorationDialog.js
this.dialog.innerHTML = `
    ...
    <button class="exploration-tab" data-tab="custom">Custom Tab</button>
    ...
    <div class="exploration-tab-panel" id="panel-custom">
        <!-- Your custom content -->
    </div>
`;
```

##### 2. Add Q&A Functionality

```javascript
async askQuestion(question) {
    if (!this.openAIService) return;
    
    const prompt = `About planet ${this.currentPlanet.pl_name}: ${question}`;
    const answer = await this.openAIService.chat(prompt);
    return answer;
}
```

##### 3. Add Comparison Mode

```javascript
async showComparison(planet1, planet2) {
    // Create side-by-side comparison
    // Use AI to highlight differences
}
```

##### 4. Add Bookmarks

```javascript
bookmarkPlanet(planetData) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    bookmarks.push(planetData);
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}
```

#### Methods

##### `show(planetData, onTeleport)`
Shows the dialog with planet information.
- **planetData** - Planet data object
- **onTeleport** - Callback function when user clicks teleport

##### `hide()`
Hides the dialog and stops any playing audio.

##### `switchTab(tabName)`
Switches to a different tab.
- **tabName** - Tab identifier ('overview', 'characteristics', 'ai-description')

##### `isVisible()`
Returns true if the dialog is currently visible.

##### `destroy()`
Cleans up resources and removes dialog from DOM.

#### Events

The dialog emits custom events that you can listen for:

```javascript
dialog.dialog.addEventListener('dialogopen', (e) => {
    console.log('Dialog opened for:', e.detail.planet);
});

dialog.dialog.addEventListener('dialogclose', () => {
    console.log('Dialog closed');
});
```

#### Performance

- **AI Responses**: Cached by planet name to avoid redundant API calls
- **Audio Files**: Cached as blob URLs
- **Memory**: Audio URLs are revoked when dialog is destroyed

#### Troubleshooting

**Dialog doesn't appear:**
- Check that CSS file is loaded in index.html
- Ensure `visible` class is added
- Check z-index conflicts

**AI descriptions not loading:**
- Verify OpenAI API key in config.js
- Check browser console for errors
- Ensure `isAIConfigured()` returns true

**Audio not playing:**
- Verify Eleven Labs API key
- Check browser audio permissions
- Some browsers require user interaction before playing audio

**Styling issues:**
- Clear browser cache
- Check CSS variable definitions in ui-style.css
- Verify CSS file load order

#### Future Enhancements

Planned features for future versions:

1. **Interactive Q&A** - Chat with AI about the planet
2. **Audio Tours** - Pre-recorded guided tours
3. **3D Preview** - Small rotating planet preview in dialog
4. **Social Sharing** - Share discoveries on social media
5. **AR Mode** - View planet in augmented reality
6. **Multi-language** - Support for multiple languages
7. **Accessibility** - Enhanced screen reader support
8. **Voice Commands** - Control dialog with voice
9. **Planet Comparison** - Compare two planets side-by-side
10. **Favorites System** - Save and organize favorite planets

## Directory Structure

```
src/ui/
├── PlanetExplorationDialog.js     # Main dialog component
├── planet-exploration-dialog.css  # Dialog styles
├── dialogs/                       # Future dialog components
└── README.md                      # This file
```

## Contributing

When adding new UI components:
1. Create component in appropriate subdirectory
2. Follow NASA mission control styling guidelines
3. Use existing CSS variables for consistency
4. Document component in this README
5. Add JSDoc comments to all public methods
6. Include usage examples
