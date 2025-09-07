#!/bin/bash

# Fashion Image Search v21.3 실행 스크립트

echo "🚀 Fashion Image Search v21.3 시작..."

# 의존성 확인
if ! command -v npm &> /dev/null; then
    echo "❌ npm이 설치되지 않았습니다."
    exit 1
fi

# 의존성 설치 (필요한 경우)
if [ ! -d "node_modules/@tauri-apps" ]; then
    echo "📦 @tauri-apps/api 설치 중..."
    npm install @tauri-apps/api
fi

# 캐시 클리어
echo "🧹 캐시 클리어..."
rm -rf dist node_modules/.vite

# Tauri 개발 서버 시작
echo "🔄 Tauri 개발 서버 시작..."
npm run tauri:dev
