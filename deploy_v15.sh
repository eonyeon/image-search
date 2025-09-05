#!/bin/bash

# Fashion Search v15.0 - Embeddings Fix 배포 스크립트

echo "🚀 Fashion Search v15.0 - MobileNet Embeddings 문제 해결"
echo "========================================================="

# 현재 버전 백업
echo "💾 현재 버전 백업 중..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp src/main.js src/main_backup_${TIMESTAMP}.js

# v15.0 적용
echo "📝 v15.0 적용..."
cp src/main_v15_0_embeddings_fix.js src/main.js

# Git에 추가
echo "➕ 변경사항 추가 중..."
git add -A

# 커밋
echo "💾 커밋 중..."
git commit -m "critical-fix: v15.0 - MobileNet embeddings layer fix with CPU backend and alpha=0.75"

# 푸시
echo "🚀 GitHub에 푸시 중..."
git push origin main

echo ""
echo "✅ 배포 완료!"
echo ""
echo "🔬 v15.0 핵심 수정사항:"
echo "  • CPU 백엔드 우선 사용 (WebGL 캐싱 문제 회피)"
echo "  • Alpha=0.75 (더 안정적인 모델)"
echo "  • 정규화: -1~1 범위 (MobileNet v2 최적화)"
echo "  • 새 버퍼 생성으로 메모리 참조 차단"
echo "  • 심층 진단 도구 추가"
echo ""
echo "⚠️ 필수 작업:"
echo "  1. 완전 초기화 (빨간 버튼)"
echo "  2. 심층 모델 테스트"
echo "  3. 백엔드 전환 테스트"
echo "  4. 폴더 재인덱싱"
echo ""
echo "📊 예상 결과:"
echo "  • 0이 아닌 값: 1000+/1280 (이전: <100)"
echo "  • 고유 값: 500+ (이전: <100)"
echo "  • 유사도 범위: 30-85% (이전: 99.7-99.9%)"
echo ""
echo "⏰ 빌드 예상 시간: 10-15분"
echo ""
echo "📦 빌드 상태 확인:"
echo "https://github.com/eonyeon/image-search/actions"
