# 🔧 Image Search Desktop - Troubleshooting Guide

## 🆘 일반적인 문제와 해결책

### 1. 앱이 시작되지 않음

#### 증상
```
npm run tauri:dev 실행 시 오류
```

#### 해결
```bash
# 1. node_modules 재설치
rm -rf node_modules
npm install

# 2. Rust 업데이트
rustup update

# 3. Tauri CLI 재설치
npm install -D @tauri-apps/cli
```

---

### 2. 버튼 클릭이 안 됨

#### 증상
- 클릭해도 반응 없음
- 콘솔에 에러 없음

#### 원인
- main.js 파일 문제
- 이벤트 리스너 미등록

#### 해결
```bash
# main.js 확인
cat src/main.js | head -10

# 첫 줄이 아래와 같아야 함:
# import { invoke } from '@tauri-apps/api/tauri';
```

---

### 3. 이미지 로드 실패

#### 증상
```
[Error] Failed to load resource: unsupported URL
[Warning] 이미지 로드 실패 (convertFileSrc)
```

#### 원인
1. 파일명에 공백
2. 파일명에 특수문자 (쉼표, #, ? 등)
3. 한글 파일명

#### 해결
```javascript
// 콘솔에서 테스트
const testPath = "/Users/eon/Documents/이미지 폴더/80133.jpg";
const normalized = testPath.replace(/\\/g, '/');
console.log(normalized);
```

파일명 변경:
```bash
# 공백 제거
mv "80161 .jpg" "80161.jpg"

# 특수문자 제거  
mv "80140,80141.png" "80140_80141.png"
```

---

### 4. 검색 결과가 이상함

#### 증상
- 전혀 다른 이미지가 나옴
- 유사도가 비정상적

#### 원인
- 이전 버전 DB 사용
- 특징 추출 오류

#### 해결
```javascript
// 1. DB 초기화
visionApp.clearDB()

// 2. 버전 확인
visionApp.version()
// 출력: 버전: v7.0.0

// 3. 재인덱싱
// UI에서 폴더 다시 선택
```

---

### 5. 인덱싱이 너무 느림

#### 증상
- 이미지 100개에 5분 이상

#### 원인
- 이미지 크기가 너무 큼
- 메모리 부족

#### 해결
1. **이미지 최적화**
```bash
# ImageMagick으로 리사이즈
mogrify -resize 1024x1024\> *.jpg
```

2. **배치 크기 조정**
```javascript
// main.js에서 수정
const batchSize = 3; // 5 → 3
```

---

### 6. 150% 신뢰도 버그 (v3.0)

#### 증상
```
브랜드 감지: louis_vuitton (신뢰도: 150.0%)
```

#### 원인
- v3.0의 브랜드 감지 버그

#### 해결
- v7.0 사용 (브랜드 감지 제거됨)

---

### 7. MobileNet 로드 실패

#### 증상
```
모델 로드 실패: Failed to fetch
```

#### 원인
- 인터넷 연결 문제
- 프록시/방화벽

#### 해결
- v7.0 사용 (모델 없음)

---

## 🔍 디버깅 팁

### 콘솔 로그 활용
```javascript
// F12 → Console

// 현재 상태 확인
console.log(visionApp)

// 이벤트 리스너 확인
document.getElementById('search-btn')

// 이미지 DB 확인
visionApp.version()
```

### 네트워크 탭 확인
```
F12 → Network
- 실패한 요청 확인
- 이미지 로드 상태
```

### 로컬 스토리지 확인
```javascript
// F12 → Application → IndexedDB

// DB 내용 확인
await localforage.getItem('visionDatabase')
```

---

## 💾 백업과 복구

### DB 백업
```javascript
// 콘솔에서 실행
const backup = await localforage.getItem('visionDatabase');
const json = JSON.stringify(backup);
console.log(json); // 복사해서 저장
```

### DB 복구
```javascript
// 백업 JSON을 paste
const backup = JSON.parse('...');
await localforage.setItem('visionDatabase', backup);
location.reload();
```

---

## 🚨 긴급 복구

### 완전 초기화
```bash
# 1. 앱 중지
Ctrl + C

# 2. 캐시 삭제
rm -rf src-tauri/target

# 3. 재빌드
npm run tauri:build
```

### 이전 버전으로 롤백
```bash
# 백업이 있는 경우
cp src/main.js.backup_v6 src/main.js
npm run tauri:dev
```

---

## 📋 체크리스트

문제 해결 전 확인사항:

- [ ] 버전 확인: `visionApp.version()`
- [ ] DB 상태: 인덱싱된 이미지 수
- [ ] 콘솔 에러: F12 확인
- [ ] 파일명: 공백/특수문자 없는지
- [ ] 메모리: 충분한지 (최소 2GB)
- [ ] 인터넷: 첫 실행 시 필요 (v3-v6)

---

## 🔄 버전별 마이그레이션

### v3 → v7
```javascript
// 1. DB 초기화 필수
visionApp.clearDB()

// 2. 재인덱싱
// 폴더 다시 선택
```

### v5/v6 → v7
```bash
# main.js 교체
cp src/main.js src/main.js.old
# 새 v7 코드 적용
```

---

## 📞 추가 지원

해결되지 않는 경우:

1. **로그 수집**
```javascript
// 전체 로그 복사
console.save = function(data) {
    const blob = new Blob([JSON.stringify(data)], {type: 'text/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = 'console-log.json';
    a.href = url;
    a.click();
}

// 실행
console.save(console.log);
```

2. **시스템 정보**
- OS: macOS/Windows/Linux
- Node: `node -v`
- NPM: `npm -v`
- Rust: `rustc --version`

3. **스크린샷**
- 콘솔 에러
- 네트워크 탭
- 실행 화면

---

**문서 버전**: 1.0.0  
**최종 업데이트**: 2024-12  
**적용 버전**: v7.0.0