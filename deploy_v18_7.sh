#!/bin/bash

# Fashion Search v18.7 GitHub 배포 스크립트
# Fixed Normalization - 100% 문제 해결 및 색상 구분 강화
# 2025-01-03

echo "🚀 Fashion Search v18.7 Fixed Normalization GitHub 배포 시작"
echo "================================================"

# 1. 이전 버전 백업
echo "📦 이전 버전 백업 중..."
cp src/main.js src/backups/main_backup_$(date +%Y%m%d_%H%M%S).js

# 2. v18.7을 메인으로 적용
echo "✨ v18.7 Fixed Normalization을 main.js로 적용 중..."
cp src/main_v18_7_fixed_norm.js src/main.js

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
git commit -m "v18.7: Fixed Normalization - 100% 문제 해결

주요 버그 수정:
- 100% 유사도 문제 해결 (정규화 제거)
- 실제 코사인 유사도 그대로 표시
- 색상 보너스/페널티 시스템 추가

색상 구분 강화:
- 단순화된 색상 특징 (6개)
- RGB 평균값 + 검정/브라운/흰색 플래그
- 같은 색상 +10~15% 보너스
- 다른 색상 -10~15% 페널티

알고리즘:
- 형태(MobileNet): 60% 가중치
- 색상: 40% 가중치
- 총 1286 features (1280 + 6)

성능:
- 인덱싱: 76개 이미지 약 35초
- 검색: < 1초
- 유사도 범위: 실제값 (50-85% 정도)"

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
echo "⚠️ 주의: v18.7은 DB 재인덱싱이 필요합니다 (1286 features)"
