# Customization Guide

## Changing the System Prompt

Edit the system prompt in `backend/main.py`:

```python
SYSTEM_PROMPT = """You are a real-time AI Interview Copilot.
The user is speaking live...
"""
```

### Example Prompts

#### Sales Coach
```python
SYSTEM_PROMPT = """You are a Sales Pitch Coach.
The user is pitching a product. Provide real-time feedback on:
1. Pitch Clarity: Clean version of what they said
2. Sales Punch: More compelling, benefits-focused rewrite
3. Objections: Common objections to their pitch
4. Questions: Customer follow-up questions

Format:
Pitch Clarity: [cleaned]
Sales Punch: [compelling version]
Objections: [customer concerns]
Questions: [follow-up Qs]
"""
```

#### Public Speaking Coach
```python
SYSTEM_PROMPT = """You are a Public Speaking Coach.
The user is practicing a speech. Provide:
1. Transcript: Cleaned version
2. Delivery: More impactful phrasing
3. Issues: Filler words detected
4. Techniques: Rhetorical devices to use

Format:
Transcript: [cleaned]
Delivery: [impactful version]
Issues: [fillers/clarity problems]
Techniques: [suggestions]
"""
```

#### Job Interview Coach  
```python
SYSTEM_PROMPT = """You are a Job Interview Coach.
Help the candidate shine. Analyze:
1. Raw Answer: What they said
2. Perfect Answer: Professional version
3. Improvements: Filler words and pacing
4. Follow-ups: Likely interviewer questions

Format:
Raw Answer: [transcript]
Perfect Answer: [polished response]
Improvements: [feedback]
Follow-ups: [next questions]
"""
```

## Customizing the UI

### Add New Sections

Edit `frontend/app/page.tsx`:

```typescript
// Add new state field
const [state, setState] = useState<CopilotState>({
  transcript: '',
  betterAnswer: '',
  suggestion: '',
  followUps: '',
  newSection: '', // NEW
});

// Add handler for new type
const handleMessage = (message: StreamMessage) => {
  setState((prev) => {
    const updated = { ...prev };
    switch (type) {
      // ... existing cases ...
      case 'new_section': // NEW
        updated.newSection = content;
        break;
    }
    return updated;
  });
};

// Add UI element
<div className={styles.section}>
  <h2>🎯 New Section</h2>
  <div className={styles.content}>
    {state.newSection || <span className={styles.placeholder}>...</span>}
  </div>
</div>
```

### Change Colors

Edit `frontend/app/globals.css`:

```css
body {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}

.button.primary {
  background: linear-gradient(135deg, #your-gradient-1, #your-gradient-2);
}
```

### Adjust Styling

Edit `frontend/app/page.module.css`:

```css
.container {
  max-width: 1400px; /* Make wider */
  border-radius: 20px; /* More rounded */
}

.responseGrid {
  grid-template-columns: 1fr 1fr 1fr; /* 3 columns */
}
```

## Modifying Audio Settings

Edit `frontend/lib/audio.ts`:

```typescript
// Change sample rate (default: 16kHz required by Gemini)
const AUDIO_CONFIG: AudioConfig = {
  sampleRate: 16000, // Keep at 16000 for Gemini compatibility
  channelCount: 1,   // Keep mono
  bitDepth: 16,      // Keep 16-bit
};

// Adjust audio input options
const mediaStream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,    // Reduce echo
    noiseSuppression: true,    // Reduce background noise
    autoGainControl: false,    // Don't auto-adjust volume
    sampleRate: 16000,         // Keep at 16kHz
  },
});
```

## Changing Voice (if using Audio Output)

Edit `backend/main.py` in `get_audio_config()`:

```python
def get_audio_config(voice: str = "Ember") -> dict:
    """Available voices:
    - Ember: Energetic, youthful
    - Breeze: Calm, soothing
    - Cove: Conversational, friendly
    - Juniper: Warm, professional
    - Orbit: Futuristic, tech
    - Sage: Wise, authoritative
    """
```

## Backend Configuration

Edit `backend/config.py`:

```python
# Change backend port
BACKEND_PORT = int(os.getenv("BACKEND_PORT", "8000"))

# Change CORS allowed origins
# In main.py:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com", "https://www.yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Advanced: Custom Audio Processing

Edit `frontend/lib/audio.ts`:

```typescript
// Add audio visualization
async function visualizeAudio(audioBuffer: Float32Array) {
  // Compute RMS (volume)
  const rms = Math.sqrt(
    audioBuffer.reduce((sum, val) => sum + val * val, 0) / audioBuffer.length
  );
  
  // Send visualization data
  onVisualizationUpdate(rms);
}

// Add frequency analysis
function analyzeFrequency(buffer: Float32Array) {
  // Use FFT for pitch detection, etc.
  const fft = performFFT(buffer);
  return fft;
}
```

## Environment-Specific Settings

### Development (.env.local)
```
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

### Production (.env.production.local)
```
NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app/ws
```

## Performance Tuning

### Reduce Latency
```typescript
// Smaller audio buffer = faster updates
const CHUNK_SIZE = 2048; // was 4096

// Faster WebSocket reconnection
const reconnectDelay = 1000; // was 2000
```

### Reduce Bandwidth
```typescript
// Send audio less frequently
await asyncio.sleep(0.2) # 200ms between chunks instead of 100ms

// Compress before sending (if needed)
import zlib
compressed = zlib.compress(audio_chunk)
```

### Increase Throughput
```python
# Multiple concurrent connections (FastAPI handles automatically)
# Increase Gemini model thinking level if needed (more processing)
config = {
    "response_modalities": ["TEXT"],
    "thinking": {"type": "low"} # or "medium", "high" for more analysis
}
```

## Testing & Debugging

### Frontend Debugging

```typescript
// Add console logging in lib/ws.ts
console.log("Received:", message);

// DevTools Network tab
// - Check WebSocket frames (binary audio + JSON messages)
// - Monitor message latency

// Chrome DevTools
// - F12 → Network → Filter by WebSocket
// - Click WebSocket connection → Messages tab
```

### Backend Debugging

```python
# Add logging in main.py
logger.debug(f"Audio chunk size: {len(audio_chunk)} bytes")
logger.debug(f"Gemini response: {response.server_content.model_turn}")

# Run with verbose logging
# python main.py --log-level debug
```

### Test Commands

```bash
# Test backend health
curl http://localhost:8000/health

# Test from Python
import asyncio
import websockets
import json

async def test():
    async with websockets.connect("ws://localhost:8000/ws") as ws:
        # Send test message
        await ws.send(json.dumps({"type": "control", "command": "start"}))
        # Receive response
        response = await ws.recv()
        print(response)

asyncio.run(test())
```

---

**Need more customization?** Check the full source code and adjust as needed! The codebase is intentionally simple and well-commented for easy modification.
