@echo off
REM Track My Bets - Development Runner (Windows)
REM This script starts both backend and frontend servers

echo.
echo 🎯 Track My Bets - Starting Development Servers
echo ================================================
echo.

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python not found. Please install Python 3.11+
    exit /b 1
)

REM Check if Node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found. Please install Node.js 18+
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

REM Start backend
echo 🚀 Starting Backend (FastAPI)...
cd backend

REM Check if venv exists
if not exist "venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
)

REM Activate venv and install dependencies
call venv\Scripts\activate

if not exist "venv\.installed" (
    echo 📦 Installing Python dependencies...
    pip install -r requirements.txt
    echo. > venv\.installed
)

REM Run migrations
echo 🗄️  Checking database migrations...
alembic upgrade head

REM Start backend in new window
echo ✅ Backend starting on http://localhost:8000
start "FastAPI Backend" cmd /k "venv\Scripts\activate && uvicorn app.main:app --reload"

cd ..

REM Wait a moment for backend to start
timeout /t 2 /nobreak >nul

REM Start frontend
echo.
echo 🚀 Starting Frontend (Vite)...
cd frontend

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing Node dependencies...
    call npm install
)

REM Start frontend in new window
echo ✅ Frontend starting on http://localhost:5173
start "Vite Frontend" cmd /k "npm run dev"

cd ..

echo.
echo ================================================
echo ✅ Both servers are running in separate windows!
echo.
echo 📡 Backend API: http://localhost:8000
echo 📄 API Docs:    http://localhost:8000/docs
echo 🌐 Frontend:    http://localhost:5173
echo.
echo Close the server windows to stop the servers
echo ================================================
echo.

pause
