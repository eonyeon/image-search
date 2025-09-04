#!/bin/bash

# 🔧 Windows 이미지 업로드 문제 긴급 수정

echo "🔧 Windows 이미지 업로드 문제 긴급 수정"
echo "======================================"

# 백업 생성
echo "💾 현재 버전 백업 중..."
cp src/main.js src/main_v10_3_backup.js

# 파일 복사 (수정된 v11.2를 main.js로)
echo "📝 수정된 v11.2 적용 중..."
cp src/main_v11_2_fixed.js src/main.js

# Git에 추가
echo "➕ 변경사항 추가 중..."
git add src/main.js
git add src/main_v11_2_fixed.js

# 커밋
echo "💾 커밋 중..."
git commit -m "fix: Windows image upload issue - fix HTML/JS ID mismatch and event listeners"

# 푸시
echo "🚀 GitHub에 푸시 중..."
git push origin main

echo ""
echo "✅ 긴급 수정 완료!"
echo ""
echo "📦 새 빌드가 자동으로 시작됩니다:"
echo "  • Windows: 이미지 업로드 문제 해결"
echo "  • 예상 시간: 10-15분"
echo ""
echo "🔍 빌드 상태: https://github.com/eonyeon/image-search/actions"
