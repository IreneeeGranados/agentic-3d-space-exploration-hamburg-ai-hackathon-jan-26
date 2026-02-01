# 🎙️ ElevenLabs Voice Integration - Complete Guide

## ✅ Current Status
**SpAIce voice narration is FULLY INTEGRATED and READY TO USE!**

Your API keys are already configured:
- ✅ OpenAI API Key: Configured
- ✅ ElevenLabs API Key: Configured

## 🎤 How It Works

### Voice Generation Pipeline
1. **User presses `N`** near a planet
2. **Loading screen appears** (SpAIce with closed mouth)
3. **OpenAI generates** planet description text
4. **ElevenLabs converts** text to natural voice audio
5. **Audio plays automatically** with SpAIce talking animation
6. **Face animates** with mouth movements while speaking

### Voice Configuration
- **Voice**: Rachel (Professional, warm, clear)
- **Model**: eleven_monolingual_v1 (English)
- **Stability**: 0.5 (Balanced)
- **Similarity Boost**: 0.75 (High)
- **Speaker Boost**: Enabled

## 🎯 Testing Voice Narration

### Quick Test
1. Start the application:
   ```bash
   npm run dev
   ```

2. Navigate close to any planet (within 5M units)

3. Press `N` key

4. Watch for console logs:
   ```
   🎙️ Generating narration for [Planet Name]...
   📝 Step 1: Generating text description...
   ✅ Text generated: "..."
   🎤 Step 2: Generating audio narration...
   📝 Text length: 150 characters
   ✅ ElevenLabs TTS generated: 24576 bytes (24.00 KB)
   ✅ Audio cached successfully
   ✅ Narration ready for [Planet Name]
   🔊 Audio playing
   ```

5. SpAIce should speak the description!

### What You Should See/Hear
- ✅ Loading screen with floating SpAIce face
- ✅ Dialog appears with typewriter text effect
- ✅ SpAIce face animates with talking mouth
- ✅ Natural human voice speaks the planet description
- ✅ Audio indicator shows "🔊 SpAIce is speaking..."
- ✅ Face glows while talking

## 🔍 Troubleshooting

### No Audio Playing?

#### Check 1: Browser Console
Open browser console (F12) and look for:
- ✅ `✅ ElevenLabs TTS generated` = Success!
- ❌ `❌ ElevenLabs TTS error` = Problem found

#### Check 2: API Key
```javascript
// Should see this in console:
"🎤 Step 2: Generating audio narration..."
"✅ Audio generated: X bytes"
```

If you see:
```
"⚠️ Eleven Labs not configured, skipping audio"
```
Then check your `.env` file has:
```
VITE_ELEVENLABS_API_KEY=your-actual-key-here
```

#### Check 3: Browser Audio Permissions
- Make sure browser allows audio playback
- Check system volume is not muted
- Try clicking somewhere on the page first (browser autoplay policy)

#### Check 4: Character Quota
ElevenLabs free tier includes:
- 10,000 characters/month
- ~100-200 narrations

Check your quota at: https://elevenlabs.io/app/settings

### Common Error Messages

#### "Invalid ElevenLabs API key"
- ❌ API key is wrong or expired
- ✅ Get new key from: https://elevenlabs.io/app/settings/api-keys
- Update in `.env` file

#### "Rate limit exceeded"
- ❌ Too many requests too quickly
- ✅ Wait 30 seconds and try again

#### "Character quota exceeded"
- ❌ You've used your monthly character limit
- ✅ Wait for quota reset or upgrade plan

#### Audio plays but no sound
- Check system volume
- Check browser audio settings
- Try headphones to rule out speaker issues

## 🎨 Voice Customization

Want a different voice? Edit `src/ai/ElevenLabsService.js`:

```javascript
this.config = {
  voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel (default)
  // Try these alternatives:
  // voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam
  // voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella
  // voiceId: 'ErXwobaYiN019PkySvjV', // Antoni
  model: 'eleven_monolingual_v1',
  stability: 0.5,      // 0.0-1.0 (lower = more expressive)
  similarityBoost: 0.75 // 0.0-1.0 (higher = more similar to training)
};
```

Get all available voices:
```bash
curl https://api.elevenlabs.io/v1/voices \
  -H "xi-api-key: YOUR_API_KEY"
```

## 📊 Monitoring Usage

### In Console
Every narration shows:
```
🎤 Generating audio with ElevenLabs...
📝 Text length: 150 characters
✅ Audio generated: 24.5 KB
```

### Character Count
Approximate characters per narration: **120-180 characters**

With 10,000 free characters = **~55-83 narrations/month**

### Cache System
Audio is cached per planet, so:
- First visit: Uses API (counts toward quota)
- Revisit same planet: Uses cache (FREE!)

Check cache stats in console:
```javascript
console.log('Cache stats:', narrationService.getCacheStats());
// Output: { textCached: 5, audioCached: 5 }
```

## 🚀 Performance Tips

1. **Let audio finish before requesting new narration**
   - Audio is cached, so revisiting planets is instant!

2. **Clear cache if needed**
   ```javascript
   narrationService.clearCache();
   ```

3. **Monitor your quota**
   - Visit: https://elevenlabs.io/app/settings
   - Check "Character Usage" section

## 🎯 Advanced Features

### Custom Voice Settings Per Narration
Modify `NarrationService.js` to pass custom settings:

```javascript
async generateAudio(text, customSettings = {}) {
  if (customSettings.voiceId) {
    // Temporarily change voice
    const originalVoiceId = this.elevenLabsService.config.voiceId;
    this.elevenLabsService.config.voiceId = customSettings.voiceId;
    
    const audio = await this.elevenLabsService.textToSpeech(text);
    
    // Restore original
    this.elevenLabsService.config.voiceId = originalVoiceId;
    return audio;
  }
  
  return await this.elevenLabsService.textToSpeech(text);
}
```

### Multi-Language Support
Change model for other languages:
```javascript
model: 'eleven_multilingual_v2'  // Supports 29+ languages
```

## 🐛 Debug Mode

Enable detailed logging in `ElevenLabsService.js`:

```javascript
async textToSpeech(text, useCache = true) {
  console.log('🎙️ ElevenLabs Request:', {
    text: text.substring(0, 50) + '...',
    textLength: text.length,
    voiceId: this.config.voiceId,
    model: this.config.model,
    cached: useCache && this.cache.has(`${this.config.voiceId}-${text}`)
  });
  
  // ... rest of method
}
```

## ✨ Everything is Working If:
- ✅ Loading screen appears when you press `N`
- ✅ Console shows ElevenLabs API calls
- ✅ Audio size logged (e.g., "24.5 KB")
- ✅ SpAIce face animates with talking mouth
- ✅ You hear natural human voice
- ✅ Audio indicator shows while playing
- ✅ Face stops animating when audio ends

## 🎉 Ready to Test!

```bash
npm run dev
```

Fly near a planet, press `N`, and **hear SpAIce speak**! 🚀🎙️✨

---

**For issues, check browser console for detailed error messages.**
