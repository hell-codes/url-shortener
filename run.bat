@echo off
setlocal

set "ROOT=%~dp0"
set "VENV_PYTHON=%ROOT%.venv\Scripts\python.exe"

if not exist "%VENV_PYTHON%" (
    echo Creating the Python virtual environment...
    python -m venv "%ROOT%.venv"
    if errorlevel 1 (
        echo Failed to create the virtual environment. Make sure Python is installed and on PATH.
        pause
        exit /b 1
    )
)

echo Installing backend dependencies...
"%VENV_PYTHON%" -m pip install -r "%ROOT%requirements.txt"
if errorlevel 1 (
    echo Failed to install backend dependencies.
    pause
    exit /b 1
)

echo Starting the Flask API at http://127.0.0.1:5000 ...
start "Slotly Backend" /D "%ROOT%backend" "%VENV_PYTHON%" app.py

echo Starting the frontend at http://127.0.0.1:5500 ...
start "Slotly Frontend" /D "%ROOT%frontend" "%VENV_PYTHON%" -m http.server 5500

timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:5500/"

echo.
echo Slotly is running. Close the Backend and Frontend windows to stop it.
endlocal
