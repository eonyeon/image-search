# 🔧 TROUBLESHOOTING GUIDE - 100% 유사도 문제

## 문제 설명
모든 이미지가 99.9% 또는 100% 유사도로 나타나는 심각한 버그

## 🔍 즉시 확인 사항

### 1. 콘솔에서 진단 실행
```javascript
// F12 개발자 도구 열고 실행
fashionApp.diagnose()
```

### 2. 예상 출력 확인

#### ❌ 문제가 있는 경우:
```
4️⃣ 샘플 유사도:
  - image1.jpg vs image2.jpg: 99.9%
⚠️ 문제 감지: 유사도가 비정상적으로 높음!
```

#### ✅ 정상인 경우:
```
4️⃣ 샘플 유사도:
  - image1.jpg vs image2.jpg: 65.3%
진단 완료
```

### 3. 특징 벡터 확인
```javascript
fashionApp.checkFeatures()
```

#### 확인 포인트:
- 차원이 1280이어야 함
- 값들이 다양해야 함 (모두 0이거나 같은 값 X)
- 평균이 0 근처여야 함

## 🛠️ 해결 방법

### 방법 1: 완전 초기화
```javascript
// 1. 모든 캐시 삭제
await fashionApp.clearDB()
localStorage.clear()

// 2. 페이지 새로고침
location.reload()

// 3. 재인덱싱
// 폴더 선택 → 인덱싱
```

### 방법 2: CPU 모드 테스트
```javascript
// WebGL 문제일 경우 CPU 모드로 전환
tf.setBackend('cpu')
await tf.ready()
// 그 후 재인덱싱
```

### 방법 3: 소규모 테스트
1. 이미지 2-3개만 있는 폴더로 테스트
2. 콘솔 로그 확인
3. 유사도가 정상 범위인지 확인

## 📊 정상 유사도 범위

| 이미지 관계 | 예상 유사도 |
|------------|------------|
| 같은 제품 다른 각도 | 70-85% |
| 비슷한 스타일 | 60-70% |
| 다른 제품 | 40-60% |
| 완전히 다른 카테고리 | 20-40% |

## 🚨 에러 메시지별 대응

### "Failed to load model"
- 인터넷 연결 확인
- 방화벽/안티바이러스 확인
- Chrome 최신 버전 확인

### "WebGL not supported"
- Chrome 설정에서 하드웨어 가속 활성화
- chrome://gpu 에서 상태 확인

### "Out of memory"
- 이미지 개수 줄이기 (100개 이하)
- 브라우저 재시작
- 다른 탭 닫기

## 📝 로그 수집

### 문제 보고 시 필요한 정보:
```javascript
// 1. 버전
fashionApp.version()

// 2. 진단
fashionApp.diagnose()

// 3. 이미지 개수
fashionApp.stats()

// 4. 첫 번째 특징
fashionApp.checkFeatures()

// 5. TensorFlow 상태
console.log(tf.getBackend())
console.log(tf.memory())
```

## 💡 임시 해결책

### 이전 작동 버전 사용
1. v10.3 버전 요청
2. 기본 기능만 사용
3. 제품 그룹화 비활성화

### 대체 방법
1. 이미지 크기 줄이기
2. JPG만 사용 (PNG 제외)
3. 폴더당 50개 이하로 제한

## 🔄 재설치 절차

### Windows
1. 제어판 → 프로그램 제거
2. Image Search Desktop 제거
3. %AppData% 폴더 삭제
4. 새 버전 설치
5. 관리자 권한으로 실행

### 브라우저 캐시
1. F12 → Application 탭
2. Storage → Clear site data
3. 페이지 새로고침

## 📞 추가 지원

### 도움이 필요한 경우:
1. 콘솔 전체 로그 캡처
2. 스크린샷 포함
3. 운영체제 및 버전
4. 이미지 파일 형식
5. 폴더 구조

---

**마지막 업데이트**: 2025-01-03  
**관련 버전**: v11.5
