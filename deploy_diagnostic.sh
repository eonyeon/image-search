#!/bin/bash

# 🔍 v11.5 - 진단 버전 배포

echo "🔍 v11.5 - 100% 유사도 문제 진단 버전"
echo "====================================="

# 백업
echo "💾 백업 중..."
cp src/main.js src/main_v11_4_backup.js

# v11.5 적용
echo "📝 v11.5 진단 버전 적용..."
cp src/main_v11_5_diagnostic.js src/main.js

# Git 커밋 및 푸시
echo "🚀 GitHub 푸시..."
git add .
git commit -m "diagnostic: v11.5 - diagnose 100% similarity issue with detailed logging"
git push origin main

echo ""
echo "✅ v11.5 진단 버전 배포 완료!"
echo ""
echo "📋 사용법:"
echo "  1. 새 빌드 설치 (10-15분 후)"
echo "  2. F12 콘솔 열기"
echo "  3. DB 초기화 → 폴더 재인덱싱"
echo "  4. fashionApp.diagnose() 실행"
echo "  5. 결과 확인"
echo ""
echo "🔍 빌드: https://github.com/eonyeon/image-search/actions"
