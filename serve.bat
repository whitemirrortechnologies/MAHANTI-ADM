@echo off
cd /d "%~dp0"
echo MahaNiti running at http://localhost:5173  (press Ctrl+C to stop)
start "" http://localhost:5173
python -m http.server 5173
