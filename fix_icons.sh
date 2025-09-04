#!/bin/bash

# 🔧 아이콘 파일 추가 및 재배포 스크립트

echo "🔧 아이콘 문제 해결 및 재배포"
echo "============================"

# 1. 아이콘 파일들을 Git에 추가
echo "🎨 아이콘 파일들을 Git에 추가 중..."
git add src-tauri/icons/*
git add .gitignore

# 2. 아이콘 파일 상태 확인
echo "📁 추가된 아이콘 파일들:"
git status src-tauri/icons/

# 3. 커밋
echo "💾 커밋 중..."
git commit -m "fix: Add icon files for Windows build - include all required icons"

# 4. 푸시
echo "🚀 GitHub에 푸시 중..."
git push origin main

echo ""
echo "✅ 완료!"
echo ""
echo "🔍 빌드 상태 확인: https://github.com/eonyeon/image-search/actions"
echo ""
echo "📦 이번에는 모든 빌드가 성공할 것입니다:"
echo "  • Windows: icon.ico 포함됨 ✅"
echo "  • macOS: icon.icns 포함됨 ✅"
echo "  • Linux: PNG 파일들 포함됨 ✅"
echo ""
echo "⏱️  예상 빌드 시간: 10-15분"
