#!/bin/bash

# Fashion Image Search v21.2 배포 스크립트
# 안정적인 Tauri API 통합 버전

echo "🚀 Fashion Image Search v21.2 배포 시작..."

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 캐시 클리어
echo -e "${YELLOW}📦 캐시 클리어 중...${NC}"
rm -rf dist node_modules/.vite

# 2. 의존성 확인
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 의존성 설치 중...${NC}"
    npm install
fi

# 3. Tauri 개발 서버 시작
echo -e "${GREEN}✅ v21.2 배포 준비 완료!${NC}"
echo -e "${YELLOW}🔄 Tauri 개발 서버 시작 중...${NC}"

# 앱 실행
npm run tauri:dev

echo -e "${GREEN}✅ 배포 완료!${NC}"
