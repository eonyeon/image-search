# 🚀 Fashion Image Search v21 - 빠른 시작 가이드

## 즉시 실행 (1분 이내)

### 방법 1: 자동 실행
```bash
chmod +x deploy_v21.sh
./deploy_v21.sh
```

### 방법 2: 수동 실행
```bash
npm run tauri:dev
```

앱이 열리면 **Cmd+Shift+R** (Mac) 또는 **Ctrl+F5** (Windows) 누르기!

## ✅ 해결된 문제들

### 1. UI 작동 문제 ✅
- **이전**: 폴더 선택 버튼 작동 안함
- **현재**: Tauri Native Dialog로 완벽 작동

### 2. 고성능 모델 탑재 ✅
- **이전**: MobileNet v2만 사용
- **현재**: 3가지 모델 (Standard/Advanced/Hybrid)

## 🎯 핵심 기능 테스트

### 1. 폴더 인덱싱 (가장 중요!)
1. **인덱싱** 탭 클릭
2. **📂 폴더 선택 (Tauri)** 버튼 클릭
3. 이미지 폴더 선택
4. 자동 인덱싱 시작

### 2. 이미지 검색
1. **검색** 탭 클릭
2. 이미지 드래그 또는 클릭
3. 유사 이미지 결과 확인

### 3. 모델 전환
- 상단 **🔄 모델 전환** 버튼으로 성능 조절
  - Standard: 빠른 속도
  - Advanced: 높은 정확도
  - Hybrid: 최고 성능

## 🧪 테스트 도구

브라우저에서 `test_v21.html` 열기:
```bash
open test_v21.html  # Mac
start test_v21.html # Windows
```

## 📊 현재 상태

| 기능 | 상태 | 설명 |
|------|------|------|
| UI 작동 | ✅ | 모든 버튼 정상 작동 |
| 폴더 선택 | ✅ | Tauri Dialog API 통합 |
| 고성능 모델 | ✅ | Multi-Scale 특징 추출 |
| 인덱싱 | ✅ | 배치 처리 지원 |
| 검색 | ✅ | 코사인 유사도 |
| 분석 | ✅ | 실시간 통계 |

## 🔍 콘솔 명령어 (F12)

```javascript
// 버전 확인
app.version

// 모델 상태
app.models.activeModel
app.models.isReady

// DB 검증
app.validateDB()

// 메트릭
app.metrics
```

## ⚠️ 트러블슈팅

| 문제 | 해결 |
|------|------|
| 앱이 안 열림 | `npm install` 후 재시도 |
| 모델 로드 실패 | 인터넷 연결 확인 |
| 폴더 선택 안됨 | Tauri 앱인지 확인 |
| UI 깨짐 | Cmd+Shift+R 강제 새로고침 |

## 📱 주요 개선사항

### v20 → v21
- 🚀 **3가지 AI 모델**: Standard/Advanced/Hybrid
- 📂 **네이티브 폴더 선택**: Tauri Dialog API
- 📊 **실시간 분석**: 브랜드별 통계
- 💾 **DB 관리**: Import/Export 기능
- 🎨 **UI 개선**: 고급 분석 대시보드

## 🎉 완료!

이제 v21이 완전히 작동합니다!

문제가 있으면:
1. `test_v21.html`로 환경 체크
2. 콘솔(F12)에서 에러 확인
3. `V21_STATUS.md` 참고

---
**버전**: v21.0.0-ADVANCED  
**날짜**: 2025-01-03
