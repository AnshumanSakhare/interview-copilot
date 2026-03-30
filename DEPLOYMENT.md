# Interview Copilot - Deployment Guide

## Quick Deployment (5 minutes)

### Option 1: Railway + Vercel (Recommended)

#### Backend on Railway

1. **Fork/push to GitHub**
   ```bash
   git push origin main
   ```

2. **Create Railway account**
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub

3. **Create new Railway project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository
   - Select `/backend` directory

4. **Set environment variables**
   - In Railway dashboard: Variables
   - Add `GEMINI_API_KEY` = your API key
   - Add `FRONTEND_URL` = your Vercel frontend URL (e.g., `https://interview-copilot.vercel.app`)

5. **Deploy**
   - Railway auto-deploys
   - Copy the deployed URL (e.g., `https://interview-copilot-production.up.railway.app`)

#### Frontend on Vercel

1. **Create Vercel account**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub

2. **Import project**
   - Click "Add New..."
   - Select "Project"
   - Select your repository
   - Set "Root Directory" to `./frontend`

3. **Set environment variables**
   - Environment Variables:
     - `NEXT_PUBLIC_WS_URL` = `wss://your-railway-url/ws`
     - Replace `https://` with `wss://` in the URL

4. **Deploy**
   - Vercel auto-deploys
   - Your app is live!

---

### Option 2: Fly.io Backend + Vercel Frontend

#### Backend on Fly.io

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Create app**
   ```bash
   cd backend
   fly launch
   ```
   - Choose a name
   - Select region
   - Skip adding database

3. **Set secrets**
   ```bash
   fly secrets set GEMINI_API_KEY=your_api_key
   fly secrets set FRONTEND_URL=https://your-vercel-url.vercel.app
   ```

4. **Deploy**
   ```bash
   fly deploy
   ```

5. **Get URL**
   ```bash
   fly info
   ```
   - Note the HTTPS URL

#### Frontend on Vercel (same as Railway above)
- Use the Fly.io HTTPS URL for `NEXT_PUBLIC_WS_URL`
- Convert `https://` to `wss://`

---

### Option 3: Docker Locally

1. **Clone repository**
   ```bash
   git clone <your-repo>
   cd interview-copilot
   ```

2. **Create `.env` files**
   ```bash
   # backend/.env
   GEMINI_API_KEY=your_api_key
   BACKEND_PORT=8000
   FRONTEND_URL=http://localhost:3000
   ```

3. **Run with Docker Compose**
   ```bash
   docker-compose up
   ```

4. **Access**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000/health

---

## Environment Variables Checklist

### Backend `.env`
```
GEMINI_API_KEY=<Your Gemini API Key>
BACKEND_PORT=8000
FRONTEND_URL=<Your Vercel/Deployed Frontend URL>
```

### Frontend `.env.local`
```
NEXT_PUBLIC_WS_URL=<Backend WebSocket URL (wss:// for HTTPS)>
```

---

## Deployment Verification

### Test Backend
```bash
# Health check
curl https://your-backend-url/health

# Response should be:
# {"status":"healthy","model":"gemini-3.1-flash-live-preview","api":"Interview Copilot"}
```

### Test Frontend
1. Open https://your-vercel-url
2. Check browser console (F12) for any errors
3. Look for "Connected to backend" message
4. Try recording and speaking

---

## Troubleshooting Deployment

### CORS Error
**Problem**: "Access to XMLHttpRequest blocked by CORS policy"

**Solution**:
- Verify `FRONTEND_URL` in backend `.env` matches your Vercel URL
- Restart backend after changing `.env`

### WebSocket Connection Failed
**Problem**: "Failed to connect" in UI

**Solution**:
- Verify `NEXT_PUBLIC_WS_URL` in frontend matches backend URL
- Use `wss://` for HTTPS in production (not `ws://`)
- Check backend is running: `curl https://your-backend-url/health`

### API Key Invalid
**Problem**: No responses from Gemini

**Solution**:
- Get new API key from [aistudio.google.com](https://aistudio.google.com/app/apikey)
- Ensure Live model is available in your API quota
- Update `GEMINI_API_KEY` in backend

### SSL/TLS Error in Production
**Problem**: "ssl certificate_verify_failed"

**Solution**:
- Use `wss://` for WebSocket (ensures HTTPS compatibility)
- Railway/Vercel provide free SSL automatically
- No manual cert needed

---

## Performance Optimization

### Backend
- Use Railway's US regions for lower latency
- Monitor logs for slow API calls
- Increase Python worker processes if needed

### Frontend  
- Vercel Edge Network auto-optimizes globally
- Check DevTools Network tab for latency
- Ensure audio chunks are 4KB (not too large)

### Gemini Live
- Keep system prompt concise (improves latency)
- Stream responses incrementally (UI feels faster)
- Audio quality: 16kHz PCM is optimal

---

## Monitoring & Logs

### Railway Logs
```
Dashboard → Project → Logs
```

### Vercel Logs
```
Dashboard → Project → Deployments → [Your Deployment] → Logs
```

### Local Docker
```bash
docker-compose logs backend
docker-compose logs frontend
```

---

## Scaling

### For More Users
1. Railway: Upgrade plan or add more instances
2. Vercel: Auto-scales (no action needed)
3. Monitor API key rate limits with Gemini

### For Multiple Backend Regions
- Railway: Create projects in different regions
- Vercel: Update env var for regional backend URL
- Use CDN/load balancer for routing

---

## Cost Estimates (Monthly)

- **Vercel Frontend**: $0-20 (auto-scale)
- **Railway Backend**: $5-50 (usage-based)
- **Gemini API**: $0.15-5 per 1M tokens (pay as you go)
- **Total**: $5-75/month for small to medium usage

---

Need help? Check logs or open an issue on GitHub!
