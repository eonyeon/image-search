#!/bin/bash

# 🔧 v11.4 - 99.9% 유사도 버그 수정

echo "🔧 v11.4 - 99.9% 유사도 버그 수정"
echo "================================"

# 백업 생성
echo "💾 현재 버전 백업 중..."
cp src/main.js src/main_v11_3_backup.js

# v11.4 적용
echo "📝 v11.4 버그 수정 버전 적용..."
cp src/main_v11_4_fixed.js src/main.js

# Git에 추가
echo "➕ 변경사항 추가 중..."
git add src/main.js
git add src/main_v11_4_fixed.js

# 커밋
echo "💾 커밋 중..."
git commit -m "fix: 99.9% similarity bug - add L2 normalization and product grouping"

# 푸시
echo "🚀 GitHub에 푸시 중..."
git push origin main

echo ""
echo "✅ v11.4 패치 완료!"
echo ""
echo "🔧 수정 내용:"
echo "  • L2 정규화 적용 (특징 벡터)"
echo "  • 유사도 계산 수정 (0-1 범위)"
echo "  • 제품별 그룹화 복원"
echo "  • 새 DB 스토어 (강제 재인덱싱)"
echo ""
echo "⚠️  중요: 재인덱싱 필수!"
echo "  1. 앱 실행"
echo "  2. DB 초기화 클릭"
echo "  3. 폴더 다시 선택"
echo ""
echo "📦 새 빌드: 10-15분 후"
echo "🔍 빌드 상태: https://github.com/eonyeon/image-search/actions"
