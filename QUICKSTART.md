# Quick Start - 5 Minute Setup

## Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Gemini API Key (get it [here](https://aistudio.google.com/app/apikey))

## 1. Backend Setup (2 minutes)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows: venv\Scripts\activate)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure API key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start backend
python main.py
```

✅ You should see: `🚀 Starting Interview Copilot backend on port 8000`

## 2. Frontend Setup (2 minutes)

```bash
cd frontend

# Install dependencies
npm install

# Configure (optional, defaults to localhost:8000)
cp .env.local.example .env.local

# Start dev server
npm run dev
```

✅ You should see: `- Local: http://localhost:3000`

## 3. Test It (1 minute)

1. Open http://localhost:3000 in your browser
2. Click "🎙️ Start Recording"
3. Speak naturally (try: "I'm passionate about solving complex problems using technology")
4. Watch AI feedback update in real-time
5. Click "⏹️ Stop" when done

## What You Should See

- **Transcript**: Your cleaned-up speech
- **Better Answer**: Polished, professional version
- **Suggestion**: Filler words (if any: uh, um, like)
- **Follow-ups**: 1-2 relevant next interview questions

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Failed to connect" | Check backend is running at http://localhost:8000/health |
| Microphone not working | Check browser permissions (click browser icon) |
| No responses from AI | Verify GEMINI_API_KEY in backend/.env |
| CORS error | Make sure backend ran before frontend |

## Next Steps

- **Deploy**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Customize**: Edit system prompt in `backend/main.py`
- **Extend**: Add more sections to UI in `frontend/app/page.tsx`

---

**Questions?** Check the [README.md](./README.md) for full documentation.
