#!/bin/bash

# 🔧 개발자 도구 활성화 및 진단 콘솔 추가

echo "🔧 개발자 도구 활성화 및 진단 콘솔 추가"
echo "======================================="

# Git 커밋 및 푸시
echo "📦 변경사항 커밋..."
git add .
git commit -m "feat: enable devtools and add diagnostic console page"

echo "🚀 GitHub 푸시..."
git push origin main

echo ""
echo "✅ 완료!"
echo ""
echo "🎯 개발자 도구 여는 방법:"
echo "  1. Ctrl + Shift + I (Windows)"
echo "  2. 마우스 우클릭 → 검사"
echo "  3. 앱 내 '진단 콘솔' 버튼 클릭"
echo ""
echo "📊 진단 콘솔 사용법:"
echo "  1. 인덱싱 모드로 전환"
echo "  2. '진단 콘솔' 버튼 클릭"
echo "  3. 각 버튼으로 진단 실행"
echo ""
echo "💡 개발자 도구가 안 열리면:"
echo "  → 진단 콘솔 페이지 사용!"
echo ""
echo "🔍 빌드: https://github.com/eonyeon/image-search/actions"
