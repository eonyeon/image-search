#!/bin/bash

# 🚀 Git 초기화 및 GitHub 푸시 스크립트
echo "🔧 Git 저장소 초기화 및 설정"
echo "============================"

# 1. Git 초기화
echo "📦 Git 저장소 초기화 중..."
git init

# 2. 사용자 정보 설정 (필요한 경우)
git config user.name "eonyeon" 2>/dev/null || true
git config user.email "your-email@example.com" 2>/dev/null || true

# 3. 모든 파일 추가
echo "➕ 파일 추가 중..."
git add .

# 4. 첫 커밋
echo "💾 첫 커밋 생성 중..."
git commit -m "feat: v11.1 - Enhanced Product Recognition with cross-platform build support"

# 5. main 브랜치 설정
echo "🌿 main 브랜치 설정 중..."
git branch -M main

# 6. 원격 저장소 추가
echo "🔗 GitHub 저장소 연결 중..."
git remote add origin https://github.com/eonyeon/image-search.git

# 7. 푸시
echo "🚀 GitHub에 푸시 중..."
git push -u origin main --force

echo ""
echo "✅ 완료!"
echo "📊 GitHub Actions 확인: https://github.com/eonyeon/image-search/actions"
echo "⏱️  빌드 예상 시간: 10-15분"
