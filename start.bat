@echo off
setlocal EnableDelayedExpansion

cd /d "%~dp0"

set "NODE_EXE=node"
if exist "D:\nodejs-v22\node.exe" set "NODE_EXE=D:\nodejs-v22\node.exe"

if not defined ADMIN_HOST set "ADMIN_HOST=127.0.0.1"
if not defined ADMIN_PORT set "ADMIN_PORT=3007"

if /I "%~1"=="--check" (
  echo Project root: !CD!
  echo Node: !NODE_EXE!
  "!NODE_EXE!" --version
  echo ADMIN_HOST=!ADMIN_HOST!
  echo ADMIN_PORT=!ADMIN_PORT!
  if exist "%~dp0build-web.ps1" (
    echo Build script: build-web.ps1 found
  ) else (
    echo Build script: build-web.ps1 not found, will use Vite directly
  )
  exit /b 0
)

echo.
echo [1/2] Building web assets...
if exist "%~dp0build-web.ps1" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-web.ps1"
) else (
  pushd "%~dp0web"
  "!NODE_EXE!" node_modules\vite\bin\vite.js build
  set "BUILD_EXIT=!ERRORLEVEL!"
  popd
  if not "!BUILD_EXIT!"=="0" exit /b !BUILD_EXIT!
)

if errorlevel 1 (
  echo.
  echo Web build failed. Fix the error above and run start.bat again.
  pause
  exit /b 1
)

echo.
echo [2/2] Starting QQ Farm Automation Bot...
echo URL: http://localhost:%ADMIN_PORT%
echo Press Ctrl+C to stop.
echo.

pushd "%~dp0core"
"!NODE_EXE!" client.js
set "APP_EXIT=!ERRORLEVEL!"
popd

echo.
echo Server stopped with exit code !APP_EXIT!.
pause
exit /b !APP_EXIT!
