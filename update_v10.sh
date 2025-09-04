#!/bin/bash

# Fashion Search v10.0 업데이트 스크립트
echo "========================================="
echo "Fashion Search v10.0 업데이트 시작"
echo "========================================="

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 백업 디렉토리 생성
echo -e "${YELLOW}1. 백업 디렉토리 확인...${NC}"
if [ ! -d "backups" ]; then
    mkdir -p backups
    echo -e "${GREEN}✓ backups 디렉토리 생성됨${NC}"
else
    echo -e "${GREEN}✓ backups 디렉토리 존재${NC}"
fi

# 2. 기존 main.js 백업
echo -e "${YELLOW}2. 기존 버전 백업...${NC}"
if [ -f "src/main.js" ]; then
    BACKUP_FILE="backups/main_v9_backup_$(date +%Y%m%d_%H%M%S).js"
    cp src/main.js "$BACKUP_FILE"
    echo -e "${GREEN}✓ 백업 완료: $BACKUP_FILE${NC}"
else
    echo -e "${RED}⚠ src/main.js 파일이 없습니다${NC}"
fi

# 3. 의존성 확인 및 설치
echo -e "${YELLOW}3. 의존성 확인...${NC}"

# TensorFlow.js 확인
if npm list @tensorflow/tfjs 2>/dev/null | grep -q "@tensorflow/tfjs"; then
    echo -e "${GREEN}✓ @tensorflow/tfjs 설치됨${NC}"
else
    echo -e "${YELLOW}  @tensorflow/tfjs 설치 중...${NC}"
    npm install @tensorflow/tfjs
fi

# MobileNet 모델 확인
if npm list @tensorflow-models/mobilenet 2>/dev/null | grep -q "@tensorflow-models/mobilenet"; then
    echo -e "${GREEN}✓ @tensorflow-models/mobilenet 설치됨${NC}"
else
    echo -e "${YELLOW}  @tensorflow-models/mobilenet 설치 중...${NC}"
    npm install @tensorflow-models/mobilenet
fi

# LocalForage 확인
if npm list localforage 2>/dev/null | grep -q "localforage"; then
    echo -e "${GREEN}✓ localforage 설치됨${NC}"
else
    echo -e "${YELLOW}  localforage 설치 중...${NC}"
    npm install localforage
fi

# 4. 앱 실행
echo -e "${YELLOW}4. 앱을 시작하시겠습니까? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}앱을 시작합니다...${NC}"
    echo ""
    echo -e "${YELLOW}=========================================${NC}"
    echo -e "${YELLOW}중요: 앱 실행 후 다음 작업을 수행하세요:${NC}"
    echo -e "${YELLOW}1. 설정 > 데이터베이스 초기화 클릭${NC}"
    echo -e "${YELLOW}2. 폴더 재인덱싱${NC}"
    echo -e "${YELLOW}=========================================${NC}"
    echo ""
    npm run tauri:dev
else
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}업데이트 완료!${NC}"
    echo ""
    echo -e "${YELLOW}앱을 실행하려면:${NC}"
    echo "  npm run tauri:dev"
    echo ""
    echo -e "${YELLOW}실행 후 반드시:${NC}"
    echo "  1. 데이터베이스 초기화"
    echo "  2. 이미지 재인덱싱"
    echo -e "${GREEN}=========================================${NC}"
fi
