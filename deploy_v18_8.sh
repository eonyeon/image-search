#!/bin/bash

# Fashion Search v18.8 GitHub 배포 스크립트
# Pattern Focus - 패턴 인식 강화 및 배경 영향 최소화
# 2025-01-03

echo "🚀 Fashion Search v18.8 Pattern Focus GitHub 배포 시작"
echo "================================================"

# 1. 이전 버전 백업
echo "📦 이전 버전 백업 중..."
mkdir -p src/backups
cp src/main.js "src/backups/main_backup_$(date +%Y%m%d_%H%M%S).js"

# 2. v18.8을 메인으로 적용
echo "✨ v18.8 Pattern Focus를 main.js로 적용 중..."
cp src/main_v18_8_pattern_focus.js src/main.js

# 3. Git 상태 확인
echo ""
echo "📊 Git 상태 확인..."
git status --short

# 4. 변경사항 추가
echo ""
echo "➕ 변경사항 스테이징..."
git add .

# 5. 커밋
echo ""
echo "💾 커밋 생성..."
git commit -m "v18.8: Pattern Focus - 패턴 인식 강화 및 배경 영향 최소화

🎯 핵심 개선:
- 중앙 크롭으로 배경 영향 최소화
- 패턴 특징 추출 (엣지, 밀도, 방향성)
- HSV 색상 히스토그램 (20 features)
- 동적 가중치 시스템

📊 특징 추출:
- MobileNet: 1280 features (중앙 크롭)
- 패턴 분석: 6 features
- 색상 히스토그램: 20 features
- 총 1306 features

🔧 알고리즘:
- 패턴 있는 제품: 형태 40%, 패턴 35%, 색상 25%
- 패턴 없는 제품: 형태 50%, 색상 30%, 패턴 20%
- 패턴 유사도 > 0.8시 10% 보너스

📈 성능:
- 인덱싱: 76개 이미지 약 40초
- 검색: < 1초
- 패턴 매치 정확도 향상

⚠️ 주의: DB 재인덱싱 필요 (1306 features)"

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
echo "⚠️ 사용자 주의사항:"
echo "- 완전 초기화 필수 (DB v18_8)"
echo "- 전체 재인덱싱 필요 (1306 features)"
echo "- 패턴 분석 기능 추가로 인덱싱 시간 증가"