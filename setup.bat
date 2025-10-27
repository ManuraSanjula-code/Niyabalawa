@echo off
echo ========================================
echo Niyabalawa POS - Initial Setup
echo ========================================
echo.

echo [1/3] Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo [2/3] Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo [3/3] Setting up database...
echo Please make sure PostgreSQL is running!
echo.
choice /C YN /M "Do you want to setup the database now"
if errorlevel 2 goto skip_db
if errorlevel 1 goto setup_db

:setup_db
call npm run db:setup
if errorlevel 1 (
    echo Database setup failed - please configure .env and try again
    echo You can run 'cd backend && npm run db:setup' later
)
goto done

:skip_db
echo Skipping database setup
echo Remember to configure backend/.env and run:
echo   cd backend
echo   npm run db:setup

:done
cd ..
echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Configure backend/.env with your database credentials
echo   2. Run 'npm run electron:dev' to start the app
echo.
pause
