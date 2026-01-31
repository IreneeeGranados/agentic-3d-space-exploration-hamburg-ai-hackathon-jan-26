# 3D Space Exploration - Hamburg AI Hackathon

An interactive 3D space exploration application built with Three.js, featuring modular architecture and AI-powered planet exploration.

## 🚀 Features

- **Interactive 3D Space**: Explore 39,000+ exoplanets with realistic visualization
- **AI-Powered Exploration**: Click planets to see AI-generated descriptions (OpenAI)
- **Audio Narration**: Text-to-speech planet descriptions (Eleven Labs)
- **Smart Clustering**: Efficiently renders thousands of planets using spatial optimization
- **Spacecraft Controls**: First-person and chase camera modes with autopilot
- **Modular Architecture**: Clean, maintainable code following best practices
- **Responsive UI**: NASA mission control inspired interface

## ✨ New: Planet Exploration Dialog

Click any planet to open an immersive exploration dialog featuring:
- 📊 **Overview Tab**: Key metrics (distance, habitability, composition)
- 🔬 **Characteristics Tab**: Detailed astronomical data and coordinates
- 🤖 **AI Description Tab**: Engaging AI-generated descriptions (optional)
- 🔊 **Audio Narration**: Text-to-speech narration (optional)
- 🚀 **Instant Teleport**: Jump to any planet with one click

**Quick Start**: See [DIALOG_QUICK_START.md](DIALOG_QUICK_START.md) for setup instructions!

## 📁 Project Structure

```
project/
├── index.html              # Entry point
├── main.js                 # Application initialization
├── style.css               # Styling
├── src/
│   ├── core/               # Core Three.js setup
│   │   ├── Scene.js        # Scene manager
│   │   ├── Camera.js       # Camera configuration
│   │   └── Renderer.js     # WebGL renderer setup
│   ├── objects/            # 3D object classes
│   │   ├── Planet.js       # Reusable planet class
│   │   ├── Star.js         # Sun/star class
│   │   └── StarField.js    # Background stars
│   ├── controls/           # User interaction
│   │   └── OrbitControls.js
│   ├── utils/              # Helper functions
│   │   └── helpers.js      # Utility functions
│   └── config/             # Configuration data
│       └── planets.js      # Planet data & templates
└── AGENTS.md               # AI agent guidelines
```

## 🛠️ Setup & Running

### Prerequisites
- Modern web browser with WebGL support
- Local web server (for ES6 modules)

### Quick Start

1. **Using Python** (if installed):
   ```bash
   python -m http.server 8000
   ```

2. **Using Node.js** (if installed):
   ```bash
   npx http-server -p 8000
   ```

3. **Using VS Code**:
   - Install "Live Server" extension
   - Right-click `index.html` → "Open with Live Server"

4. Open your browser to `http://localhost:8000`

## 🎮 Controls

- **Left Click + Drag**: Rotate camera view
- **Right Click + Drag**: Pan camera
- **Mouse Wheel**: Zoom in/out
- **Click on Planet**: View information (ready for AI integration)

## 🧩 Key Components

### Core Modules

- **Scene.js**: Manages the Three.js scene, lighting, and environment
- **Camera.js**: Handles perspective camera setup and aspect ratio
- **Renderer.js**: WebGL renderer configuration with tone mapping

### Object Classes

- **Planet.js**: Reusable class for creating planets with configurable:
  - Size, color, textures
  - Orbital mechanics
  - Rotation and axial tilt
  - User data for AI integration

- **Star.js**: Creates sun/star objects with emissive materials and glow effects

- **StarField.js**: Efficient background star rendering using BufferGeometry

### Configuration

- **planets.js**: Contains solar system data and exoplanet template structure
  - Pre-configured with 8 planets
  - `aiData` fields for AI service integration
  - `astronomicalData` template for datasets

## 🤖 AI Integration (Planned)

The project is structured for easy integration with:

- **OpenAI API**: Natural language descriptions, Q&A about celestial bodies
- **Eleven Labs**: Text-to-speech narration and audio tours
- **Exoplanet Datasets**: JSON data integration for real astronomical data

Each planet object includes a `userData` field and `aiData` structure ready for AI service calls.

## 📊 Adding Exoplanet Data

1. Load JSON dataset in `src/config/planets.js`
2. Map dataset fields to `EXOPLANET_TEMPLATE` structure
3. Add to `PLANETS_DATA` array
4. Planets will automatically render with proper orbits

Example dataset structure:
```javascript
{
    name: "Kepler-186f",
    astronomicalData: {
        rightAscension: "19h 54m 36s",
        declination: "+43° 57' 18''",
        distance: 500,  // light years
        hostStar: "Kepler-186"
    }
}
```

## 🎨 Customization

### Adding New Planets

```javascript
import { Planet } from './src/objects/Planet.js';

const newPlanet = new Planet({
    name: 'Custom Planet',
    radius: 8,
    color: 0xff00ff,
    orbitRadius: 150,
    orbitSpeed: 0.004,
    rotationSpeed: 0.02,
    tilt: 0.2
});

sceneManager.add(newPlanet.group);
```

### Changing Camera Position

Edit `src/core/Camera.js`:
```javascript
this.camera.position.set(x, y, z);
```

### Adjusting Lighting

Edit `src/core/Scene.js` to modify ambient, directional, or point lights.

## 🏗️ Development Guidelines

Follow the guidelines in `AGENTS.md` for:
- Code organization patterns
- Three.js best practices
- Naming conventions
- Performance optimization

## 📝 TODO / Hackathon Features

- [ ] Integrate exoplanet JSON dataset
- [ ] Add OpenAI API for planet descriptions
- [ ] Implement Eleven Labs text-to-speech
- [ ] Add planet selection UI
- [ ] Create interactive information panels
- [ ] Implement camera transitions
- [ ] Add particle effects
- [ ] Create procedural planet textures

## 🤝 Contributing

This is a hackathon project. Feel free to extend and modify!

## 📄 License

MIT License - Free to use and modify

---

**Built for Hamburg AI Hackathon 2026**
