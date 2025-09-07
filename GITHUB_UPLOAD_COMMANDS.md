# 📤 GitHub 업로드 가이드
**Repository**: https://github.com/eonyeon/image-search

## 🚀 자동 업로드 (추천)

### 1. 실행 권한 부여
```bash
chmod +x upload_to_github.sh
```

### 2. 스크립트 실행
```bash
./upload_to_github.sh
```

스크립트가 자동으로:
- Git 초기화
- 원격 저장소 연결
- 모든 파일 추가 및 커밋
- GitHub 푸시
- 태그 생성 (선택사항)

---

## 📝 수동 업로드

### 단계별 명령어

#### 1. Git 초기화 (처음만)
```bash
git init
```

#### 2. 원격 저장소 연결
```bash
# 기존 origin 제거 (있을 경우)
git remote remove origin

# 새로 연결
git remote add origin https://github.com/eonyeon/image-search.git
```

#### 3. 파일 추가 및 커밋
```bash
# 모든 파일 추가
git add .

# 커밋
git commit -m "feat: LUX IMAGE SEARCH v21.4 - AI-powered image search with 30 results"
```

#### 4. 브랜치 설정 및 푸시
```bash
# main 브랜치로 설정
git branch -M main

# GitHub에 푸시 (처음)
git push -u origin main --force
```

#### 5. 태그 생성 (선택사항)
```bash
# 버전 태그 생성
git tag -a v21.4.0 -m "Release v21.4.0 - LUX IMAGE SEARCH"

# 태그 푸시
git push origin v21.4.0
```

---

## 🔄 업데이트 시

### 변경사항이 있을 때
```bash
# 변경사항 추가
git add .

# 커밋
git commit -m "update: 변경 내용 설명"

# 푸시
git push
```

---

## 🐛 문제 해결

### 인증 오류 발생 시

#### 방법 1: Personal Access Token 사용
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. repo 권한 체크
4. 토큰 복사

```bash
# 토큰으로 푸시
git push https://YOUR_TOKEN@github.com/eonyeon/image-search.git main
```

#### 방법 2: SSH 키 사용
```bash
# SSH 키 생성
ssh-keygen -t ed25519 -C "your_email@example.com"

# 공개키 복사
cat ~/.ssh/id_ed25519.pub

# GitHub → Settings → SSH keys에 추가

# origin을 SSH로 변경
git remote set-url origin git@github.com:eonyeon/image-search.git
```

### 충돌 발생 시
```bash
# 강제 푸시 (주의: 원격 저장소 덮어씀)
git push --force

# 또는 원격 변경사항 먼저 가져오기
git pull origin main --rebase
git push
```

---

## ✅ 체크리스트

- [ ] upload_to_github.sh 실행 권한 부여
- [ ] GitHub 계정 로그인 확인
- [ ] 저장소 생성 확인 (https://github.com/eonyeon/image-search)
- [ ] 첫 푸시 성공
- [ ] GitHub에서 파일 확인

---

## 🎉 성공 확인

업로드 성공 후:
1. https://github.com/eonyeon/image-search 접속
2. 파일 목록 확인
3. README.md 확인
4. Actions 탭에서 워크플로우 확인

---

**작성일**: 2025-01-07  
**저장소**: https://github.com/eonyeon/image-search
