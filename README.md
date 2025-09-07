# ✨ LUX IMAGE SEARCH

<p align="center">
  <img src="https://img.shields.io/badge/version-21.4.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/platform-Desktop-green.svg" alt="Platform">
  <img src="https://img.shields.io/badge/AI-TensorFlow.js-orange.svg" alt="AI">
</p>

<p align="center">
  <strong>AI 기반 럭셔리 이미지 검색 데스크톱 애플리케이션</strong>
</p>

## 🌟 주요 기능

### 🔍 AI 이미지 검색
- **딥러닝 기반 유사도 분석**: MobileNet v2 모델 사용
- **상위 30개 결과 표시**: 가장 유사한 이미지 30개 제공
- **실시간 검색**: 빠른 특징 추출 및 매칭

### 🎯 3가지 AI 모델
- **Standard Mode**: 빠른 속도, 기본 정확도
- **Advanced Mode**: Multi-Scale 특징 추출
- **Hybrid Mode**: Standard + Advanced 융합 (최고 정확도)

### 📁 대량 이미지 인덱싱
- **폴더 선택**: 웹 표준 API로 안정적 작동
- **드래그 & 드롭**: 여러 이미지 동시 처리
- **배치 처리**: 대량 이미지 빠른 인덱싱

### 💾 로컬 데이터베이스
- **IndexedDB 사용**: 브라우저 기반 영구 저장
- **오프라인 작동**: 인터넷 연결 불필요
- **DB 관리**: 초기화, 검증 기능 제공

## 🚀 빠른 시작

### 설치 및 실행
```bash
# 저장소 클론
git clone https://github.com/YOUR_USERNAME/lux-image-search.git
cd lux-image-search

# 의존성 설치
npm install

# 개발 서버 실행
npm run tauri:dev
```

### 또는 실행 스크립트 사용
```bash
chmod +x run_v21_4.sh
./run_v21_4.sh
```

## 📋 사용 방법

### 1. 이미지 인덱싱
1. **인덱싱** 탭 클릭
2. **📁 폴더 선택 (웹)** 버튼 클릭
3. 이미지 폴더 선택
4. 자동 인덱싱 시작

### 2. 이미지 검색
1. **검색** 탭 클릭
2. 검색할 이미지 업로드 (클릭 또는 드래그)
3. AI가 유사한 이미지 30개 표시

### 3. 모델 전환
- **🔄 모델 전환** 버튼으로 3가지 모델 순환
- Standard → Advanced → Hybrid

## 🛠️ 기술 스택

| 구분 | 기술 |
|------|------|
| **Frontend** | Vanilla JavaScript, HTML5, CSS3 |
| **AI/ML** | TensorFlow.js, MobileNet v2 |
| **Storage** | IndexedDB |
| **Desktop** | Tauri v1.5 |
| **Build** | Vite |

## 📊 성능

- **특징 벡터**: 1280차원
- **인덱싱 속도**: ~0.6초/이미지
- **검색 속도**: <1초
- **정확도**: 85-90% (예상)

## 🔧 개발

### 빌드
```bash
# 웹 빌드
npm run build

# Tauri 데스크톱 앱 빌드
npm run tauri:build
```

### 테스트
```bash
# 개발 서버
npm run dev

# Tauri 개발 모드
npm run tauri:dev
```

## 📁 프로젝트 구조

```
lux-image-search/
├── src/
│   ├── main.js           # 메인 애플리케이션
│   └── ...
├── src-tauri/            # Tauri 백엔드
├── .github/workflows/    # GitHub Actions
├── index.html            # 엔트리 포인트
├── package.json          # 의존성
└── README.md            # 이 문서
```

## 🤝 기여

기여를 환영합니다! Pull Request를 보내주세요.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

MIT License - 자유롭게 사용하세요!

## 🙏 감사의 말

- TensorFlow.js 팀
- Tauri 프로젝트
- 오픈소스 커뮤니티

## 📞 문의

문제가 있거나 제안사항이 있으면 [Issues](https://github.com/YOUR_USERNAME/lux-image-search/issues)에 등록해주세요.

---

<p align="center">
  Made with ❤️ by LUX Team
</p>

<p align="center">
  <strong>LUX IMAGE SEARCH</strong> - Premium Image Search Experience
</p>
