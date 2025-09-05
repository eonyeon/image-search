#!/bin/bash

# Fashion Search v14.0 배포 스크립트

echo "🚀 Fashion Search v14.0 - 최종 해결 버전 배포"
echo "============================================"

# 현재 버전 백업
echo "💾 현재 버전 백업 중..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp src/main.js src/main_backup_${TIMESTAMP}.js

# v14.0 적용
echo "📝 v14.0 적용..."
cp src/main_v14_0_final.js src/main.js

# Git에 추가
echo "➕ 변경사항 추가 중..."
git add -A

# 커밋
echo "💾 커밋 중..."
git commit -m "fix: v14.0 - Complete fix for 99.9% similarity bug using .data() method"

# 푸시
echo "🚀 GitHub에 푸시 중..."
git push origin main

echo ""
echo "✅ 배포 완료!"
echo ""
echo "📊 v14.0 핵심 수정사항:"
echo "  • .array() → .data() 메서드 변경 (핵심!)"
echo "  • Float32Array → Array.from() 완전 변환"
echo "  • 모델 무결성 테스트 추가"
echo "  • 실시간 벡터 검증"
echo ""
echo "⏰ 빌드 예상 시간: 10-15분"
echo ""
echo "📦 빌드 상태 확인:"
echo "https://github.com/eonyeon/image-search/actions"
echo ""
echo "⚠️ 중요: 새 버전 설치 후 반드시 DB 초기화 및 재인덱싱!"
