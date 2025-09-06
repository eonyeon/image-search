# GitHub 배포 명령어 가이드

## 🚀 빠른 배포 (자동 스크립트)
```bash
# 실행 권한 부여
chmod +x deploy_to_github.sh

# 배포 실행
./deploy_to_github.sh
```

## 📝 수동 배포 (단계별)
```bash
# 1. v18.5를 main.js로 적용
cp src/main_v18_5_pure_similarity.js src/main.js

# 2. 변경사항 확인
git status

# 3. 모든 파일 스테이징
git add .

# 4. 커밋
git commit -m "v18.5: Pure Similarity 버전 배포"

# 5. GitHub에 푸시
git push origin main
```

## 🔧 문제 해결
```bash
# git 설정 확인
git config --list

# 원격 저장소 확인
git remote -v

# 강제 푸시 (주의!)
git push -f origin main

# 충돌 해결
git pull origin main
git merge
git push origin main
```

## 📊 배포 후 확인
1. https://github.com/eonyeon/image-search 접속
2. Actions 탭에서 빌드 상태 확인
3. Releases 페이지에서 다운로드 링크 확인

## ⚠️ 주의사항
- main.js가 최신 버전인지 확인
- package.json 버전 업데이트 고려
- 민감한 정보(API 키 등) 포함 여부 확인
