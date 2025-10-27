@echo off
echo ========================================
echo Starting Niyabalawa POS Development
echo ========================================
echo.

echo [1/3] Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo [2/3] Starting backend server...
start /B cmd /c "npm run dev > ../backend.log 2>&1"

echo.
echo [3/3] Waiting for backend to start...
timeout /t 5 /nobreak > nul

cd ..
echo.
echo [4/4] Starting Electron app with Vite...
npm run electron:dev

pause
