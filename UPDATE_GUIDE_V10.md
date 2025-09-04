# 🚀 Fashion Search v10.0 업데이트 가이드

## 📋 업데이트 내용

### v9.0 → v10.0 주요 변경사항
- ❌ **제거**: 복잡한 브랜드 감지 로직 완전 제거
- ✅ **추가**: MobileNetV2 딥러닝 모델 도입
- ✅ **추가**: 코사인 유사도 기반 매칭
- ✅ **추가**: ImageNet 표준 전처리
- ✅ **추가**: WebGL GPU 가속
- 📈 **개선**: 30% → 70-80% 정확도 향상 예상

## 🛠️ 업데이트 방법

### 1. 백업 생성
```bash
# 현재 버전 백업
cp src/main.js backups/main_v9_backup_$(date +%Y%m%d).js
```

### 2. 의존성 확인
```bash
# 필요한 패키지가 이미 설치되어 있는지 확인
npm list @tensorflow/tfjs @tensorflow-models/mobilenet

# 설치되어 있지 않다면
npm install @tensorflow/tfjs @tensorflow-models/mobilenet
```

### 3. 앱 재시작
```bash
# 개발 모드로 실행
npm run tauri:dev
```

### 4. 데이터베이스 초기화 (필수!)
v10은 완전히 새로운 특징 추출 방식을 사용하므로 기존 데이터베이스를 초기화해야 합니다.

1. 앱에서 설정 → 데이터베이스 초기화 클릭
2. 또는 콘솔에서: `fashionApp.clearDB()`

### 5. 이미지 재인덱싱
1. 인덱싱 모드로 전환
2. 폴더 선택
3. 인덱싱 완료 대기 (첫 실행시 모델 다운로드로 시간이 걸릴 수 있음)

## 📊 성능 비교

| 항목 | v9.0 (이전) | v10.0 (현재) |
|------|------------|--------------|
| 모델 | 픽셀 비교 + 브랜드 감지 | MobileNetV2 |
| 특징 차원 | 가변 | 1280 |
| 유사도 메트릭 | 단순 비교 | 코사인 유사도 |
| GPU 가속 | ❌ | ✅ WebGL |
| 예상 정확도 | 30% | 70-80% |
| 모델 크기 | 0 MB | ~16 MB (첫 다운로드) |

## 💡 사용 팁

### 최고의 검색 결과를 위해:
1. **이미지 품질**: 가방이 중앙에 위치한 선명한 이미지 사용
2. **배경**: 단순한 배경일수록 좋음 (하지만 복잡한 배경도 처리 가능)
3. **각도**: 정면 또는 약간의 각도 변화는 문제없음

### 콘솔 명령어 (개발자용)
```javascript
// 버전 확인
fashionApp.version()

// 메모리 사용량 확인
fashionApp.memory()

// 특징 추출 테스트
fashionApp.testFeatures()

// DB 초기화
fashionApp.clearDB()

// 모델 재로드
fashionApp.reloadModel()
```

## ⚠️ 알려진 이슈

1. **첫 실행시 모델 다운로드**
   - MobileNetV2 모델 다운로드 필요 (~16MB)
   - 인터넷 연결 필수
   - 다운로드 후에는 오프라인 사용 가능

2. **메모리 사용량**
   - 대량 이미지 처리시 메모리 사용량 증가
   - 배치 크기를 5로 제한하여 안정성 확보
   - 필요시 `fashionApp.memory()`로 모니터링

3. **GPU 지원**
   - WebGL 2.0 지원 브라우저 필요
   - GPU가 없는 경우 CPU로 자동 폴백

## 🔄 롤백 방법

문제가 발생한 경우 이전 버전으로 롤백:
```bash
# 백업 파일 복원
cp backups/main_v9_backup_YYYYMMDD.js src/main.js

# 앱 재시작
npm run tauri:dev
```

## 📈 향후 개선 계획

### v11.0 (예정)
- 다중 스케일 특징 추출 기본 활성화
- EfficientNet-B0 옵션 추가
- 배치 검색 기능

### v12.0 (예정)
- CLIP 모델 통합 (선택적)
- 텍스트 기반 검색
- 더 높은 정확도 (85-90%)

## 🆘 문제 해결

### "모델 로드 실패" 오류
- 인터넷 연결 확인
- 프록시/방화벽 설정 확인
- `fashionApp.reloadModel()` 시도

### 검색 결과가 부정확한 경우
1. DB 초기화: `fashionApp.clearDB()`
2. 이미지 재인덱싱
3. 콘솔에서 특징 추출 테스트: `fashionApp.testFeatures()`

### 메모리 부족 오류
- 브라우저 재시작
- 배치 크기 감소 (main.js의 `batchSize` 변수)
- 이미지 수 줄이기

---

**업데이트 날짜**: 2025-01-02  
**버전**: 10.0.0  
**작성자**: AI Assistant  
**지원**: GitHub Issues 또는 이메일
