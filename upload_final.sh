#!/bin/bash

# LUX IMAGE SEARCH GitHub 업로드 스크립트 (v4 Actions 업데이트)
# Repository: https://github.com/eonyeon/image-search

echo "🚀 LUX IMAGE SEARCH GitHub 업로드 (Actions v4 업데이트)"
echo "📦 Repository: https://github.com/eonyeon/image-search"
echo ""

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Git 초기화 확인
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}📝 Git 초기화...${NC}"
    git init
    echo -e "${GREEN}✅ Git 초기화 완료${NC}"
else
    echo -e "${GREEN}✅ Git 이미 초기화됨${NC}"
fi

# 2. 원격 저장소 설정
echo -e "\n${YELLOW}🔗 원격 저장소 설정 중...${NC}"

# 기존 origin 제거 (있을 경우)
git remote remove origin 2>/dev/null

# 새 origin 추가
git remote add origin https://github.com/eonyeon/image-search.git
echo -e "${GREEN}✅ 원격 저장소 연결: https://github.com/eonyeon/image-search${NC}"

# 3. 현재 상태 확인
echo -e "\n${YELLOW}📊 현재 상태 확인...${NC}"
git status --short

# 4. 파일 추가
echo -e "\n${YELLOW}📁 모든 파일 추가...${NC}"
git add .
echo -e "${GREEN}✅ 파일 추가 완료${NC}"

# 5. 커밋
echo -e "\n${YELLOW}💾 커밋 생성...${NC}"
COMMIT_MSG="fix: Update GitHub Actions to v4 (deprecated v3 fix)"
git commit -m "$COMMIT_MSG" || {
    echo -e "${YELLOW}⚠️  이미 커밋됨 또는 변경사항 없음${NC}"
}

# 6. 브랜치 설정
echo -e "\n${YELLOW}🌿 브랜치 설정...${NC}"
git branch -M main
echo -e "${GREEN}✅ main 브랜치 설정 완료${NC}"

# 7. 푸시
echo -e "\n${YELLOW}📤 GitHub에 푸시 중...${NC}"
echo -e "${YELLOW}인증이 필요할 수 있습니다...${NC}"

git push origin main

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}🎉 업로드 성공!${NC}"
    echo -e "${GREEN}📍 URL: https://github.com/eonyeon/image-search${NC}"
    
    echo -e "\n${GREEN}📋 수정된 내용:${NC}"
    echo "✅ actions/checkout@v3 → v4"
    echo "✅ actions/setup-node@v3 → v4" 
    echo "✅ actions/upload-artifact@v3 → v4"
    echo "✅ actions/create-release@v1 → softprops/action-gh-release@v1"
    
    echo -e "\n${GREEN}✨ 모든 작업 완료!${NC}"
    echo -e "${GREEN}GitHub Actions가 이제 정상 작동합니다.${NC}"
    echo -e "${GREEN}확인: https://github.com/eonyeon/image-search/actions${NC}"
else
    echo -e "\n${RED}❌ 푸시 실패${NC}"
    echo -e "${YELLOW}다음을 확인하세요:${NC}"
    echo "1. GitHub 계정 인증"
    echo "2. 저장소 권한"
    echo "3. 인터넷 연결"
fi
