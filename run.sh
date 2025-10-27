#!/bin/bash

# Track My Bets - Development Runner
# This script starts both backend and frontend servers

echo "🎯 Track My Bets - Starting Development Servers"
echo "================================================"
echo ""

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.11+"
    exit 1
fi

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null; then
    echo "⚠️  PostgreSQL is not running. Please start PostgreSQL first."
    echo "   Mac: brew services start postgresql"
    echo "   Linux: sudo service postgresql start"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Start backend
echo "🚀 Starting Backend (FastAPI)..."
cd backend

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/.installed" ]; then
    echo "📦 Installing Python dependencies..."
    pip install -r requirements.txt
    touch venv/.installed
fi

# Check if migrations are applied
if ! alembic current &> /dev/null; then
    echo "🗄️  Running database migrations..."
    alembic upgrade head
fi

# Start backend in background
echo "✅ Backend starting on http://localhost:8000"
uvicorn app.main:app --reload &
BACKEND_PID=$!

cd ..

# Give backend time to start
sleep 2

# Start frontend
echo ""
echo "🚀 Starting Frontend (Vite)..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node dependencies..."
    npm install
fi

# Start frontend in background
echo "✅ Frontend starting on http://localhost:5173"
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "================================================"
echo "✅ Both servers are running!"
echo ""
echo "📡 Backend API: http://localhost:8000"
echo "📄 API Docs:    http://localhost:8000/docs"
echo "🌐 Frontend:    http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "================================================"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set up trap to catch Ctrl+C
trap cleanup INT TERM

# Wait for both processes
wait
