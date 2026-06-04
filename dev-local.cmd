@echo off
cd /d "%~dp0"
if not exist ".env.local" (
  copy ".env.example" ".env.local" >nul
)
npm run dev -- -p 3012
