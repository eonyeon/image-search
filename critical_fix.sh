#!/bin/bash

# 🚨 Windows 파일 선택 긴급 패치 v11.3

echo "🚨 Windows 파일 선택 문제 긴급 수정"
echo "==================================="

# 백업 생성
echo "💾 현재 버전 백업 중..."
cp src/main.js src/main_broken_backup.js

# v11.3 적용
echo "📝 v11.3 Tauri Dialog 버전 적용..."
cp src/main_v11_3_tauri.js src/main.js

# Git에 추가
echo "➕ 변경사항 추가 중..."
git add src/main.js
git add src/main_v11_3_tauri.js

# 커밋
echo "💾 커밋 중..."
git commit -m "critical-fix: Windows file selection with Tauri Dialog API + model caching"

# 푸시
echo "🚀 GitHub에 푸시 중..."
git push origin main

echo ""
echo "✅ 긴급 패치 완료!"
echo ""
echo "🔧 수정 내용:"
echo "  • Tauri Dialog API로 파일 선택 (Windows 호환)"
echo "  • 모델 캐싱 구현 (재다운로드 방지)"
echo "  • 드래그 앤 드롭 개선"
echo ""
echo "📦 새 빌드가 자동으로 시작됩니다 (10-15분)"
echo "🔍 빌드 상태: https://github.com/eonyeon/image-search/actions"
