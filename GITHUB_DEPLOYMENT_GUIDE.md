# 🚀 GitHub 배포 가이드

## 📋 사전 준비

### 1. Git 초기화 (이미 되어있다면 스킵)
```bash
git init
git add .
git commit -m "Initial commit: LUX IMAGE SEARCH v21.4"
```

### 2. GitHub 저장소 생성
1. GitHub.com에서 새 저장소 생성
2. Repository name: `lux-image-search`
3. Public 선택 (GitHub Pages 사용 시)

### 3. 저장소 연결
```bash
git remote add origin https://github.com/YOUR_USERNAME/lux-image-search.git
git branch -M main
git push -u origin main
```

## 🎯 GitHub Actions 설정

### 자동으로 설정됨
`.github/workflows/` 폴더에 이미 설정 파일이 있습니다:
- `build.yml` - 빌드 및 릴리즈
- `test.yml` - 테스트 및 검증

### Actions 활성화
1. GitHub 저장소 → Settings → Actions
2. "Allow all actions" 선택
3. Save

## 📦 릴리즈 만들기

### 자동 릴리즈 (추천)
```bash
# 버전 태그 생성
git tag v21.4.0
git push origin v21.4.0
```
→ GitHub Actions가 자동으로 빌드 및 릴리즈 생성

### 수동 릴리즈
1. GitHub 저장소 → Releases → Draft a new release
2. Tag version: `v21.4.0`
3. Release title: `LUX IMAGE SEARCH v21.4`
4. 설명 작성 후 Publish

## 🌐 GitHub Pages 배포

### 1. Pages 활성화
1. Settings → Pages
2. Source: Deploy from a branch
3. Branch: `gh-pages` / `root`
4. Save

### 2. 자동 배포
main 브랜치에 push하면 자동으로:
- 웹 버전 빌드
- GitHub Pages 배포
- URL: `https://YOUR_USERNAME.github.io/lux-image-search/`

## 📝 커밋 메시지 규칙

```bash
# 기능 추가
git commit -m "feat: Add image filter feature"

# 버그 수정
git commit -m "fix: Resolve folder selection issue"

# 문서 업데이트
git commit -m "docs: Update README"

# 스타일 변경
git commit -m "style: Change app title to LUX IMAGE SEARCH"

# 성능 개선
git commit -m "perf: Increase search results to 30"
```

## 🔄 업데이트 워크플로우

### 1. 개발
```bash
# 새 브랜치 생성
git checkout -b feature/new-feature

# 작업 후 커밋
git add .
git commit -m "feat: Add new feature"

# 푸시
git push origin feature/new-feature
```

### 2. Pull Request
1. GitHub에서 Pull Request 생성
2. 자동 테스트 통과 확인
3. Merge to main

### 3. 릴리즈
```bash
# main 브랜치로 이동
git checkout main
git pull origin main

# 태그 생성
git tag v21.5.0
git push origin v21.5.0
```

## 🐛 트러블슈팅

### Actions 실패 시
1. Actions 탭 → 실패한 워크플로우 클릭
2. 에러 로그 확인
3. 수정 후 재실행

### 일반적인 문제
- **Permission denied**: Settings → Actions → Workflow permissions → Read and write
- **Build failed**: package.json의 build 스크립트 확인
- **Tauri build failed**: Rust 및 시스템 의존성 확인

## 📊 상태 배지 추가

README.md에 추가:
```markdown
[![Build Status](https://github.com/YOUR_USERNAME/lux-image-search/workflows/Build%20and%20Release/badge.svg)](https://github.com/YOUR_USERNAME/lux-image-search/actions)
[![Test Status](https://github.com/YOUR_USERNAME/lux-image-search/workflows/Test%20and%20Lint/badge.svg)](https://github.com/YOUR_USERNAME/lux-image-search/actions)
```

## ✅ 체크리스트

- [ ] Git 초기화
- [ ] GitHub 저장소 생성
- [ ] 저장소 연결
- [ ] 첫 커밋 및 푸시
- [ ] GitHub Actions 확인
- [ ] 테스트 워크플로우 성공
- [ ] GitHub Pages 활성화
- [ ] 첫 릴리즈 생성

---
**작성일**: 2025-01-07  
**버전**: v21.4
