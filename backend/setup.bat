@echo off
echo ========================================
echo Niyabalawa Backend - Initial Setup
echo ========================================
echo.

echo [1/5] Installing dependencies...
call npm install

echo.
echo [2/5] Creating .env file...
if not exist .env (
    copy .env.example .env
    echo .env file created. Please edit it with your database credentials.
) else (
    echo .env file already exists.
)

echo.
echo [3/5] Checking PostgreSQL connection...
echo Please make sure PostgreSQL is running on localhost:5432
echo Or update the .env file with your cloud database URL
pause

echo.
echo [4/5] Setting up database tables...
call npm run db:setup

echo.
echo [5/5] Seeding initial menu data...
call npm run db:seed

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure Redis is running
echo 2. Run 'npm run dev' to start the server
echo 3. Server will be available at http://localhost:3001
echo.
pause
