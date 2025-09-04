# 🔍 Image Search Desktop

<div align="center">
  
![Version](https://img.shields.io/badge/version-11.5.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)
![Build Status](https://img.shields.io/badge/build-fixing-yellow.svg)

**AI 기반 이미지 유사도 검색 데스크톱 애플리케이션**

[다운로드](#-다운로드) • [설치](#-설치) • [사용법](#-사용법) • [문제해결](#-문제해결)

</div>

## ✨ 주요 기능

- 🤖 **딥러닝 기반**: MobileNet v2 모델 사용
- ⚡ **GPU 가속**: WebGL 활용 고속 처리
- 💾 **로컬 처리**: 인터넷 연결 불필요 (첫 실행 제외)
- 🎯 **높은 정확도**: 70-85% 유사도 검색
- 📁 **대량 처리**: 수천 개 이미지 인덱싱 가능

## 🚨 현재 상태 (2025.01.03)

### ⚠️ v11.5 진단 버전
- **문제**: 일부 버전에서 99.9% 유사도 버그 발생
- **해결 중**: 진단 도구 포함된 v11.5 배포 준비 중
- **임시 해결**: DB 초기화 후 재인덱싱

## 📥 다운로드

> 🔧 **빌드 수정 중** - 곧 새 버전이 릴리즈됩니다

최신 버전: [GitHub Releases](https://github.com/eonyeon/image-search/releases)

| 플랫폼 | 파일 | 요구사항 |
|--------|------|----------|
| Windows | `.msi` | Windows 10/11 |
| macOS | `.dmg` | macOS 11+ |
| Linux | `.deb` / `.AppImage` | Ubuntu 20.04+ |

## 🛠️ 설치

### Windows
1. `.msi` 파일 다운로드
2. 더블클릭하여 설치
3. Windows Defender 경고 시 "추가 정보" → "실행"

### macOS
1. `.dmg` 파일 다운로드
2. 열어서 Applications 폴더로 드래그
3. 첫 실행 시: 우클릭 → "열기"

### Linux
```bash
# Debian/Ubuntu
sudo dpkg -i image-search-desktop_*.deb

# AppImage
chmod +x Image-Search-Desktop-*.AppImage
./Image-Search-Desktop-*.AppImage
```

## 📖 사용법

### 1️⃣ 이미지 인덱싱
1. **인덱싱 모드** 선택
2. **폴더 선택** 버튼 클릭
3. 이미지 폴더 선택 (jpg, png, gif, webp 지원)
4. 인덱싱 완료 대기

### 2️⃣ 유사 이미지 검색
1. **검색 모드** 선택
2. 이미지 업로드 (드래그 앤 드롭 가능)
3. **유사 이미지 검색** 버튼 클릭
4. 결과 확인 (유사도 % 표시)

## 🔍 진단 도구 (v11.5)

### 개발자 도구 열기
- `Ctrl + Shift + I` (Windows/Linux)
- `Cmd + Option + I` (macOS)
- 또는 우클릭 → "검사"

### 진단 콘솔 사용
1. 인덱싱 모드 → **"진단 콘솔"** 버튼
2. 각 진단 버튼 클릭
3. 99.9% 버그 확인

### 콘솔 명령어
```javascript
fashionApp.version()        // 버전 확인
fashionApp.diagnose()       // 시스템 진단
fashionApp.showDiagnostics() // 팝업 진단
fashionApp.clearDB()        // DB 초기화
```

## 🐛 문제해결

### 99.9% 유사도 문제
1. DB 초기화: 인덱싱 모드 → "DB 초기화"
2. 폴더 재인덱싱
3. 여전히 문제 시 진단 콘솔 사용

### 모델 로드 실패
- 인터넷 연결 확인 (첫 실행 시 필요)
- 방화벽/안티바이러스 확인
- Chrome 최신 버전 확인

### Windows Defender 경고
- 정상입니다 (코드 서명 없음)
- "추가 정보" → "실행" 클릭

## 🛠️ 기술 스택

- **Framework**: Tauri 1.6 + Vite
- **AI Model**: TensorFlow.js + MobileNet v2
- **Storage**: LocalForage
- **Language**: JavaScript/Rust
- **UI**: HTML5 + CSS3

## 📊 성능

| 항목 | 사양 |
|------|------|
| 정확도 | 70-85% |
| 처리 속도 | ~100ms/이미지 (GPU) |
| 메모리 사용 | ~200MB |
| 모델 크기 | 16MB |
| 최대 이미지 | 10,000+ |

## 📝 버전 히스토리

### v11.5.0 (2025.01.03) - 진단 버전
- 🔍 진단 콘솔 추가
- 🐛 100% 유사도 버그 수정 중
- 🔧 개발자 도구 활성화

### v11.1.0 (2025.01.02)
- 📦 제품 그룹화 기능
- 🎯 85% 정확도 달성
- 💾 모델 캐싱

### v10.3.0 (2025.01.02)
- ✅ 첫 안정 버전
- 🤖 MobileNet v2 통합
- ⚡ WebGL 가속

## 👥 기여

버그 리포트 및 제안: [Issues](https://github.com/eonyeon/image-search/issues)

## 📄 라이센스

MIT License - 자유롭게 사용 가능

---

<div align="center">
  
**Made with ❤️ by @eonyeon**

[⬆ 맨 위로](#-image-search-desktop)

</div>
