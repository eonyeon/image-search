#!/bin/bash

echo "🚀 Fashion Image Search v21 - Advanced AI Models 배포"
echo "================================================"

# 색상 코드
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 이전 버전 백업
echo -e "${YELLOW}📦 이전 버전 백업 중...${NC}"
timestamp=$(date +"%Y%m%d_%H%M%S")
if [ -f "src/main.js" ]; then
    cp src/main.js "src/backups/main_backup_${timestamp}.js"
    echo -e "${GREEN}✅ 백업 완료: src/backups/main_backup_${timestamp}.js${NC}"
fi

# 2. 캐시 클리어
echo -e "${YELLOW}🧹 캐시 클리어 중...${NC}"
rm -rf dist
rm -rf node_modules/.vite
rm -rf src-tauri/target
echo -e "${GREEN}✅ 캐시 클리어 완료${NC}"

# 3. 의존성 확인
echo -e "${YELLOW}📦 의존성 확인 중...${NC}"
if [ ! -d "node_modules" ]; then
    echo "node_modules가 없습니다. npm install 실행..."
    npm install
fi

# 4. Tauri 개발 서버 시작
echo -e "${GREEN}🎉 v21 Advanced AI Models 준비 완료!${NC}"
echo ""
echo "=== 주요 기능 ==="
echo "✅ MobileNet v2 + Multi-Scale 특징 추출"
echo "✅ Hybrid 모델 (Standard/Advanced/Hybrid 전환 가능)"
echo "✅ Tauri 파일 시스템 통합 (폴더 선택 지원)"
echo "✅ 고급 분석 대시보드"
echo "✅ DB 내보내기/가져오기"
echo "✅ 브랜드 자동 추론"
echo ""
echo "=== 실행 방법 ==="
echo "1. npm run tauri:dev"
echo "2. 앱이 열리면 Cmd+Shift+R (Mac) 또는 Ctrl+F5 (Windows)로 캐시 클리어"
echo "3. 인덱싱 모드에서 '폴더 선택 (Tauri)' 버튼으로 이미지 폴더 선택"
echo ""
echo -e "${YELLOW}🚀 개발 서버 시작 중...${NC}"

# 개발 서버 시작
npm run tauri:dev
