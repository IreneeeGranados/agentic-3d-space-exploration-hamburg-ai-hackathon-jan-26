# 🎤 Quick Voice Test

## Step-by-Step Test

### 1. Start Application
```bash
npm run dev
```

### 2. Open Browser Console
Press `F12` to open developer tools

### 3. Navigate to a Planet
- Use arrow keys to fly
- Look for nearby planets
- Get within 5M units

### 4. Activate SpAIce
Press `N` key

### 5. Watch Console Output
You should see (in order):

```
🎙️ Narrating [Planet Name]...
📝 Generating narration...
📝 Step 1: Generating text description...
🤖 generateDescription called for [Planet Name]
📡 Calling OpenAI...
✅ OpenAI response received
✅ Text generated: "..."
🎤 Step 2: Generating audio narration...
🎤 Generating audio with ElevenLabs...
📝 Text length: 150 characters
✅ ElevenLabs TTS generated: 24576 bytes (24.00 KB)
✅ Audio cached successfully
✅ Narration ready for [Planet Name]
💬 Showing narrator dialog...
🎬 NarratorDialog.show() called
✅ Planet name set to: [Planet Name]
👁️ Adding visible class to container...
🔊 Audio playing
```

### 6. Verify Visual Elements
- ✅ Loading screen appears (SpAIce floating)
- ✅ "SpAIce is thinking..." text
- ✅ Bouncing dots animation
- ✅ Dialog appears after loading
- ✅ Text types out character by character
- ✅ SpAIce face animates (talking mouth)
- ✅ Audio indicator shows "🔊 SpAIce is speaking..."

### 7. Listen for Audio
**You should HEAR a natural human voice speaking the planet description!**

If no audio:
- Check system volume
- Check browser isn't muted
- Look for errors in console

## Expected Timeline
1. Press `N` - Instant
2. Loading screen - Instant
3. OpenAI text generation - 2-4 seconds
4. ElevenLabs audio generation - 3-5 seconds
5. Dialog shows with audio - Instant
6. Audio plays - Depends on text length (5-15 seconds)

## Success Indicators
✅ Console shows "✅ ElevenLabs TTS generated: X bytes"
✅ Console shows "🔊 Audio playing"
✅ SpAIce face has animated mouth
✅ Audio indicator is visible
✅ You hear voice narration

## Failure Indicators
❌ Console shows "⚠️ Eleven Labs not configured"
  → Check .env file has VITE_ELEVENLABS_API_KEY

❌ Console shows "❌ ElevenLabs TTS error: 401"
  → API key is invalid or expired

❌ Console shows "❌ ElevenLabs TTS error: 429"
  → Rate limit hit, wait 30 seconds

❌ Console shows "Character quota exceeded"
  → Monthly limit reached

❌ Audio generated but no sound
  → Check system/browser audio settings

## Quick Debug Commands

Open browser console and try:

```javascript
// Check if ElevenLabs service exists
console.log('ElevenLabs:', window.app?.narrationService?.elevenLabsService);

// Check cache
console.log('Cache stats:', window.app?.narrationService?.getCacheStats());

// Test audio element
const audio = new Audio();
console.log('Can play audio:', audio.canPlayType('audio/mpeg'));
```

## Still Not Working?

1. Restart dev server (`Ctrl+C` then `npm run dev`)
2. Clear browser cache
3. Check `.env` file exists and has keys
4. Verify keys at:
   - OpenAI: https://platform.openai.com/api-keys
   - ElevenLabs: https://elevenlabs.io/app/settings/api-keys

---

**If everything works, you should hear SpAIce's voice! 🎉**
