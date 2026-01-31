# 🚀 Server Setup Guide

## Running the Application

### Development Server

Start the development server with hot-reload:

```bash
npm run dev
```

The app will be available at:
- **Local**: http://localhost:5173/
- **Network**: Use `--host` flag to expose on network

### Build for Production

Create an optimized production build:

```bash
npm run build
```

Output will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **dev** | `npm run dev` | Start Vite development server with hot-reload |
| **build** | `npm run build` | Build optimized production bundle |
| **preview** | `npm run preview` | Preview production build locally |
| test-ai | `npm run test-ai` | Test OpenAI service integration |
| test-elevenlabs | `npm run test-elevenlabs` | Test ElevenLabs text-to-speech |
| test-planet-service | `npm run test-planet-service` | Test planet data service |

## Vite Configuration

The project uses Vite for:
- ⚡️ Lightning-fast hot module replacement (HMR)
- 📦 Optimized bundling for production
- 🎯 ES modules support (native imports)
- 🔧 Zero config (works out of the box)

## Features

- **Hot Reload**: Changes appear instantly without page refresh
- **Fast Startup**: Server starts in <1 second
- **ES Modules**: Native JavaScript module support
- **Asset Handling**: Automatic optimization of images, JSON, etc.

## Tips

### Access from other devices on your network
```bash
npm run dev -- --host
```

### Change port
```bash
npm run dev -- --port 3000
```

### Open browser automatically
```bash
npm run dev -- --open
```

## Troubleshooting

### Port already in use
If port 5173 is already in use, Vite will automatically try the next available port (5174, 5175, etc.)

### Module not found errors
Make sure all dependencies are installed:
```bash
npm install
```

### Browser compatibility
Modern browsers with ES6+ support required. Use the production build for better compatibility.

---

**Ready to explore space!** 🌌 Run `npm run dev` and navigate to http://localhost:5173/
