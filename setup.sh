#!/bin/bash

echo "========================================"
echo "Niyabalawa POS - Initial Setup"
echo "========================================"
echo ""

echo "[1/3] Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install frontend dependencies"
    exit 1
fi

echo ""
echo "[2/3] Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install backend dependencies"
    exit 1
fi

echo ""
echo "[3/3] Setting up database..."
echo "Please make sure PostgreSQL is running!"
echo ""
read -p "Do you want to setup the database now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run db:setup
    if [ $? -ne 0 ]; then
        echo "Database setup failed - please configure .env and try again"
        echo "You can run 'cd backend && npm run db:setup' later"
    fi
else
    echo "Skipping database setup"
    echo "Remember to configure backend/.env and run:"
    echo "  cd backend"
    echo "  npm run db:setup"
fi

cd ..
echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Configure backend/.env with your database credentials"
echo "  2. Run 'npm run electron:dev' to start the app"
echo ""
