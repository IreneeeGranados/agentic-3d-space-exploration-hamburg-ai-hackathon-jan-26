# SpAIce - AI Narrator Setup Guide

## 🤖 Meet SpAIce
SpAIce is your friendly AI space guide with a 3D animated face! It provides narrated tours of planets with voice and chat capabilities.

## Features
- **3D Animated Face** - Cute robot face with floating animation
- **Talking Animation** - Face animates when speaking
- **OpenAI Integration** - Generates intelligent planet descriptions
- **ElevenLabs TTS** - Natural voice narration (optional)
- **Interactive Chat** - Ask SpAIce questions about any planet

## Setup Instructions

### 1. Get API Keys

#### OpenAI (Required for AI descriptions)
1. Visit: https://platform.openai.com/api-keys
2. Create an account or sign in
3. Generate a new API key
4. Copy the key (starts with `sk-`)

#### ElevenLabs (Optional - for voice narration)
1. Visit: https://elevenlabs.io/
2. Create an account
3. Go to Settings → API Keys
4. Generate a new API key
5. Copy the key

### 2. Configure Environment

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your keys:

```env
# OpenAI API Key (Required)
VITE_OPENAI_API_KEY=sk-your-actual-openai-key-here

# ElevenLabs API Key (Optional - for TTS)
VITE_ELEVENLABS_API_KEY=your-elevenlabs-key-here
```

### 3. Start the Application

```bash
npm install
npm run dev
```

### 4. Use SpAIce

1. **Fly close to a planet** (within 5M units)
2. **Press `N`** to activate SpAIce
3. **Watch the 3D face animate** as SpAIce speaks
4. **Ask questions** in the chat box
5. **Get AI-powered answers** about the planet

## How It Works

### Without API Keys
- SpAIce will use fallback descriptions (basic information)
- Chat will be disabled
- No voice narration

### With OpenAI Only
- ✅ AI-generated planet descriptions
- ✅ Interactive chat with Q&A
- ❌ No voice narration (text only)

### With OpenAI + ElevenLabs
- ✅ AI-generated planet descriptions
- ✅ Interactive chat with Q&A
- ✅ Natural voice narration
- ✅ Full SpAIce experience!

## SpAIce Features

### 3D Face Elements
- **Eyes** - Follow movement with animated pupils
- **Mouth** - Animates when speaking
- **Antenna** - Blinks with glowing tip
- **Floating Animation** - Gentle hover effect
- **Glow Effect** - Pulses when talking

### Chat Capabilities
SpAIce can answer questions about:
- Planet composition and atmosphere
- Habitability conditions
- Distance from Earth
- Physical characteristics (size, mass, temperature)
- Interesting scientific facts

### Example Questions
- "Could humans survive here?"
- "What's the temperature like?"
- "How far is this planet?"
- "What's special about this world?"
- "Tell me more about the atmosphere"

## Troubleshooting

### SpAIce doesn't appear
- Make sure you're within 5M units of a planet
- Press `N` key
- Check console for errors

### No AI responses
- Verify OpenAI API key in `.env`
- Check browser console for API errors
- Ensure you have API credits

### No voice narration
- Add ElevenLabs API key to `.env`
- Check browser console for TTS errors
- Restart the dev server after adding keys

### Chat not working
- OpenAI API key must be configured
- Check network connection
- Look for errors in browser console

## Cost Estimates

### OpenAI (gpt-3.5-turbo)
- ~$0.0015 per narration
- ~$0.0010 per chat message
- Very affordable for development

### ElevenLabs
- Free tier: 10,000 characters/month
- Enough for ~100-200 narrations
- Perfect for testing!

## Security Note

⚠️ **IMPORTANT**: Never commit your `.env` file to git!

The `.env` file is already in `.gitignore` to prevent accidental commits.

## Need Help?

Check the browser console (F12) for detailed logs:
- 🎯 Targeting events
- 📝 Narration generation
- 🎙️ Audio playback
- 💬 Chat interactions

---

**Enjoy exploring the cosmos with SpAIce! 🚀✨**
