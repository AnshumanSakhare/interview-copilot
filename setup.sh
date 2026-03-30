#!/bin/bash

echo "🚀 Interview Copilot - Quick Start Guide"
echo "========================================"
echo ""

# Check prerequisites
echo "Checking prerequisites..."
command -v python3 &> /dev/null || { echo "❌ Python 3 not found"; exit 1; }
command -v node &> /dev/null || { echo "❌ Node.js not found"; exit 1; }
command -v npm &> /dev/null || { echo "❌ npm not found"; exit 1; }
echo "✓ All prerequisites found"
echo ""

# Backend setup
echo "Setting up backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
echo "⚠️  Edit backend/.env and add your GEMINI_API_KEY"
echo ""

# Frontend setup
echo "Setting up frontend..."
cd ../frontend
npm install
cp .env.local.example .env.local
echo ""

echo "✅ Setup complete!"
echo ""
echo "To start the app:"
echo "1. Terminal 1 (Backend):"
echo "   cd backend"
echo "   source venv/bin/activate  # or venv\Scripts\activate on Windows"
echo "   python main.py"
echo ""
echo "2. Terminal 2 (Frontend):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3. Open http://localhost:3000"
