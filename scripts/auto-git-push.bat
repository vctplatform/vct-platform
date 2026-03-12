@echo off
REM ======================================
REM VCT Platform — Auto Git Push Script
REM Chạy tự động hàng ngày qua Task Scheduler
REM ======================================

set PROJECT_DIR=d:\VCT PLATFORM\vct-platform
set LOG_FILE=%PROJECT_DIR%\git-auto-push.log

cd /d "%PROJECT_DIR%"

echo ========================================== >> "%LOG_FILE%"
echo [%date% %time%] Auto push started >> "%LOG_FILE%"

REM Kiểm tra có thay đổi không
git diff --quiet HEAD 2>nul
set TRACKED_CHANGED=%errorlevel%

for /f %%i in ('git ls-files --others --exclude-standard') do set UNTRACKED=1

if "%TRACKED_CHANGED%"=="0" if not defined UNTRACKED (
    echo [%date% %time%] No changes to push. >> "%LOG_FILE%"
    goto :end
)

REM Stage tất cả
git add -A >> "%LOG_FILE%" 2>&1

REM Tạo commit message tự động với ngày
set COMMIT_MSG=chore: auto-sync %date:~0,10%
git commit -m "%COMMIT_MSG%" >> "%LOG_FILE%" 2>&1

REM Push
git push origin main >> "%LOG_FILE%" 2>&1

if %errorlevel%==0 (
    echo [%date% %time%] Push successful. >> "%LOG_FILE%"
) else (
    echo [%date% %time%] Push FAILED! >> "%LOG_FILE%"
)

:end
echo [%date% %time%] Auto push finished. >> "%LOG_FILE%"
echo ========================================== >> "%LOG_FILE%"
