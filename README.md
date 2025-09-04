# 🔍 Image Search Desktop

크로스 플랫폼 이미지 검색 데스크톱 애플리케이션입니다. 머신러닝을 사용하여 유사한 이미지를 찾아줍니다.

## ✨ 주요 기능

- **🖼️ 이미지 유사도 검색**: 업로드한 이미지와 비슷한 이미지 찾기
- **📁 폴더 인덱싱**: 폴더 내 모든 이미지를 분석하여 데이터베이스 구축
- **🚀 빠른 검색**: TensorFlow.js를 사용한 실시간 특징 추출
- **💾 로컬 저장**: 인덱싱된 데이터를 로컬에 저장하여 재사용
- **🎨 모던 UI**: 깔끔하고 직관적인 사용자 인터페이스

## 🛠️ 기술 스택

- **Frontend**: JavaScript, TensorFlow.js, Vite
- **Backend**: Rust (Tauri)
- **ML Model**: MobileNet (이미지 특징 추출)
- **Storage**: LocalForage (인덱싱 데이터 저장)

## 📋 시스템 요구사항

- **OS**: Windows 10+, macOS 10.13+, Linux
- **RAM**: 4GB 이상 권장
- **저장공간**: 500MB 이상

## 🚀 개발 환경 설정

### 필수 도구
- Node.js 18+
- Rust (최신 stable)
- npm 또는 yarn

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/yourusername/image-search-desktop.git
cd image-search-desktop

# 2. 의존성 설치
npm install

# 3. 아이콘 생성 (첫 실행 시)
chmod +x create-icons.sh
./create-icons.sh

# 4. 개발 모드 실행
npm run tauri:dev

# 5. 프로덕션 빌드
npm run build:safe
```

## 📦 빌드

### Windows
```bash
npm run tauri:build
# 결과물: src-tauri/target/release/bundle/msi/*.msi
```

### macOS
```bash
npm run tauri:build
# 결과물: src-tauri/target/release/bundle/dmg/*.dmg
```

### Linux
```bash
npm run tauri:build
# 결과물: src-tauri/target/release/bundle/deb/*.deb
```

## 🎯 사용 방법

### 검색 모드
1. **이미지 업로드**: 드래그 앤 드롭 또는 클릭하여 이미지 선택
2. **검색 실행**: "유사 이미지 검색" 버튼 클릭
3. **결과 확인**: 유사도가 높은 순서대로 결과 표시

### 인덱싱 모드
1. **폴더 선택**: "이미지 폴더 선택" 버튼 클릭
2. **인덱싱 진행**: 자동으로 폴더 내 모든 이미지 분석
3. **완료**: 인덱싱된 이미지를 검색에 사용 가능

## 🔧 문제 해결

### 아이콘 관련 오류
```bash
# 아이콘 재생성
npm run icons:fix
```

### 빌드 오류 (Windows)
```powershell
# Visual Studio Build Tools 설치
choco install visualstudio2022buildtools -y
```

### 모델 로드 실패
- 인터넷 연결 확인 (첫 실행 시 모델 다운로드 필요)
- 브라우저 캐시 삭제 후 재시도

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 🙏 감사의 글

- [Tauri](https://tauri.app/) - 크로스 플랫폼 데스크톱 앱 프레임워크
- [TensorFlow.js](https://www.tensorflow.org/js) - 브라우저에서 ML 모델 실행
- [MobileNet](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet) - 이미지 분류 모델

---

## 🎯 최근 개선사항 (2025-09-02)

### 🚀 v2.0.0 - 완전히 새로운 알고리즘
- **새로운 이미지 검색 엔진**: 리서치 기반 최신 알고리즘 적용
  - MobileNet v2 기반 딥러닝 특징 추출
  - 퍼셉추얼 해싱으로 빠른 사전 필터링
  - 색상 히스토그램을 통한 보조 특징 활용
  - 가중 유사도 계산 (딥러닝 70%, 색상 20%, 메타데이터 10%)

- **성능 최적화**
  - WebGL 백엔드로 GPU 가속 (2-3배 속도 향상)
  - 메모리 관리 개선 (tf.tidy() 적용)
  - 배치 처리로 대용량 인덱싱 안정성 향상
  - 지연 로딩으로 결과 표시 속도 개선

- **Rust 백엔드 통합**
  - 이미지 전처리 가속화
  - 퍼셉추얼 해시 계산 최적화
  - 썸네일 생성 기능
  - 메타데이터 추출 기능

- **이미지 로드 문제 해결**
  - 파일 경로 정규화
  - 특수문자 파일명 처리 개선
  - 로드 실패 시 자동 대체 방법 적용

### 🔧 기존 문제 해결
- ✅ 브랜드 오인식 문제 해결 (복잡한 패턴 감지 제거)
- ✅ 이미지 로드 오류 수정
- ✅ 알고리즘 단순화로 정확도 향상
- ✅ 메모리 누수 방지

### 🚨 알려진 제한사항
- 첫 실행 시 MobileNet v2 모델 다운로드 필요 (약 16MB)
- 브랜드별 특화 인식은 지원하지 않음 (일반 유사도 검색에 집중)
- 대용량 이미지 처리 시 GPU 메모리 사용량 증가

**개발자**: Your Name  
**이메일**: your.email@example.com  
**버전**: 1.0.2
