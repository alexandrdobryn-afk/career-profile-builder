@echo off
cd /d "%~dp0"
if not exist ".env.local" (
  copy ".env.example" ".env.local" >nul
)
npm run start -- -p 3012
