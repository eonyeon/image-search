#!/bin/bash

# Fashion Search v18.3 배포 스크립트
# 임베딩 문제 해결 버전

echo "🚀 Fashion Search v18.3 - Embedding Fix 배포 시작"

# 백업 생성
echo "📦 기존 버전 백업 중..."
cp src/main.js "src/backups/main_backup_$(date +%Y%m%d_%H%M%S).js"

# v18.3 적용
echo "✨ v18.3 적용 중..."
cp src/main_v18_3_embedding_fix.js src/main.js

echo "✅ 배포 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. 서버 재시작: npm run tauri:dev"
echo "2. 브라우저에서 http://localhost:5173 접속"
echo "3. 설정 → 완전 초기화 (새 DB 버전 사용)"
echo "4. 인덱싱 모드 → 이미지 파일 선택"
echo "5. 검색 모드에서 테스트"
echo ""
echo "⚠️ 중요: DB 버전이 변경되어 완전 초기화가 필요합니다!"
