# 🎯 빠른 시작 가이드 - Windows 버전 빌드

## 🚀 가장 빠른 방법 (3단계)

### 1️⃣ GitHub 저장소 만들기
1. https://github.com/new 접속
2. Repository name: **image-search-desktop**
3. **Create repository** 클릭

### 2️⃣ 터미널에서 실행
```bash
cd /Users/eon/Desktop/image-search-desktop

# 배포 스크립트 실행 권한
chmod +x deploy.sh

# 배포 실행
./deploy.sh
```

### 3️⃣ 빌드 확인 및 다운로드
- GitHub Actions 자동 실행 (10-15분)
- Actions 탭에서 진행상황 확인
- 완료 후 Artifacts에서 다운로드:
  - **windows-installer** → `.msi` 파일

---

## 📝 수동 방법

### Git 설정 및 푸시
```bash
# 1. Git 초기화
git init

# 2. 원격 저장소 연결
git remote add origin https://github.com/YOUR_USERNAME/image-search-desktop.git

# 3. 커밋
git add .
git commit -m "feat: v11.1 - Enhanced Product Recognition"

# 4. 푸시
git branch -M main
git push -u origin main
```

### GitHub Actions 확인
1. 저장소 페이지 → **Actions** 탭
2. **🚀 Cross-Platform Build** 워크플로우 실행 중
3. 완료 후 하단 Artifacts에서 다운로드

---

## ✅ 체크리스트

- [ ] GitHub 계정 있음
- [ ] 저장소 생성 (image-search-desktop)
- [ ] 코드 푸시 완료
- [ ] Actions 실행 확인
- [ ] Windows .msi 다운로드
- [ ] Windows에서 테스트

---

## 🔧 문제 해결

### "Permission denied" 에러
```bash
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
```

### 푸시 실패시
```bash
# GitHub Personal Access Token 사용
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/image-search-desktop.git
```

### 빌드 실패시
- Actions 탭에서 로그 확인
- 대부분 아이콘 생성 문제 → 자동 생성되므로 무시 가능

---

## 📦 빌드 결과물

| OS | 파일 | 크기 | 설치 방법 |
|----|------|------|----------|
| Windows | `.msi` | ~80MB | 더블클릭 → 설치 |
| macOS | `.dmg` | ~100MB | 드래그 → Applications |
| Linux | `.deb` | ~90MB | `sudo dpkg -i *.deb` |

---

## 🎉 성공!

빌드가 완료되면:
1. **Releases** 탭에 자동으로 릴리즈 생성
2. 버전: v1.0.2-build번호
3. 모든 OS용 설치 파일 포함

Windows 사용자들이 이제 앱을 사용할 수 있습니다! 🚀
