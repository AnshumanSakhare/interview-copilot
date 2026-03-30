# Interview Copilot: Real-time Voice Coaching with Gemini 3.1 Flash Live

A full-stack web application that provides real-time AI-powered interview coaching using the Gemini 3.1 Flash Live model via WebSocket streaming.

## Architecture

```
Frontend (Next.js 15)
├── Web Audio API for microphone capture
├── PCM16 encoding (16kHz, 16-bit mono)
└── WebSocket streaming to backend

Backend (Python FastAPI)
├── WebSocket server for audio/text
├── Gemini 3.1 Flash Live integration
└── Real-time response streaming

Gemini 3.1 Flash Live
└── Low-latency bidrectional streaming model
```

## Features

✨ **Real-time Streaming**
- Live microphone audio capture and encoding
- Bidirectional WebSocket for instant feedback
- Streaming responses that update progressively

🎯 **Interview Coaching**
- Real-time transcript cleaning
- AI-improved answer generation
- Filler word detection and suggestions
- Follow-up question generation

🔄 **Robust Connectivity**
- Automatic reconnection logic
- Error handling and recovery
- Connection status monitoring

## Prerequisites

- Node.js 18+ (for frontend)
- Python 3.9+ (for backend)
- Gemini API Key ([Get from Google AI Studio](https://aistudio.google.com/app/apikey))
- Modern browser with WebRTC support

## Local Setup

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create Python virtual environment**
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your GEMINI_API_KEY:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   BACKEND_PORT=8000
   FRONTEND_URL=http://localhost:3000
   ```

5. **Run backend**
   ```bash
   python main.py
   ```

   You should see:
   ```
   🎤 Interview Copilot backend starting...
   🚀 Starting Interview Copilot backend on port 8000
   ✓ Configuration loaded
   ```

### Frontend Setup

1. **Navigate to frontend directory** (in a new terminal)
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` if using custom backend URL:
   ```
   NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   ▲ Next.js 15.x
   - Local:        http://localhost:3000
   ```

5. **Open in browser**
   - Navigate to http://localhost:3000

## Usage

1. **Start Recording**
   - Click "🎙️ Start Recording" button
   - Allow microphone access when prompted
   - Status changes to "Recording..."

2. **Speak Naturally**
   - Answer interview questions
   - Let the AI process partial/incomplete sentences
   - No need to wait for full answers

3. **View Real-time Feedback**
   - Watch transcript update as you speak
   - See AI-improved answer being generated
   - Get filler word suggestions if detected
   - Read follow-up questions

4. **Stop Recording**
   - Click "⏹️ Stop" when finished
   - Status changes to "Processing..."
   - Final responses appear within 1-2 seconds

## System Prompt

The AI follows this strict format:

```
Transcript: [cleaned version of what user said]
Better Answer: [polished, professional response]
Suggestion: [only if filler words detected]
Follow-ups: [1-2 relevant next questions]
```

Key behaviors:
- Updates incrementally as user speaks
- Cleanses filler words (uh, um, like, etc.)
- Generates improvement suggestions only when needed
- Keeps responses under 120 words
- Provides context-aware follow-up questions

## Deployment

### Backend Deployment (Railway)

1. **Create Railway project**
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub
   - Select your repository

2. **Set environment variables**
   ```
   GEMINI_API_KEY=your_api_key
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   ```

3. **Configure start command**
   - In Railway dashboard: Settings → Deployment
   - Start Command: `pip install -r requirements.txt && python main.py`
   - Or use Procfile:
     ```
     web: python main.py
     ```

4. **Deploy**
   - Push to GitHub
   - Railway auto-deploys

### Frontend Deployment (Vercel)

1. **Create Vercel project**
   - Go to [vercel.com](https://vercel.com)
   - Import project from GitHub
   - Select `frontend` directory as root

2. **Set environment variables**
   ```
   NEXT_PUBLIC_WS_URL=wss://your-backend-domain.up.railway.app/ws
   ```

3. **Deploy**
   - Vercel auto-deploys on push to main

## Development

### Project Structure

```
interview-copilot/
├── frontend/
│   ├── app/
│   │   ├── page.tsx          # Main component
│   │   ├── layout.tsx        # Layout wrapper
│   │   ├── page.module.css   # Styles
│   │   └── globals.css       # Global styles
│   ├── lib/
│   │   ├── audio.ts          # Audio capture & PCM encoding
│   │   └── ws.ts             # WebSocket client
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.local.example
│
└── backend/
    ├── main.py              # FastAPI app & WebSocket handler
    ├── config.py            # Configuration
    ├── requirements.txt
    └── .env.example
```

### Key Components

**Frontend**
- `AudioCapture`: Web Audio API wrapper, PCM16 encoding
- `InterviewCopilotWS`: WebSocket client with reconnection logic
- `page.tsx`: React component with real-time UI updates

**Backend**
- `InterviewSession`: Per-connection session manager
- `websocket_endpoint`: WebSocket handler, streaming logic
- Gemini Live integration with structured output parsing

## API Reference

### WebSocket Messages (Client → Server)

**Audio Data**
- Binary data: PCM16 audio chunk (16kHz, 16-bit mono)

**Control Messages**
```json
{
  "type": "control",
  "command": "start" | "stop"
}
```

### WebSocket Messages (Server → Client)

```json
{
  "type": "transcript" | "better_answer" | "suggestion" | "follow_ups" | "error",
  "content": "string content"
}
```

### REST Endpoints

**GET /health**
- Returns server health status
- Response: `{ "status": "healthy", "model": "gemini-3.1-flash-live-preview", "api": "Interview Copilot" }`

## Troubleshooting

### "Failed to connect" error
- Check backend is running: `http://localhost:8000/health`
- Verify CORS settings in `main.py`
- Check firewall allows WebSocket connections

### Audio not working
- Grant microphone permissions in browser
- Check browser console for errors
- Verify HTTPS/WSS when deployed (not HTTP/WS)

### Gemini not responding
- Verify API key in `.env`
- Check Gemini API has Live model access
- Monitor backend logs for errors

### WebSocket disconnects frequently
- Check network stability
- Increase reconnection attempts in `lib/ws.ts`
- Monitor backend logs for timeouts

## Performance Tips

1. **Optimize Audio**
   - Keep microphone input at 16kHz
   - Use reasonable buffer sizes (4096 bytes)
   - Avoid high CPU usage local audio processing

2. **Network**
   - Use CDN for frontend (Vercel)
   - Place backend near users (Railway regions)
   - Monitor latency with WS ping/pong

3. **Streaming**
   - Incremental UI updates reduce latency perception
   - Stream partial responses immediately
   - Buffer audio chunks appropriately

## Support

- [Gemini API Docs](https://ai.google.dev/gemini-api)
- [Gemini Live API](https://ai.google.dev/gemini-api/docs/live-api)
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Guide](https://fastapi.tiangolo.com/)

## License

MIT

---

Built with ❤️ using Gemini 3.1 Flash Live
#   i n t e r v i e w - c o p i l o t  
 