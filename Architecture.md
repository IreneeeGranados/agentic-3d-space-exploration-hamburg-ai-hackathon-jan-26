# Architecture Documentation

## Overview

This document describes the architecture of the 3D Space Exploration application built with Three.js. The application follows a modular architecture pattern with clear separation of concerns, making it maintainable and extensible for AI/data integration.

## System Architecture

```mermaid
graph TB
    subgraph "Entry Point"
        HTML[index.html]
        MAIN[main.js - App Class]
    end
    
    subgraph "Core Layer"
        SCENE[SceneManager]
        CAMERA[CameraManager]
        RENDERER[RendererManager]
    end
    
    subgraph "Object Layer"
        PLANET[Planet Class]
        STAR[Star Class]
        STARFIELD[StarField Class]
    end
    
    subgraph "Control Layer"
        ORBIT[OrbitControls]
    end
    
    subgraph "Configuration"
        CONFIG[planets.js]
        UTILS[helpers.js]
    end
    
    subgraph "AI Integration Layer"
        AI[AI Module - Future]
        OPENAI[OpenAI API]
        ELEVEN[Eleven Labs API]
    end
    
    HTML --> MAIN
    MAIN --> SCENE
    MAIN --> CAMERA
    MAIN --> RENDERER
    MAIN --> ORBIT
    MAIN --> PLANET
    MAIN --> STAR
    MAIN --> STARFIELD
    
    PLANET --> CONFIG
    STAR --> SCENE
    STARFIELD --> SCENE
    
    PLANET -.-> AI
    AI -.-> OPENAI
    AI -.-> ELEVEN
    
    CONFIG -.-> AI
```

## Component Architecture

```mermaid
graph LR
    subgraph "Application Core"
        APP[App Class]
    end
    
    subgraph "Three.js Managers"
        SM[SceneManager<br/>- Scene setup<br/>- Lighting<br/>- Background]
        CM[CameraManager<br/>- Perspective camera<br/>- Aspect handling<br/>- View updates]
        RM[RendererManager<br/>- WebGL renderer<br/>- Tone mapping<br/>- Size handling]
    end
    
    subgraph "3D Objects"
        P[Planet<br/>- Geometry<br/>- Materials<br/>- Orbit logic<br/>- Rotation]
        S[Star<br/>- Emissive material<br/>- Glow effect<br/>- Point light]
        SF[StarField<br/>- BufferGeometry<br/>- Point particles<br/>- Background]
    end
    
    APP --> SM
    APP --> CM
    APP --> RM
    APP --> P
    APP --> S
    APP --> SF
```

## Data Flow Architecture

```mermaid
flowchart TD
    START([Application Start])
    
    START --> INIT[Initialize Core Components]
    
    INIT --> SCENE_INIT[Create Scene Manager<br/>Setup lighting & background]
    INIT --> CAM_INIT[Create Camera Manager<br/>Setup perspective camera]
    INIT --> REND_INIT[Create Renderer Manager<br/>Setup WebGL renderer]
    
    SCENE_INIT --> CONTROLS[Setup Orbit Controls]
    CAM_INIT --> CONTROLS
    REND_INIT --> CONTROLS
    
    CONTROLS --> LOAD_CONFIG[Load Planet Configuration<br/>from planets.js]
    
    LOAD_CONFIG --> CREATE_OBJECTS[Create Scene Objects]
    
    CREATE_OBJECTS --> STARFIELD_C[Create StarField<br/>10,000 stars]
    CREATE_OBJECTS --> STAR_C[Create Sun<br/>Central star]
    CREATE_OBJECTS --> PLANETS_C[Create Planets<br/>Loop through config]
    
    STARFIELD_C --> ADD_SCENE[Add to Scene]
    STAR_C --> ADD_SCENE
    PLANETS_C --> ADD_SCENE
    
    ADD_SCENE --> ANIM_LOOP{Animation Loop}
    
    ANIM_LOOP --> UPDATE[Update Frame]
    
    UPDATE --> UPDATE_CTRL[Update Controls]
    UPDATE --> UPDATE_PLANETS[Update All Planets<br/>- Rotation<br/>- Orbit position]
    UPDATE --> RENDER[Render Scene]
    
    RENDER --> ANIM_LOOP
    
    USER_INPUT([User Input]) --> UPDATE_CTRL
    RESIZE([Window Resize]) --> CAM_UPDATE[Update Camera Aspect]
    RESIZE --> REND_UPDATE[Update Renderer Size]
    
    CAM_UPDATE --> RENDER
    REND_UPDATE --> RENDER
```

## Class Structure

```mermaid
classDiagram
    class App {
        -canvas: HTMLCanvasElement
        -sceneManager: SceneManager
        -cameraManager: CameraManager
        -rendererManager: RendererManager
        -controls: OrbitControls
        -planets: Planet[]
        +init()
        +createSceneObjects()
        +animate()
        +onWindowResize()
        +dispose()
    }
    
    class SceneManager {
        -scene: THREE.Scene
        +constructor()
        +setupScene()
        +add(object)
        +remove(object)
        +getScene()
    }
    
    class CameraManager {
        -camera: THREE.PerspectiveCamera
        -canvas: HTMLCanvasElement
        +constructor(canvas)
        +updateAspect(canvas)
    }
    
    class RendererManager {
        -renderer: THREE.WebGLRenderer
        +constructor(canvas)
        +render(scene, camera)
        +updateSize(canvas)
        +dispose()
    }
    
    class Planet {
        -config: Object
        -angle: number
        -group: THREE.Group
        -mesh: THREE.Mesh
        +constructor(config)
        +createPlanet()
        +update()
        +dispose()
    }
    
    class Star {
        -config: Object
        -mesh: THREE.Mesh
        +constructor(config)
        +createStar()
        +dispose()
    }
    
    class StarField {
        -count: number
        -radius: number
        -mesh: THREE.Points
        +constructor(count, radius)
        +createStarField()
        +dispose()
    }
    
    App --> SceneManager
    App --> CameraManager
    App --> RendererManager
    App --> Planet
    App --> Star
    App --> StarField
```

## Module Organization

```mermaid
graph TD
    subgraph "Project Root"
        INDEX[index.html]
        MAINJS[main.js]
        STYLE[style.css]
        PKG[package.json]
    end
    
    subgraph "src/"
        subgraph "src/core/"
            SCENE_MOD[Scene.js]
            CAMERA_MOD[Camera.js]
            RENDERER_MOD[Renderer.js]
        end
        
        subgraph "src/objects/"
            PLANET_MOD[Planet.js]
            STAR_MOD[Star.js]
            STARFIELD_MOD[StarField.js]
        end
        
        subgraph "src/controls/"
            ORBIT_MOD[OrbitControls.js]
        end
        
        subgraph "src/utils/"
            HELPERS[helpers.js]
        end
        
        subgraph "src/config/"
            PLANETS_CONFIG[planets.js]
        end
        
        subgraph "src/ai/"
            AI_MOD[AI modules - Future]
        end
    end
    
    INDEX --> MAINJS
    MAINJS --> SCENE_MOD
    MAINJS --> CAMERA_MOD
    MAINJS --> RENDERER_MOD
    MAINJS --> PLANET_MOD
    MAINJS --> STAR_MOD
    MAINJS --> STARFIELD_MOD
    MAINJS --> ORBIT_MOD
    MAINJS --> PLANETS_CONFIG
    
    PLANET_MOD --> PLANETS_CONFIG
    PLANET_MOD -.-> AI_MOD
```

## Rendering Pipeline

```mermaid
sequenceDiagram
    participant Browser
    participant App
    participant Scene
    participant Camera
    participant Renderer
    participant Planets
    participant Controls
    
    Browser->>App: Page Load
    App->>Scene: Create SceneManager
    Scene-->>App: Scene ready
    
    App->>Camera: Create CameraManager
    Camera-->>App: Camera ready
    
    App->>Renderer: Create RendererManager
    Renderer-->>App: Renderer ready
    
    App->>Controls: Setup OrbitControls
    Controls-->>App: Controls ready
    
    App->>Scene: Create StarField
    App->>Scene: Create Sun
    App->>Planets: Create Planets from config
    
    loop Animation Loop
        Browser->>App: requestAnimationFrame
        App->>Controls: Update controls
        App->>Planets: Update all planets (rotation, orbit)
        App->>Renderer: Render(scene, camera)
        Renderer->>Browser: Display frame
    end
    
    Browser->>App: Window Resize Event
    App->>Camera: Update aspect ratio
    App->>Renderer: Update size
```

## Data Model

```mermaid
erDiagram
    PLANET_DATA {
        string name
        number radius
        hex color
        string texture
        number orbitRadius
        number orbitSpeed
        number rotationSpeed
        number tilt
        string description
    }
    
    AI_DATA {
        string composition
        string atmosphere
        string surfaceTemp
        string habitability
        string mass
        string radius
    }
    
    ASTRONOMICAL_DATA {
        string rightAscension
        string declination
        number distance
        string hostStar
        string discoveryMethod
        number discoveryYear
    }
    
    USER_DATA {
        string type
        string name
        object data
    }
    
    PLANET_DATA ||--o| AI_DATA : contains
    PLANET_DATA ||--o| ASTRONOMICAL_DATA : contains
    PLANET_DATA ||--|| USER_DATA : stores
```

## AI Integration Architecture (Planned)

```mermaid
graph TB
    subgraph "User Interface"
        UI[User Interaction<br/>Planet Click/Selection]
    end
    
    subgraph "Application Layer"
        APP_AI[Main App]
        PLANET_MGR[Planet Manager]
    end
    
    subgraph "AI Service Layer"
        AI_ROUTER[AI Service Router]
        CACHE[Response Cache]
    end
    
    subgraph "External APIs"
        OPENAI_API[OpenAI API<br/>- Planet descriptions<br/>- Q&A<br/>- Natural language]
        ELEVEN_API[Eleven Labs API<br/>- Text-to-speech<br/>- Narration<br/>- Audio tours]
    end
    
    subgraph "Data Layer"
        PLANET_DATA[Planet Configuration]
        EXOPLANET_DATA[Exoplanet Datasets<br/>JSON]
    end
    
    UI --> APP_AI
    APP_AI --> PLANET_MGR
    PLANET_MGR --> AI_ROUTER
    
    AI_ROUTER --> CACHE
    CACHE --> OPENAI_API
    CACHE --> ELEVEN_API
    
    PLANET_MGR --> PLANET_DATA
    PLANET_MGR --> EXOPLANET_DATA
    
    OPENAI_API -.->|AI Description| UI
    ELEVEN_API -.->|Audio Narration| UI
```

## Technology Stack

```mermaid
graph LR
    subgraph "Frontend"
        HTML5[HTML5<br/>Canvas]
        CSS3[CSS3<br/>Styling]
        ES6[ES6 Modules<br/>JavaScript]
    end
    
    subgraph "3D Engine"
        THREE[Three.js<br/>WebGL Wrapper]
        WEBGL[WebGL<br/>GPU Rendering]
    end
    
    subgraph "Controls"
        ORBIT_CTRL[OrbitControls<br/>Camera interaction]
    end
    
    subgraph "Future Integration"
        NODEJS[Node.js<br/>Package manager]
        OPENAI_PKG[OpenAI SDK]
        ELEVEN_PKG[Eleven Labs SDK]
    end
    
    HTML5 --> THREE
    CSS3 --> HTML5
    ES6 --> THREE
    THREE --> WEBGL
    ORBIT_CTRL --> THREE
    
    NODEJS -.-> OPENAI_PKG
    NODEJS -.-> ELEVEN_PKG
```

## Design Patterns

### 1. **Manager Pattern**
- SceneManager, CameraManager, RendererManager encapsulate Three.js setup
- Provides clean interfaces for core functionality
- Simplifies testing and maintenance

### 2. **Factory Pattern**
- Planet, Star, and StarField classes create configured objects
- Reusable with different parameters
- Consistent object creation

### 3. **Configuration Pattern**
- Planet data stored in separate configuration file
- Easy to extend with new data sources (JSON datasets)
- Separates data from logic

### 4. **Observer Pattern**
- Event listeners for window resize
- Animation loop using requestAnimationFrame
- Responsive to user input through controls

## Performance Considerations

```mermaid
graph TD
    subgraph "Optimization Strategies"
        A[Efficient Geometry<br/>SphereGeometry with<br/>appropriate segments]
        B[BufferGeometry<br/>for StarField<br/>10,000 particles]
        C[Material Reuse<br/>Standard materials<br/>with caching]
        D[Proper Disposal<br/>Cleanup on destroy]
        E[RequestAnimationFrame<br/>Synced with display]
    end
    
    A --> PERF[High Performance]
    B --> PERF
    C --> PERF
    D --> PERF
    E --> PERF
```

## Extension Points

The architecture is designed for easy extension:

1. **New Celestial Objects**: Extend object classes (Planet, Star)
2. **AI Services**: Add modules in `src/ai/`
3. **Data Sources**: Import JSON datasets via `src/config/`
4. **Controls**: Add interaction modes in `src/controls/`
5. **Visual Effects**: Extend materials and shaders
6. **UI Components**: Add HTML/CSS overlays for information display

## Security & Best Practices

- API keys stored in `.env` (not committed)
- Proper resource disposal to prevent memory leaks
- Error handling for failed API calls
- Rate limiting for external API calls
- Input validation for user data

## Development Workflow

```mermaid
graph LR
    DEV[Development] --> LOCAL[Local Server<br/>http-server or<br/>Live Server]
    LOCAL --> TEST[Browser Testing<br/>WebGL compatibility]
    TEST --> DEBUG[DevTools<br/>Three.js Inspector]
    DEBUG --> OPTIMIZE[Performance<br/>Profiling]
    OPTIMIZE --> DEPLOY[Production<br/>Build]
```

---

**Last Updated**: January 2026  
**Project**: Hamburg AI Hackathon - 3D Space Exploration  
**Version**: 1.0
