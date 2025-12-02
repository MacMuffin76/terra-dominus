@echo off
setlocal enabledelayedexpansion

echo Killing process on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 2^>nul') do (
    set pid=%%a
    if "!pid!" NEQ "" if "!pid!" NEQ "0" (
        echo Killing PID !pid!
        taskkill /PID !pid! /F >nul 2>&1
    )
)

echo Killing process on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 2^>nul') do (
    set pid=%%a
    if "!pid!" NEQ "" if "!pid!" NEQ "0" (
        echo Killing PID !pid!
        taskkill /PID !pid! /F >nul 2>&1
    )
)

echo.
echo Starting backend...
cd /d "%~dp0backend"
start "Terra-Backend" cmd /c "npm start"

echo Starting frontend...
cd /d "%~dp0frontend"
start "Terra-Frontend" cmd /c "npm start"

echo.
echo Done. Backend (port 5000) and Frontend (port 3000) started.
pause
