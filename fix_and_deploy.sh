#!/bin/bash

# 🔧 빌드 수정 및 재배포 스크립트

echo "🔧 빌드 문제 수정 및 재배포"
echo "=========================="

# 1. 변경사항 추가
echo "➕ 변경사항 추가 중..."
git add .

# 2. 커밋
echo "💾 커밋 중..."
git commit -m "fix: GitHub Actions build issues - fix Windows/Linux builds and macOS package size"

# 3. 푸시
echo "🚀 GitHub에 푸시 중..."
git push origin main

echo ""
echo "✅ 완료!"
echo ""
echo "🔍 빌드 상태 확인: https://github.com/eonyeon/image-search/actions"
echo ""
echo "📦 예상 결과:"
echo "  • Windows: .msi 파일 (~80MB)"
echo "  • macOS: .dmg 파일 (~100MB)"
echo "  • Linux: .deb/.AppImage 파일 (~90MB)"
echo ""
echo "⏱️  빌드 시간: 10-15분"
