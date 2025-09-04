#!/bin/bash

# 🚀 GitHub 배포 스크립트
# Image Search Desktop v11.1

echo "🚀 Image Search Desktop - GitHub 배포 시작"
echo "========================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Git 상태 확인
echo -e "${YELLOW}📋 Git 상태 확인 중...${NC}"
git status

# 2. 변경사항이 있는지 확인
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}📝 커밋할 변경사항이 있습니다.${NC}"
    
    # 3. 모든 변경사항 추가
    echo -e "${GREEN}➕ 변경사항 추가 중...${NC}"
    git add .
    
    # 4. 커밋 메시지 입력
    echo -e "${YELLOW}💬 커밋 메시지를 입력하세요:${NC}"
    read -r commit_message
    
    if [ -z "$commit_message" ]; then
        commit_message="chore: update $(date +%Y-%m-%d)"
    fi
    
    # 5. 커밋
    git commit -m "$commit_message"
    echo -e "${GREEN}✅ 커밋 완료!${NC}"
else
    echo -e "${GREEN}✨ 커밋할 변경사항이 없습니다.${NC}"
fi

# 6. 원격 저장소 확인
echo -e "${YELLOW}🔍 원격 저장소 확인 중...${NC}"
if ! git remote | grep -q "origin"; then
    echo -e "${RED}❌ 원격 저장소가 설정되지 않았습니다!${NC}"
    echo -e "${YELLOW}GitHub 저장소 URL을 입력하세요:${NC}"
    echo -e "${YELLOW}예: https://github.com/username/image-search-desktop.git${NC}"
    read -r repo_url
    
    if [ -n "$repo_url" ]; then
        git remote add origin "$repo_url"
        echo -e "${GREEN}✅ 원격 저장소 추가 완료!${NC}"
    else
        echo -e "${RED}❌ URL이 입력되지 않았습니다. 종료합니다.${NC}"
        exit 1
    fi
fi

# 7. 브랜치 확인
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "main" ]; then
    echo -e "${YELLOW}🔀 현재 브랜치: $current_branch${NC}"
    echo -e "${YELLOW}main 브랜치로 전환하시겠습니까? (y/n)${NC}"
    read -r switch_branch
    
    if [ "$switch_branch" = "y" ]; then
        git checkout main 2>/dev/null || git checkout -b main
        echo -e "${GREEN}✅ main 브랜치로 전환!${NC}"
    fi
fi

# 8. Push
echo -e "${YELLOW}🚀 GitHub에 푸시 중...${NC}"
git push -u origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 푸시 성공!${NC}"
    echo ""
    echo -e "${GREEN}🎉 GitHub Actions가 자동으로 시작됩니다!${NC}"
    echo -e "${YELLOW}📦 빌드 상태 확인:${NC}"
    echo -e "   https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
    echo ""
    echo -e "${YELLOW}⏱️  예상 빌드 시간:${NC}"
    echo -e "   • Windows: 10-15분"
    echo -e "   • macOS: 10-15분"
    echo -e "   • Linux: 5-10분"
    echo ""
    echo -e "${GREEN}✨ 빌드 완료 후 Releases 탭에서 다운로드할 수 있습니다!${NC}"
else
    echo -e "${RED}❌ 푸시 실패!${NC}"
    echo -e "${YELLOW}다음을 확인해주세요:${NC}"
    echo -e "   1. GitHub 저장소가 생성되었는지"
    echo -e "   2. 인터넷 연결 상태"
    echo -e "   3. GitHub 인증 정보"
    exit 1
fi
