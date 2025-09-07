#!/bin/bash

# Fashion Image Search v21.4 실행

echo "🚀 Fashion Image Search v21.4 시작..."

# 캐시 클리어
echo "🧹 캐시 클리어 중..."
rm -rf dist node_modules/.vite

# 실행
echo "🔄 앱 실행..."
npm run tauri:dev
