#!/bin/bash

echo "🔧 v20.1 캐시 클리어 및 재시작..."

# 프로세스 종료
echo "1. Tauri 프로세스 종료..."
pkill -f "tauri" || true
pkill -f "image-search" || true

# dist 폴더 삭제 (빌드 캐시)
echo "2. 빌드 캐시 삭제..."
rm -rf dist/* 2>/dev/null || true

# node_modules/.vite 캐시 삭제
echo "3. Vite 캐시 삭제..."
rm -rf node_modules/.vite 2>/dev/null || true

# 브라우저 캐시 클리어를 위한 메시지
echo "
⚠️  브라우저 캐시 클리어 필요!
----------------------------
앱이 실행되면:
1. Cmd + Shift + R (Mac) 또는 Ctrl + Shift + F5 (Windows)
2. 또는 개발자 도구(F12) → Network 탭 → Disable cache 체크
"

# 서버 재시작
echo "4. 서버 재시작..."
npm run tauri:dev

