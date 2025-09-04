# 🎯 ACTION PLAN - 100% 유사도 버그 해결

## 현재 상황 (2025-01-03)
- **문제**: 모든 이미지가 99.9-100% 유사도
- **영향**: 모든 버전 (v11.3, v11.4)
- **원인**: 미확정 (진단 필요)

## 📋 즉시 실행 계획

### Step 1: v11.5 진단 버전 배포
```bash
chmod +x deploy_diagnostic.sh
./deploy_diagnostic.sh
```
- 예상 시간: 10-15분
- GitHub Actions: https://github.com/eonyeon/image-search/actions

### Step 2: Windows 테스트 (빌드 완료 후)
1. 새 .msi 다운로드 및 설치
2. F12 개발자 콘솔 열기
3. **DB 초기화** 필수
4. 작은 폴더로 재인덱싱 (이미지 5-10개)
5. 진단 실행:
```javascript
fashionApp.diagnose()
fashionApp.checkFeatures()
```

### Step 3: 결과 분석

#### Case A: 특징 벡터가 모두 같음
```javascript
// 예: [0.5, 0.5, 0.5, 0.5, ...]
```
**원인**: MobileNet 추출 문제
**해결**: 
- 모델 재로드 로직 수정
- tensor 처리 방식 변경

#### Case B: 특징 벡터는 다른데 유사도 100%
```javascript
// 벡터는 다르지만 유사도 계산 결과가 같음
```
**원인**: 코사인 유사도 계산 오류
**해결**:
- 계산 로직 재작성
- 정규화 제거 또는 수정

#### Case C: 저장/로드 시 손실
```javascript
// 인덱싱 시와 로드 후 값이 다름
```
**원인**: LocalForage 직렬화 문제
**해결**:
- 저장 방식 변경
- JSON.stringify/parse 사용

## 🔧 수정 버전 계획 (v11.6)

### 옵션 1: 최소 수정
```javascript
// v10.3 기반 + Tauri Dialog만 추가
class MinimalFashionSearch {
    // 검증된 v10.3 코드
    // + Tauri Dialog API
    // 복잡한 기능 제거
}
```

### 옵션 2: 단계적 수정
```javascript
// 현재 v11.5 기반
// 문제 부분만 수정
class FixedFashionSearch {
    // 명시적 배열 복사
    // 정규화 제거/수정
    // 디버그 로깅 유지
}
```

## 📊 성공 지표

### 최소 목표
- [ ] 유사도 범위: 40-90%
- [ ] 같은 제품: 70-85%
- [ ] 다른 제품: 40-60%

### 이상적 목표
- [ ] 제품 그룹화 작동
- [ ] 80-85% 정확도
- [ ] 안정적 성능

## 🗓️ 타임라인

### 오늘 (1/3)
- [x] v11.5 진단 버전 생성
- [x] 문서화 완료
- [ ] 진단 결과 수집
- [ ] 원인 확정

### 내일 (1/4)
- [ ] v11.6 수정 버전 개발
- [ ] 로컬 테스트
- [ ] 배포

### 주말 (1/5-6)
- [ ] 사용자 테스트
- [ ] 최종 안정화
- [ ] v12.0 계획

## 💾 백업 계획

### 작동하는 버전 보존
- `main_v10_3.js` - 70-80% 작동 ✅
- `main_v11_1.js` - 80-85% 작동 ✅

### 롤백 시나리오
```bash
# v10.3으로 롤백
cp src/main_v10_3.js src/main.js
# Tauri Dialog 부분만 추가
```

## 📝 체크리스트

### 개발자 (AI Assistant)
- [x] 진단 버전 생성
- [x] 문서화
- [ ] 진단 결과 분석
- [ ] 수정 버전 개발

### 사용자 (@eon)
- [ ] v11.5 빌드 대기
- [ ] Windows 테스트
- [ ] 진단 결과 공유
- [ ] 피드백 제공

## 🚨 비상 연락

### 문제 발생 시
1. 콘솔 전체 로그 캡처
2. `fashionApp.diagnose()` 결과
3. 스크린샷 포함
4. 이 문서 참조

## 📌 핵심 명령어 요약

```javascript
// 버전 확인
fashionApp.version()

// 시스템 진단
fashionApp.diagnose()

// 특징 벡터 확인
fashionApp.checkFeatures()

// DB 초기화
fashionApp.clearDB()

// 메모리 상태
tf.memory()
```

---

**상태**: 🔴 진행 중  
**우선순위**: 최고  
**다음 액션**: v11.5 테스트 대기
