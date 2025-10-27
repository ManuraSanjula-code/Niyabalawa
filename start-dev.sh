#!/bin/bash

echo "========================================"
echo "Starting Niyabalawa POS Development"
echo "========================================"
echo ""

echo "[1/3] Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install backend dependencies"
    exit 1
fi

echo ""
echo "[2/3] Starting backend server..."
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!

echo ""
echo "[3/3] Waiting for backend to start..."
sleep 5

cd ..
echo ""
echo "[4/4] Starting Electron app with Vite..."
npm run electron:dev

# Kill backend on exit
kill $BACKEND_PID 2>/dev/null
