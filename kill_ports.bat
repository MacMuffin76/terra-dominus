@echo off
setlocal enabledelayedexpansion

echo Killing process on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    set pid=%%a
    if "!pid!" NEQ "" (
        echo Killing PID !pid!
        taskkill /PID !pid! /F
    )
)

echo Killing process on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    set pid=%%a
    if "!pid!" NEQ "" (
        echo Killing PID !pid!
        taskkill /PID !pid! /F
    )
)

echo Done.
