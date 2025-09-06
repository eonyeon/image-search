#!/bin/bash

# Fashion Search v18.5 GitHub 배포 스크립트
# 2025-01-03

echo "🚀 Fashion Search v18.5 GitHub 배포 시작"
echo "================================================"

# 1. v18.5를 메인으로 적용
echo "📦 v18.5를 main.js로 적용 중..."
cp src/main_v18_5_pure_similarity.js src/main.js

# 2. Git 상태 확인
echo ""
echo "📊 Git 상태 확인..."
git status

# 3. 변경사항 추가
echo ""
echo "➕ 변경사항 스테이징..."
git add .

# 4. 커밋
echo ""
echo "💾 커밋 생성..."
git commit -m "v18.5: Pure Similarity - 브랜드 구분 제거, 순수 유사도 기반

주요 변경사항:
- 잘못된 브랜드 분류 로직 완전 제거
- 순수한 시각적 유사도만 사용 (MobileNet v2)
- 유사도 점수 정규화 (50-100% 범위)
- UI/UX 개선: 진행바, 순위별 색상
- 유사도 분석 도구 추가
- WebGL 가속 최적화

버그 수정:
- NaN% 문제 완전 해결
- 임베딩 저장/불러오기 정상화
- 2차원 배열 처리 수정

성능:
- 인덱싱: 76개 이미지 약 30초
- 검색: < 1초
- 정확도: MobileNet v2 기반 시각적 유사도"

# 5. GitHub에 푸시
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
echo "2. Releases 페이지에서 다운로드 가능"
echo "3. 문제 발생 시 PROJECT_STATUS_V18_5.md 참조"
