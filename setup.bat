@echo off
echo 🚀 이미지 검색 데스크톱 앱 초기 설정
echo ==================================

REM 1. 의존성 설치
echo 📦 의존성 설치 중...
call npm install

REM 2. 아이콘 생성 확인
if not exist "src-tauri\icons\icon.png" (
    echo 🎨 아이콘 생성 중...
    
    REM 아이콘 디렉토리 생성
    mkdir src-tauri\icons 2>nul
    
    REM 기본 아이콘 다운로드
    powershell -Command "Invoke-WebRequest -Uri 'https://via.placeholder.com/512x512/4A90E2/FFFFFF?text=Search' -OutFile 'src-tauri\icons\icon.png'"
    
    REM Tauri 아이콘 생성
    call npx tauri icon src-tauri\icons\icon.png
) else (
    echo ✅ 아이콘이 이미 존재합니다.
)

REM 3. 완료 메시지
echo.
echo ✨ 설정 완료!
echo 개발 서버를 시작하려면 다음 명령어를 실행하세요:
echo.
echo   npm run tauri:dev
echo.
echo 프로덕션 빌드를 만들려면:
echo.
echo   npm run build:safe
echo.
pause
