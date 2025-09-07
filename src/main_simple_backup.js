// Fashion Image Search v20.1 - Simplified Version
// 간단한 테스트 버전
// 2025-01-03

console.log('🚀 Fashion Search v20.1 - Simple Version');

class LuxuryFashionSearchApp {
    constructor() {
        console.log('📱 App constructor 시작');
        this.version = 'v20.1.0-SIMPLE';
        this.dbName = 'fashionSearchDB_v20_1';
        this.db = null;
        this.currentMode = 'search';
        this.models = {
            mobileNet: null,
            activeModel: 'standard'
        };
        this.init();
    }
    
    async init() {
        console.log('🔄 init() 시작');
        try {
            // 1. DB 초기화
            await this.openDB();
            console.log('✅ DB 초기화 완료');
            
            // 2. UI 생성
            this.setupUI();
            console.log('✅ UI 생성 완료');
            
            // 3. 이벤트 리스너
            this.attachEventListeners();
            console.log('✅ 이벤트 리스너 연결 완료');
            
            // 4. 상태 업데이트
            this.updateStatus('✅ 시스템 준비 완료');
            
            // 5. 나중에 모델 로드 (에러 방지)
            setTimeout(() => {
                this.loadModelsInBackground();
            }, 1000);
            
        } catch (error) {
            console.error('❌ 초기화 실패:', error);
            alert('초기화 실패: ' + error.message);
        }
    }
    
    async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('images')) {
                    const store = db.createObjectStore('images', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    store.createIndex('filename', 'filename', { unique: false });
                }
            };
        });
    }
    
    setupUI() {
        console.log('🎨 UI 생성 중...');
        
        // 기존 로딩 메시지 제거
        document.body.innerHTML = '';
        
        const html = `
            <div style="font-family: sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px;">
                <h1 style="text-align: center;">🎯 Fashion Image Search v20.1</h1>
                <p id="status" style="text-align: center; color: #666;">초기화 중...</p>
                
                <!-- 모드 버튼 -->
                <div style="text-align: center; margin: 20px 0;">
                    <button class="mode-btn" data-mode="search" style="padding: 10px 20px; margin: 0 5px; cursor: pointer;">
                        🔍 검색 모드
                    </button>
                    <button class="mode-btn" data-mode="index" style="padding: 10px 20px; margin: 0 5px; cursor: pointer;">
                        📁 인덱싱 모드
                    </button>
                    <button class="mode-btn" data-mode="debug" style="padding: 10px 20px; margin: 0 5px; cursor: pointer;">
                        ⚙️ 설정
                    </button>
                </div>
                
                <!-- 검색 모드 -->
                <div id="searchMode" class="mode-content" style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
                    <h2>검색 모드</h2>
                    <div style="border: 2px dashed #999; padding: 40px; text-align: center; cursor: pointer;" id="uploadArea">
                        <p>🖼️ 이미지를 클릭하여 선택하세요</p>
                        <input type="file" id="fileInput" accept="image/*" style="display:none">
                    </div>
                    <div id="results" style="margin-top: 20px;"></div>
                </div>
                
                <!-- 인덱싱 모드 -->
                <div id="indexMode" class="mode-content" style="display:none; border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
                    <h2>인덱싱 모드</h2>
                    <button id="selectFilesBtn" style="padding: 10px 20px; margin: 5px; cursor: pointer;">
                        🖼️ 이미지 파일 선택
                    </button>
                    <button id="selectFolderBtn" style="padding: 10px 20px; margin: 5px; cursor: pointer;">
                        📂 폴더 선택
                    </button>
                    <button id="clearDBBtn" style="padding: 10px 20px; margin: 5px; cursor: pointer; background: #ff6b6b; color: white; border: none;">
                        🗑️ DB 초기화
                    </button>
                    <div id="indexingProgress" style="margin-top: 20px;"></div>
                </div>
                
                <!-- 디버그 모드 -->
                <div id="debugMode" class="mode-content" style="display:none; border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
                    <h2>설정 및 디버그</h2>
                    <button id="validateDBBtn" style="padding: 10px 20px; margin: 5px; cursor: pointer;">
                        ✔️ DB 검증
                    </button>
                    <button id="testBtn" style="padding: 10px 20px; margin: 5px; cursor: pointer;">
                        🧪 테스트
                    </button>
                    <div id="debugOutput" style="margin-top: 20px; padding: 10px; background: #f5f5f5; font-family: monospace; white-space: pre-wrap;"></div>
                </div>
            </div>
        `;
        
        document.body.innerHTML = html;
        console.log('✅ HTML 삽입 완료');
    }
    
    attachEventListeners() {
        console.log('🔗 이벤트 리스너 연결 중...');
        
        // 모드 전환
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('모드 버튼 클릭:', e.target.dataset.mode);
                
                // 모든 모드 숨기기
                document.querySelectorAll('.mode-content').forEach(content => {
                    content.style.display = 'none';
                });
                
                // 선택된 모드 표시
                const mode = e.target.dataset.mode;
                const modeElement = document.getElementById(mode + 'Mode');
                if (modeElement) {
                    modeElement.style.display = 'block';
                }
                
                this.currentMode = mode;
            });
        });
        
        // 파일 업로드
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => {
                console.log('업로드 영역 클릭');
                fileInput.click();
            });
            
            fileInput.addEventListener('change', (e) => {
                console.log('파일 선택됨:', e.target.files);
                if (e.target.files.length > 0) {
                    this.handleFileSelect(e.target.files[0]);
                }
            });
        }
        
        // 파일 선택 버튼
        const selectFilesBtn = document.getElementById('selectFilesBtn');
        if (selectFilesBtn) {
            selectFilesBtn.addEventListener('click', () => {
                console.log('파일 선택 버튼 클릭');
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = 'image/*';
                input.onchange = (e) => {
                    const files = Array.from(e.target.files);
                    console.log(`${files.length}개 파일 선택됨`);
                    this.indexFiles(files);
                };
                input.click();
            });
        }
        
        // 폴더 선택 버튼
        const selectFolderBtn = document.getElementById('selectFolderBtn');
        if (selectFolderBtn) {
            selectFolderBtn.addEventListener('click', () => {
                console.log('폴더 선택 버튼 클릭');
                const input = document.createElement('input');
                input.type = 'file';
                input.webkitdirectory = true;
                input.multiple = true;
                input.onchange = (e) => {
                    const files = Array.from(e.target.files).filter(f => 
                        f.type.startsWith('image/')
                    );
                    console.log(`폴더에서 ${files.length}개 이미지 발견`);
                    if (files.length > 0) {
                        if (confirm(`${files.length}개의 이미지를 인덱싱하시겠습니까?`)) {
                            this.indexFiles(files);
                        }
                    }
                };
                input.click();
            });
        }
        
        // DB 초기화
        const clearDBBtn = document.getElementById('clearDBBtn');
        if (clearDBBtn) {
            clearDBBtn.addEventListener('click', async () => {
                if (confirm('DB를 초기화하시겠습니까?')) {
                    await this.clearDB();
                    alert('DB가 초기화되었습니다.');
                }
            });
        }
        
        // DB 검증
        const validateDBBtn = document.getElementById('validateDBBtn');
        if (validateDBBtn) {
            validateDBBtn.addEventListener('click', () => {
                this.validateDB();
            });
        }
        
        // 테스트 버튼
        const testBtn = document.getElementById('testBtn');
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                const output = document.getElementById('debugOutput');
                output.textContent = `테스트 성공!\n버전: ${this.version}\nDB: ${this.dbName}\n시간: ${new Date().toLocaleString()}`;
            });
        }
    }
    
    updateStatus(message) {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = message;
        }
        console.log('상태:', message);
    }
    
    async handleFileSelect(file) {
        console.log('파일 처리:', file.name);
        this.updateStatus('🔍 검색 준비 중...');
        
        // 간단한 미리보기
        const reader = new FileReader();
        reader.onload = (e) => {
            const results = document.getElementById('results');
            results.innerHTML = `
                <h3>업로드된 이미지</h3>
                <img src="${e.target.result}" style="max-width: 300px;">
                <p>파일명: ${file.name}</p>
                <p>크기: ${(file.size / 1024).toFixed(2)} KB</p>
                <p style="color: orange;">⚠️ AI 모델 로딩 중... 잠시 후 검색이 가능합니다.</p>
            `;
        };
        reader.readAsDataURL(file);
    }
    
    async indexFiles(files) {
        console.log(`인덱싱 시작: ${files.length}개 파일`);
        const progressDiv = document.getElementById('indexingProgress');
        
        progressDiv.innerHTML = `<h3>인덱싱 중...</h3>`;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            progressDiv.innerHTML = `
                <h3>인덱싱 중... (${i + 1}/${files.length})</h3>
                <p>현재: ${file.name}</p>
            `;
            
            // 간단한 저장 (실제 AI 처리는 나중에)
            await this.saveFileToDB(file);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        progressDiv.innerHTML = `<h3>✅ 인덱싱 완료! (${files.length}개)</h3>`;
    }
    
    async saveFileToDB(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const imageData = {
                    filename: file.name,
                    path: e.target.result,
                    indexed: new Date().toISOString(),
                    embedding: [] // 나중에 AI 처리
                };
                
                const transaction = this.db.transaction(['images'], 'readwrite');
                const store = transaction.objectStore('images');
                store.add(imageData);
                
                transaction.oncomplete = () => resolve();
            };
            reader.readAsDataURL(file);
        });
    }
    
    async clearDB() {
        const transaction = this.db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        await store.clear();
    }
    
    async validateDB() {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            const output = document.getElementById('debugOutput');
            output.textContent = `=== DB 검증 결과 ===\n총 이미지: ${images.length}개\n\n`;
            
            images.slice(0, 5).forEach((img, i) => {
                output.textContent += `${i+1}. ${img.filename}\n`;
            });
        };
    }
    
    async loadModelsInBackground() {
        console.log('🤖 AI 모델 로딩 시작 (백그라운드)');
        this.updateStatus('AI 모델 로딩 중...');
        
        try {
            // TensorFlow.js 로드는 나중에
            console.log('AI 모델은 나중에 로드합니다.');
            this.updateStatus('✅ 시스템 준비 완료 (기본 모드)');
        } catch (error) {
            console.error('모델 로딩 실패:', error);
            this.updateStatus('⚠️ AI 없이 기본 모드로 실행 중');
        }
    }
}

// 앱 시작
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOMContentLoaded - 앱 시작');
    
    // 로딩 메시지 제거
    const loadingEl = document.getElementById('app-loading');
    if (loadingEl) {
        loadingEl.remove();
    }
    
    // 앱 인스턴스 생성
    try {
        window.app = new LuxuryFashionSearchApp();
        console.log('✅ 앱 생성 성공');
    } catch (error) {
        console.error('❌ 앱 생성 실패:', error);
        document.body.innerHTML = `
            <div style="padding: 20px; color: red;">
                <h2>❌ 앱 로딩 실패</h2>
                <p>에러: ${error.message}</p>
                <p>개발자 도구(F12)를 열어 콘솔을 확인하세요.</p>
            </div>
        `;
    }
});

console.log('✅ main.js 로드 완료');
