# 🚀 GitHub Actions로 Windows 버전 빌드하기

## 📋 현재 상태
✅ GitHub Actions workflow 설정 완료 (`.github/workflows/build.yml`)
✅ Tauri 설정 완료 (`tauri.conf.json`)
✅ Cross-platform 빌드 준비 완료

## 🔧 1단계: Git 저장소 초기화 및 커밋

### 1-1. Git 초기화 (이미 되어있다면 스킵)
```bash
cd /Users/eon/Desktop/image-search-desktop
git init
```

### 1-2. GitHub 저장소와 연결
```bash
# GitHub에서 새 저장소 만들기:
# 1. https://github.com/new 접속
# 2. Repository name: image-search-desktop
# 3. Public 또는 Private 선택
# 4. Create repository 클릭

# 로컬과 연결
git remote add origin https://github.com/YOUR_USERNAME/image-search-desktop.git
```

### 1-3. 현재 변경사항 커밋
```bash
# 모든 파일 추가
git add .

# 커밋
git commit -m "feat: v11.1 - Enhanced Product Recognition with cross-platform build"

# main 브랜치로 설정
git branch -M main
```

## 🚀 2단계: GitHub에 푸시

```bash
# GitHub에 푸시
git push -u origin main
```

## ⚙️ 3단계: GitHub Actions 실행

### 자동 실행
- `main` 브랜치에 푸시하면 자동으로 빌드 시작됨

### 수동 실행
1. GitHub 저장소 페이지로 이동
2. **Actions** 탭 클릭
3. **🚀 Cross-Platform Build** 워크플로우 선택
4. **Run workflow** 버튼 클릭

## 📦 4단계: 빌드 결과 확인

### 빌드 진행 상황 확인
1. **Actions** 탭에서 실행 중인 워크플로우 클릭
2. 각 OS별 빌드 상태 확인:
   - ✅ build-windows (Windows .msi 생성)
   - ✅ build-macos (macOS .dmg 생성)
   - ✅ build-linux (Linux .deb/.AppImage 생성)

### 예상 소요 시간
- Windows: 약 10-15분
- macOS: 약 10-15분
- Linux: 약 5-10분

## 💾 5단계: 다운로드

### Option 1: Artifacts에서 다운로드
1. **Actions** 탭 → 완료된 워크플로우 클릭
2. 페이지 하단 **Artifacts** 섹션
3. 원하는 파일 다운로드:
   - `windows-installer` → .msi 파일
   - `macos-dmg` → .dmg 파일
   - `linux-packages` → .deb/.AppImage 파일

### Option 2: Releases에서 다운로드
- main 브랜치 푸시시 자동으로 Release 생성됨
- **Releases** 탭에서 최신 릴리즈 다운로드

## 🖥️ Windows 설치 및 실행

### Windows에서 설치
1. `.msi` 파일 다운로드
2. 더블클릭하여 설치
3. 설치 완료 후 시작 메뉴에서 "Image Search Desktop" 실행

### 주의사항
- Windows Defender가 경고할 수 있음 → "추가 정보" → "실행"
- 코드 서명이 없어서 나타나는 정상적인 경고

## 🔐 코드 서명 (선택사항)

### Windows 코드 서명
```yaml
# GitHub Secrets에 추가 필요:
# - WINDOWS_CERTIFICATE (Base64 encoded .pfx)
# - WINDOWS_CERTIFICATE_PASSWORD

- name: 🔐 Sign Windows Executable
  run: |
    # SignTool을 사용한 서명
    signtool sign /f certificate.pfx /p ${{ secrets.WINDOWS_CERTIFICATE_PASSWORD }} /t http://timestamp.digicert.com *.exe
```

### macOS 코드 서명
```yaml
# GitHub Secrets에 추가 필요:
# - APPLE_CERTIFICATE (Base64 encoded .p12)
# - APPLE_CERTIFICATE_PASSWORD
# - APPLE_ID
# - APPLE_PASSWORD

- name: 🔐 Sign macOS App
  run: |
    # Keychain 설정 및 서명
    security create-keychain -p temp temp.keychain
    security import certificate.p12 -k temp.keychain -P ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
    codesign --deep --force --verify --verbose --sign "Developer ID Application" *.app
```

## 📊 빌드 매트릭스

| OS | Runner | 파일 형식 | 크기 (예상) |
|----|--------|----------|------------|
| Windows 10/11 | windows-latest | .msi | ~80MB |
| macOS 11+ | macos-latest | .dmg | ~100MB |
| Ubuntu 20.04+ | ubuntu-latest | .deb/.AppImage | ~90MB |

## 🐛 트러블슈팅

### 빌드 실패시
1. **Actions** 탭에서 에러 로그 확인
2. 주요 체크포인트:
   - ✅ Node.js 버전 (18 이상)
   - ✅ Rust 설치
   - ✅ 의존성 설치 (`npm ci`)
   - ✅ 아이콘 생성

### 일반적인 문제
```bash
# 로컬에서 빌드 테스트
npm run tauri:build

# 아이콘 문제시
npx tauri icon src-tauri/icons/icon.png

# 의존성 문제시
npm ci
cd src-tauri && cargo clean && cargo build
```

## 🎯 최종 체크리스트

- [ ] GitHub 저장소 생성
- [ ] 코드 커밋 및 푸시
- [ ] Actions 실행 확인
- [ ] Windows 빌드 성공
- [ ] .msi 파일 다운로드
- [ ] Windows에서 테스트

## 📝 버전 업데이트

버전을 변경하려면:
1. `package.json`의 `version` 수정
2. `src-tauri/tauri.conf.json`의 `package.version` 수정
3. `.github/workflows/build.yml`의 `APP_VERSION` 수정

## 🔗 유용한 링크

- [Tauri 공식 문서](https://tauri.app/v1/guides/building/)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Tauri GitHub Action](https://github.com/tauri-apps/tauri-action)

---

**작성일**: 2025-01-03  
**프로젝트**: Image Search Desktop v11.1
