# 🏗️ 빌드 가이드

## 📋 사전 준비사항

### 모든 플랫폼 공통
- Node.js 18+ LTS
- npm 또는 yarn
- Git

### Windows
- Visual Studio 2022 Build Tools (C++ 워크로드)
- Windows 10 SDK

### macOS
- Xcode Command Line Tools
- macOS 10.13+

### Linux
- 필수 패키지:
  ```bash
  sudo apt update
  sudo apt install libgtk-3-dev libwebkit2gtk-4.0-dev \
    libayatana-appindicator3-dev librsvg2-dev
  ```

## 🚀 빠른 시작

### 1. 프로젝트 클론 및 설정
```bash
git clone https://github.com/yourusername/image-search-desktop.git
cd image-search-desktop
npm install
```

### 2. 아이콘 생성
```bash
# macOS/Linux
chmod +x create-icons.sh
./create-icons.sh

# Windows (PowerShell)
mkdir src-tauri/icons -Force
Invoke-WebRequest -Uri "https://via.placeholder.com/512x512/4A90E2/FFFFFF?text=Search" -OutFile "src-tauri/icons/icon.png"
npx tauri icon src-tauri/icons/icon.png
```

### 3. 개발 모드 실행
```bash
npm run tauri:dev
```

## 📦 프로덕션 빌드

### 자동 빌드 (권장)
```bash
npm run build:safe
```

### 수동 빌드
```bash
# 1. 프론트엔드 빌드
npm run build

# 2. Tauri 앱 빌드
npm run tauri:build
```

## 🎯 플랫폼별 빌드 결과

### Windows
- 위치: `src-tauri/target/release/bundle/msi/`
- 파일: `Image Search Desktop_1.0.0_x64_en-US.msi`
- 설치: MSI 파일 더블클릭

### macOS
- 위치: `src-tauri/target/release/bundle/dmg/`
- 파일: `Image Search Desktop_1.0.0_x64.dmg`
- 설치: DMG 열고 Applications 폴더로 드래그

### Linux
- DEB 패키지:
  - 위치: `src-tauri/target/release/bundle/deb/`
  - 설치: `sudo dpkg -i image-search-desktop_1.0.0_amd64.deb`
- AppImage:
  - 위치: `src-tauri/target/release/bundle/appimage/`
  - 실행: `chmod +x *.AppImage && ./image-search-desktop_1.0.0_amd64.AppImage`

## 🐛 문제 해결

### 아이콘 관련 오류
```
Error: failed to bundle project: Failed to create app icon
```

**해결 방법:**
```bash
# 아이콘 재생성
rm -rf src-tauri/icons
npm run icons:fix
```

### Windows 빌드 오류
```
error: Microsoft Visual C++ 14.0 or greater is required
```

**해결 방법:**
```powershell
# Visual Studio Build Tools 설치
winget install Microsoft.VisualStudio.2022.BuildTools
```

### Linux 빌드 오류
```
error: failed to run custom build command for `webkit2gtk-sys`
```

**해결 방법:**
```bash
# 필요한 개발 패키지 설치
sudo apt install libgtk-3-dev libwebkit2gtk-4.0-dev
```

### macOS 코드 서명 경고
개발 빌드에서는 코드 서명이 없어도 정상 작동합니다.
배포 시에는 Apple Developer 계정이 필요합니다.

## 🔧 고급 설정

### 커스텀 아이콘 사용
1. 512x512 PNG 이미지 준비
2. `src-tauri/icons/icon.png`로 저장
3. `npx tauri icon src-tauri/icons/icon.png` 실행

### 빌드 최적화
```bash
# 릴리즈 빌드 (최적화)
npm run tauri:build -- --release

# 디버그 정보 포함
npm run tauri:build -- --debug
```

### 크로스 컴파일
```bash
# Apple Silicon에서 Intel Mac용 빌드
npm run tauri:build -- --target x86_64-apple-darwin

# Intel Mac에서 Apple Silicon용 빌드
npm run tauri:build -- --target aarch64-apple-darwin
```

## 📊 빌드 크기 최적화

### 예상 크기
- Windows MSI: ~80-100 MB
- macOS DMG: ~90-110 MB
- Linux DEB: ~70-90 MB

### 크기 줄이기
1. 불필요한 의존성 제거
2. 프론트엔드 최적화 (`vite build`)
3. Rust 최적화 플래그 사용

## 🚢 배포

### GitHub Releases
1. 태그 생성: `git tag v1.0.0`
2. 푸시: `git push origin v1.0.0`
3. GitHub Actions가 자동으로 빌드 및 릴리즈 생성

### 수동 배포
1. 각 플랫폼에서 빌드
2. 인스톨러 파일 수집
3. GitHub Releases에 수동 업로드

## 📝 체크리스트

빌드 전 확인사항:
- [ ] 버전 번호 업데이트 (`package.json`, `Cargo.toml`, `tauri.conf.json`)
- [ ] 아이콘 파일 존재 확인
- [ ] 프론트엔드 빌드 테스트
- [ ] 개발 모드 정상 작동 확인
- [ ] 모든 변경사항 커밋

빌드 후 확인사항:
- [ ] 인스톨러 생성 확인
- [ ] 설치 테스트
- [ ] 앱 실행 테스트
- [ ] 주요 기능 작동 확인

---
## 🔧 최근 변경사항

### 1.0.1 (2025-08-31)
- 유사도 100% 버그 수정
- 브랜드 패턴 인식 알고리즘 개선
- 필터링 기능 추가
- 디버깅 로그 강화

### 1.0.2 (2025-09-01)
- 루이비통 검색 정확도 대폭 개선
- 브랜드 감지 임계값 최적화
- 색상 감지 범위 확대
- 브랜드 간 유사도 패널티 완화

**문서 버전**: 1.0.2  
**최종 업데이트**: 2025-09-01
