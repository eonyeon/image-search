# 🔧 GitHub Actions 오류 수정 가이드

## ❌ 발생한 오류들

### 1. macOS 빌드 오류
```
error: component 'rust-std' for target 'universal-apple-darwin' is unavailable
```
**원인**: `universal-apple-darwin` 타겟이 Rust stable에서 지원되지 않음

### 2. Windows 빌드 오류
```
Error: Resource not accessible by integration
```
**원인**: GitHub Actions가 자동으로 릴리즈를 생성할 권한이 없음

## ✅ 해결 방법

### 수정된 워크플로우 파일

#### 1. `.github/workflows/build.yml`
- **macOS**: universal 타겟을 x86_64와 aarch64로 분리
- **릴리즈**: 자동 생성 제거, artifacts만 업로드
- **권한**: 릴리즈 생성 부분 제거

#### 2. `.github/workflows/release.yml` (새로 추가)
- 수동으로 릴리즈 생성 가능
- Actions 탭에서 수동 실행

## 📤 GitHub 업로드 명령어

### 방법 1: 자동 스크립트 (추천)
```bash
# 실행 권한 부여
chmod +x upload_github_fixed.sh

# 실행
./upload_github_fixed.sh
```

### 방법 2: 수동 명령어
```bash
# 1. Git 초기화 (처음만)
git init

# 2. 원격 저장소 연결
git remote remove origin
git remote add origin https://github.com/eonyeon/image-search.git

# 3. 파일 추가 및 커밋
git add .
git commit -m "fix: GitHub Actions workflows for macOS and Windows builds"

# 4. 푸시
git branch -M main
git push -u origin main
```

## 🚀 GitHub Actions 사용법

### 빌드 확인
1. GitHub 저장소 → Actions 탭
2. "Build and Test" 워크플로우 확인
3. 성공 시 Artifacts에서 다운로드 가능

### 릴리즈 생성 (수동)
1. Actions 탭 → "Create Release"
2. "Run workflow" 클릭
3. 버전 번호 입력 (예: 21.4.0)
4. "Run workflow" 실행

## 📊 예상 결과

### 성공적인 빌드
- ✅ Ubuntu: 웹 빌드
- ✅ Windows: MSI 설치 파일
- ✅ macOS x86_64: Intel Mac용
- ✅ macOS aarch64: Apple Silicon용

### Artifacts 다운로드
- `windows-installer`: Windows 설치 파일
- `macos-app-x86_64`: Intel Mac용
- `macos-app-aarch64`: Apple Silicon용
- `linux-app`: Linux 패키지
- `web-build`: 웹 버전

## 🐛 추가 문제 해결

### 권한 문제 발생 시
1. Settings → Actions → General
2. Workflow permissions
3. "Read and write permissions" 선택
4. Save

### 빌드 실패 시
1. Actions 탭에서 실패한 워크플로우 클릭
2. 에러 로그 확인
3. 필요시 package.json의 스크립트 확인

## ✅ 체크리스트

- [ ] upload_github_fixed.sh 실행 권한 부여
- [ ] GitHub에 푸시
- [ ] Actions 탭에서 빌드 성공 확인
- [ ] Artifacts 다운로드 테스트
- [ ] (선택) 수동 릴리즈 생성

---
**작성일**: 2025-01-07  
**수정 내용**: GitHub Actions 오류 수정
