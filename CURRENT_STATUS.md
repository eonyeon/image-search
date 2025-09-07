# 📋 Fashion Image Search v21.3 - 폴더 선택 문제 해결 진행 중

## 🔴 현재 문제
**폴더 선택 시 "Dialog API를 사용할 수 없습니다" 오류**

## 📊 진단 결과

### v21.2 (시도 1)
- **접근 방법**: `window.__TAURI__` 직접 사용
- **결과**: ❌ dialog와 fs API가 undefined

### v21.3 (시도 2) - 현재
- **접근 방법**: `import { dialog, fs, path } from '@tauri-apps/api'`
- **상태**: 테스트 필요

## 🧪 즉시 테스트

### 1. 앱 실행
```bash
# 실행 권한 부여
chmod +x run_v21_3.sh

# 실행
./run_v21_3.sh
```

### 2. API 테스트
1. 앱이 열리면 **설정** 탭 클릭
2. **🧪 Tauri API 테스트** 버튼 클릭
3. API 상태 확인

### 3. 콘솔 확인 (F12)
```javascript
// Tauri API 확인
window.__TAURI__

// 앱 확인
app.hasTauri
app.version  // "v21.3.0-FIXED"
```

### 4. 폴더 선택 테스트
1. **인덱싱** 탭 클릭
2. **📂 폴더 선택** 버튼 클릭
3. 오류 메시지 확인

## 🔍 추가 진단 필요

### 콘솔에서 직접 테스트
```javascript
// Tauri API 직접 테스트
if (window.__TAURI__) {
    console.log('Tauri 객체:', Object.keys(window.__TAURI__));
    
    // dialog 확인
    if (window.__TAURI__.dialog) {
        console.log('Dialog 메소드:', Object.keys(window.__TAURI__.dialog));
    }
    
    // fs 확인
    if (window.__TAURI__.fs) {
        console.log('FS 메소드:', Object.keys(window.__TAURI__.fs));
    }
}

// import 테스트 (v21.3)
import('@tauri-apps/api').then(api => {
    console.log('API 모듈:', api);
}).catch(err => {
    console.error('Import 실패:', err);
});
```

## 🛠️ 가능한 해결 방법

### 옵션 1: Script 태그로 로드
```html
<!-- index.html에 추가 -->
<script type="module">
  import * as api from '@tauri-apps/api';
  window.TauriAPI = api;
</script>
```

### 옵션 2: Vite 설정 수정
```javascript
// vite.config.js
export default {
  resolve: {
    alias: {
      '@tauri-apps/api': '@tauri-apps/api'
    }
  }
}
```

### 옵션 3: invoke 명령 사용
```javascript
// 직접 Rust 백엔드 호출
await invoke('select_folder', {});
```

## 📂 현재 파일 구조
```
image-search-desktop/
├── src/
│   ├── main.js                    # v21.3 (import 방식)
│   ├── main_v21_2_backup.js       # v21.2 (직접 접근)
│   └── main_v21_3_proper_import.js # v21.3 원본
├── run_v21_3.sh                   # 실행 스크립트
├── test_tauri_api.html            # API 테스트 도구
└── package.json                    # @tauri-apps/api 포함
```

## ⚠️ 중요 확인 사항

1. **@tauri-apps/api 설치 확인**
   ```bash
   npm list @tauri-apps/api
   ```

2. **Tauri 버전 확인**
   ```bash
   npm run tauri info
   ```

3. **브라우저가 아닌 Tauri 앱에서 실행 중인지 확인**
   - `npm run tauri:dev`로 실행해야 함
   - 브라우저에서 직접 열면 안 됨

## 📝 다음 단계

1. 위의 테스트 진행
2. 콘솔 오류 메시지 확인
3. API 구조 파악
4. 필요시 추가 수정

---
**작성 시간**: 2025-01-03  
**버전**: v21.3  
**상태**: 🔧 진행 중
