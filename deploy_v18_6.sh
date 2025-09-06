#!/bin/bash

# Fashion Search v18.6 GitHub 배포 스크립트
# Color Enhanced 버전
# 2025-01-03

echo "🚀 Fashion Search v18.6 Color Enhanced GitHub 배포 시작"
echo "================================================"

# 1. v18.5 백업
echo "📦 v18.5 백업 중..."
cp src/main.js src/backups/main_v18_5_backup_$(date +%Y%m%d_%H%M%S).js

# 2. v18.6을 메인으로 적용
echo "✨ v18.6 Color Enhanced를 main.js로 적용 중..."
cp src/main_v18_6_color_enhanced.js src/main.js

# 3. Git 상태 확인
echo ""
echo "📊 Git 상태 확인..."
git status

# 4. 변경사항 추가
echo ""
echo "➕ 변경사항 스테이징..."
git add .

# 5. 커밋
echo ""
echo "💾 커밋 생성..."
git commit -m "v18.6: Color Enhanced - 색상 특징 강화

주요 변경사항:
- RGB/HSV 색상 분석 추가 (68개 특징)
- MobileNet(70%) + 색상(30%) 가중 평균
- 검정/브라운/베이지/네이비 색상 감지
- Shannon entropy 기반 색상 다양성 계산
- 총 1348개 특징 벡터 (1280 + 68)

개선 효과:
- 셀린/프라다 등 브라운/베이지 계열 구분 향상
- 검정 가방끼리 그룹핑 유지
- 색상 유사도 30% 반영으로 정확도 개선

성능:
- 인덱싱: 76개 이미지 약 35-40초 (색상 분석 추가)
- 검색: < 1초
- DB 크기: 이미지당 약 105KB"

# 6. GitHub에 푸시
echo ""
echo "📤 GitHub에 푸시 중..."
git push origin main

echo ""
echo "✅ 배포 완료!"
echo ""
echo "🔗 GitHub 저장소: https://github.com/eonyeon/image-search"
echo ""
echo "📋 다음 단계:"
echo "1. GitHub Actions에서 빌드 상태 확인"
echo "   https://github.com/eonyeon/image-search/actions"
echo "2. 빌드 완료 후 Releases 페이지에서 다운로드"
echo "   https://github.com/eonyeon/image-search/releases"
echo ""
echo "⚠️ 주의: v18.6은 DB 재인덱싱이 필요합니다 (색상 특징 추가)"
