// Fashion Image Search v21.2 - Stable Tauri Integration
// 직접 window.__TAURI__ 객체 사용 (동적 import 없이)
// 2025-01-03

console.log('🚀 Fashion Search v21.2 - Stable Tauri Integration');

class AdvancedFashionSearchApp {
    constructor() {
        console.log('📱 Advanced App 시작');
        this.version = 'v21.2.0-STABLE';
        this.dbName = 'fashionSearchDB_v21';
        this.db = null;
        this.currentMode = 'search';
        this.currentSearchFile = null;
        
        // Tauri API 체크
        this.hasTauri = false;
        this.tauriApi = null;
        
        // 멀티 모델 시스템
        this.models = {
            mobileNet: null,
            efficientNet: null,
            activeModel: 'hybrid',
            isReady: false
        };
        
        // 성능 메트릭
        this.metrics = {
            indexedCount: 0,
            searchCount: 0,
            avgSimilarity: 0
        };
        
        this.init();
    }
    
    async init() {
        console.log('🔄 초기화 시작');
        try {
            // 1. Tauri API 확인
            this.checkTauriAPI();
            
            // 2. DB 초기화
            await this.openDB();
            console.log('✅ DB 초기화 완료');
            
            // 3. UI 생성
            this.setupAdvancedUI();
            console.log('✅ Advanced UI 생성 완료');
            
            // 4. 이벤트 리스너
            this.attachAdvancedEventListeners();
            console.log('✅ 이벤트 리스너 연결 완료');
            
            // 5. 모델 로드
            this.updateStatus('🔄 고성능 AI 모델 로딩 중...');
            await this.loadAdvancedModels();
            
        } catch (error) {
            console.error('❌ 초기화 실패:', error);
            this.updateStatus('⚠️ 초기화 실패: ' + error.message);
        }
    }
    
    checkTauriAPI() {
        // window.__TAURI__ 직접 확인
        if (typeof window !== 'undefined' && window.__TAURI__) {
            console.log('✅ Tauri 환경 감지');
            this.hasTauri = true;
            this.tauriApi = window.__TAURI__;
            
            // API 구조 확인
            console.log('📦 Tauri API 구조:');
            console.log('- dialog:', typeof this.tauriApi.dialog);
            console.log('- fs:', typeof this.tauriApi.fs);
            console.log('- path:', typeof this.tauriApi.path);
            console.log('- invoke:', typeof this.tauriApi.invoke);
            
            // 사용 가능한 메소드 확인
            if (this.tauriApi.dialog) {
                console.log('✅ Dialog API 사용 가능');
            }
            if (this.tauriApi.fs) {
                console.log('✅ FS API 사용 가능');
            }
            if (this.tauriApi.invoke) {
                console.log('✅ Invoke API 사용 가능');
            }
        } else {
            console.log('⚠️ Tauri API 없음 - 웹 모드로 실행');
            this.hasTauri = false;
        }
    }
    
    async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2);
            
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
                    store.createIndex('indexed', 'indexed', { unique: false });
                    store.createIndex('brand', 'brand', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('metadata')) {
                    const metaStore = db.createObjectStore('metadata', { 
                        keyPath: 'key' 
                    });
                }
            };
        });
    }
    
    async loadAdvancedModels() {
        try {
            console.log('🤖 고성능 AI 모델 로딩 시작...');
            
            // TensorFlow.js 로드
            if (typeof tf === 'undefined') {
                await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.11.0/dist/tf.min.js');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // WebGL 백엔드 설정
            if (tf && tf.getBackend() !== 'webgl') {
                await tf.setBackend('webgl');
                console.log('✅ WebGL 가속 활성화');
            }
            
            // MobileNet v2 로드
            await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js');
            this.models.mobileNet = await mobilenet.load({
                version: 2,
                alpha: 1.0
            });
            console.log('✅ MobileNet v2 로드 완료');
            
            // Multi-Scale 시뮬레이션
            this.models.efficientNet = {
                extractFeatures: async (img) => {
                    const scales = [224, 299, 384];
                    const features = [];
                    
                    for (const scale of scales) {
                        const canvas = document.createElement('canvas');
                        canvas.width = scale;
                        canvas.height = scale;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, scale, scale);
                        
                        const scaledImg = new Image();
                        scaledImg.src = canvas.toDataURL();
                        await new Promise(r => scaledImg.onload = r);
                        
                        const embeddings = this.models.mobileNet.infer(scaledImg, true);
                        const featureArray = await embeddings.array();
                        embeddings.dispose();
                        
                        features.push(featureArray[0]);
                    }
                    
                    const fusedFeatures = features[0].map((_, i) => {
                        return features.reduce((sum, f) => sum + f[i], 0) / features.length;
                    });
                    
                    return fusedFeatures;
                }
            };
            console.log('✅ Multi-Scale 준비 완료');
            
            this.models.isReady = true;
            this.updateStatus('✅ 고성능 AI 모델 준비 완료!');
            this.displayModelInfo();
            
        } catch (error) {
            console.error('❌ 모델 로딩 실패:', error);
            this.updateStatus('⚠️ AI 모델 로딩 실패');
        }
    }
    
    displayModelInfo() {
        const modelInfo = document.getElementById('modelInfo');
        if (modelInfo) {
            modelInfo.innerHTML = `
                <div style="padding: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; font-size: 12px;">
                    <strong>활성 모델:</strong> ${this.models.activeModel === 'hybrid' ? 'Hybrid' : 
                                                    this.models.activeModel === 'advanced' ? 'Advanced' : 
                                                    'Standard'}
                    <br>
                    <strong>Tauri 모드:</strong> ${this.hasTauri ? '활성화 ✓' : '웹 모드'}
                    <br>
                    <strong>GPU 가속:</strong> ${tf && tf.getBackend() === 'webgl' ? '활성화 ✓' : '비활성화'}
                </div>
            `;
        }
    }
    
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    setupAdvancedUI() {
        console.log('🎨 UI 생성 중...');
        
        document.body.innerHTML = '';
        
        const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 1400px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
                <div style="background: white; border-radius: 20px; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                    
                    <!-- 헤더 -->
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #333; margin-bottom: 10px;">
                            🚀 Advanced Fashion Search v21.2
                        </h1>
                        <p id="status" style="color: #666; font-size: 14px;">초기화 중...</p>
                        <div id="modelInfo" style="margin-top: 10px;"></div>
                    </div>
                    
                    <!-- 모델 선택 -->
                    <div style="text-align: center; margin: 20px 0;">
                        <button id="toggleModelBtn" style="padding: 10px 20px; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 14px;">
                            🔄 모델 전환
                        </button>
                    </div>
                    
                    <!-- 모드 탭 -->
                    <div style="text-align: center; margin: 20px 0;">
                        <button class="mode-btn active" data-mode="search" style="padding: 12px 24px; margin: 0 5px; cursor: pointer; border: 2px solid #667eea; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 25px; font-size: 16px; font-weight: 500;">
                            🔍 검색
                        </button>
                        <button class="mode-btn" data-mode="index" style="padding: 12px 24px; margin: 0 5px; cursor: pointer; border: 2px solid #667eea; background: white; color: #667eea; border-radius: 25px; font-size: 16px; font-weight: 500;">
                            📁 인덱싱
                        </button>
                        <button class="mode-btn" data-mode="debug" style="padding: 12px 24px; margin: 0 5px; cursor: pointer; border: 2px solid #667eea; background: white; color: #667eea; border-radius: 25px; font-size: 16px; font-weight: 500;">
                            ⚙️ 설정
                        </button>
                    </div>
                    
                    <!-- 검색 모드 -->
                    <div id="searchMode" class="mode-content" style="background: #f8f9ff; border-radius: 15px; padding: 30px; margin: 20px 0;">
                        <h2 style="color: #333; margin-bottom: 20px;">🔍 검색</h2>
                        <div style="border: 3px dashed #667eea; border-radius: 15px; padding: 60px 20px; text-align: center; cursor: pointer; background: white; transition: all 0.3s;" id="uploadArea">
                            <p style="color: #667eea; font-size: 18px; margin: 0;">🖼️ 이미지를 드래그하거나 클릭</p>
                            <input type="file" id="fileInput" accept="image/*" style="display:none">
                        </div>
                        <div id="previewContainer" style="display: none; margin-top: 20px;">
                            <img id="previewImage" style="width: 100%; max-width: 400px; border-radius: 10px;">
                        </div>
                        <div id="results" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-top: 30px;"></div>
                    </div>
                    
                    <!-- 인덱싱 모드 -->
                    <div id="indexMode" class="mode-content" style="display:none; background: #f8f9ff; border-radius: 15px; padding: 30px; margin: 20px 0;">
                        <h2 style="color: #333; margin-bottom: 20px;">📁 인덱싱</h2>
                        
                        <div style="text-align: center;">
                            <button id="selectFilesBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                🖼️ 파일 선택
                            </button>
                            <button id="selectFolderBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: linear-gradient(135deg, #48c774 0%, #3ec46d 100%); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                📂 폴더 선택
                            </button>
                            <button id="clearDBBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                🗑️ DB 초기화
                            </button>
                        </div>
                        
                        <div id="dropZone" style="margin-top: 20px; border: 3px dashed #667eea; border-radius: 15px; padding: 40px 20px; text-align: center; background: white;">
                            <h3 style="color: #667eea; margin: 0 0 10px 0;">📥 드래그 & 드롭</h3>
                            <p style="color: #999; margin: 0;">여러 이미지를 여기에 드래그하세요</p>
                        </div>
                        
                        <div id="progressLog" style="margin-top: 20px; padding: 20px; background: white; border-radius: 10px; max-height: 200px; overflow-y: auto; font-size: 12px; font-family: monospace;"></div>
                    </div>
                    
                    <!-- 디버그 모드 -->
                    <div id="debugMode" class="mode-content" style="display:none; background: #f8f9ff; border-radius: 15px; padding: 30px; margin: 20px 0;">
                        <h2 style="color: #333; margin-bottom: 20px;">⚙️ 설정</h2>
                        <div style="text-align: center;">
                            <button id="validateDBBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                ✔️ DB 검증
                            </button>
                            <button id="testTauriBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                🧪 Tauri API 테스트
                            </button>
                            <button id="reinitBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                💣 완전 초기화
                            </button>
                        </div>
                        <div id="debugOutput" style="margin-top: 20px; padding: 20px; background: white; border-radius: 10px; font-family: monospace; white-space: pre-wrap; max-height: 400px; overflow-y: auto; font-size: 13px;"></div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.innerHTML = html;
        document.body.style.margin = '0';
        document.body.style.padding = '0';
    }
    
    attachAdvancedEventListeners() {
        console.log('🔗 이벤트 리스너 연결 중...');
        
        // 모드 전환
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'white';
                    b.style.color = '#667eea';
                });
                e.target.classList.add('active');
                e.target.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                e.target.style.color = 'white';
                
                const mode = e.target.dataset.mode;
                this.switchMode(mode);
            });
        });
        
        // 모델 전환
        const toggleModelBtn = document.getElementById('toggleModelBtn');
        if (toggleModelBtn) {
            toggleModelBtn.addEventListener('click', () => {
                const models = ['standard', 'advanced', 'hybrid'];
                const currentIndex = models.indexOf(this.models.activeModel);
                const nextIndex = (currentIndex + 1) % models.length;
                this.models.activeModel = models[nextIndex];
                this.displayModelInfo();
                console.log(`모델 전환: ${this.models.activeModel}`);
            });
        }
        
        // 파일 선택
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.processSearchImage(e.target.files[0]);
                }
            });
            
            // 드래그 앤 드롭
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '#764ba2';
                uploadArea.style.background = '#f0f2ff';
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.borderColor = '#667eea';
                uploadArea.style.background = 'white';
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '#667eea';
                uploadArea.style.background = 'white';
                
                const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                if (files.length > 0) {
                    this.processSearchImage(files[0]);
                }
            });
        }
        
        // 파일 선택 버튼
        const selectFilesBtn = document.getElementById('selectFilesBtn');
        if (selectFilesBtn) {
            selectFilesBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = 'image/*';
                
                input.onchange = (e) => {
                    const files = Array.from(e.target.files);
                    if (files.length > 0) {
                        this.indexFiles(files);
                    }
                };
                
                input.click();
            });
        }
        
        // 폴더 선택 버튼 (개선된 버전)
        const selectFolderBtn = document.getElementById('selectFolderBtn');
        if (selectFolderBtn) {
            selectFolderBtn.addEventListener('click', async () => {
                console.log('📂 폴더 선택 버튼 클릭');
                await this.selectFolder();
            });
        }
        
        // 드래그 앤 드롭 (인덱싱)
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#764ba2';
                dropZone.style.background = '#f0f2ff';
            });
            
            dropZone.addEventListener('dragleave', () => {
                dropZone.style.borderColor = '#667eea';
                dropZone.style.background = 'white';
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#667eea';
                dropZone.style.background = 'white';
                
                const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                if (files.length > 0) {
                    this.indexFiles(files);
                }
            });
        }
        
        // DB 관리
        const clearDBBtn = document.getElementById('clearDBBtn');
        if (clearDBBtn) {
            clearDBBtn.addEventListener('click', async () => {
                if (confirm('DB를 초기화하시겠습니까?')) {
                    await this.clearDB();
                    this.updateProgressLog('✅ DB 초기화 완료');
                }
            });
        }
        
        const validateDBBtn = document.getElementById('validateDBBtn');
        if (validateDBBtn) {
            validateDBBtn.addEventListener('click', () => {
                this.validateDB();
            });
        }
        
        // Tauri API 테스트 버튼
        const testTauriBtn = document.getElementById('testTauriBtn');
        if (testTauriBtn) {
            testTauriBtn.addEventListener('click', () => {
                this.testTauriAPI();
            });
        }
        
        const reinitBtn = document.getElementById('reinitBtn');
        if (reinitBtn) {
            reinitBtn.addEventListener('click', () => {
                if (confirm('완전 초기화하시겠습니까?')) {
                    indexedDB.deleteDatabase(this.dbName);
                    location.reload();
                }
            });
        }
    }
    
    // Tauri API 테스트
    async testTauriAPI() {
        const output = document.getElementById('debugOutput');
        let report = '=== Tauri API 테스트 ===\n\n';
        
        if (!this.hasTauri) {
            report += '❌ Tauri API를 사용할 수 없습니다.\n';
            report += '웹 브라우저에서 실행 중입니다.\n';
            output.textContent = report;
            return;
        }
        
        report += '✅ Tauri 환경 감지\n\n';
        report += '📦 사용 가능한 API:\n';
        
        // Dialog API 테스트
        if (this.tauriApi.dialog) {
            report += '✅ Dialog API\n';
            if (this.tauriApi.dialog.open) {
                report += '  - open() 메소드 사용 가능\n';
            }
            if (this.tauriApi.dialog.save) {
                report += '  - save() 메소드 사용 가능\n';
            }
        } else {
            report += '❌ Dialog API 없음\n';
        }
        
        // FS API 테스트
        if (this.tauriApi.fs) {
            report += '✅ FS API\n';
            if (this.tauriApi.fs.readDir) {
                report += '  - readDir() 메소드 사용 가능\n';
            }
            if (this.tauriApi.fs.readBinaryFile) {
                report += '  - readBinaryFile() 메소드 사용 가능\n';
            }
        } else {
            report += '❌ FS API 없음\n';
        }
        
        // Path API 테스트
        if (this.tauriApi.path) {
            report += '✅ Path API\n';
        } else {
            report += '❌ Path API 없음\n';
        }
        
        // Invoke API 테스트
        if (this.tauriApi.invoke) {
            report += '✅ Invoke API\n';
        } else {
            report += '❌ Invoke API 없음\n';
        }
        
        report += '\n📝 테스트 완료!';
        output.textContent = report;
    }
    
    // 폴더 선택 (안정적인 버전)
    async selectFolder() {
        console.log('🔍 폴더 선택 시작...');
        
        if (!this.hasTauri) {
            console.log('⚠️ Tauri API 없음 - 웹 폴백 사용');
            this.selectFolderWeb();
            return;
        }
        
        try {
            let selected = null;
            
            // 방법 1: dialog.open 직접 사용
            if (this.tauriApi.dialog && this.tauriApi.dialog.open) {
                console.log('📂 dialog.open 사용');
                selected = await this.tauriApi.dialog.open({
                    directory: true,
                    multiple: false,
                    title: '이미지 폴더 선택'
                });
            }
            // 방법 2: invoke 사용
            else if (this.tauriApi.invoke) {
                console.log('📂 invoke 사용');
                selected = await this.tauriApi.invoke('tauri', {
                    __tauriModule: 'Dialog',
                    message: {
                        cmd: 'openDialog',
                        options: {
                            directory: true,
                            title: '이미지 폴더 선택'
                        }
                    }
                });
            }
            else {
                throw new Error('Dialog API를 사용할 수 없습니다');
            }
            
            if (selected) {
                console.log('✅ 폴더 선택됨:', selected);
                await this.processTauriFolder(selected);
            } else {
                console.log('❌ 폴더 선택 취소됨');
            }
            
        } catch (error) {
            console.error('❌ 폴더 선택 오류:', error);
            alert('폴더 선택 중 오류가 발생했습니다.\n' + error.message);
            // 웹 폴백
            this.selectFolderWeb();
        }
    }
    
    // 웹 폴더 선택 (폴백)
    selectFolderWeb() {
        console.log('📁 웹 폴더 선택 모드');
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.directory = true;
        input.multiple = true;
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
            if (files.length > 0) {
                if (confirm(`${files.length}개의 이미지를 발견했습니다. 인덱싱하시겠습니까?`)) {
                    this.indexFiles(files);
                }
            }
        };
        
        input.click();
    }
    
    // Tauri 폴더 처리
    async processTauriFolder(folderPath) {
        console.log('📁 Tauri 폴더 처리:', folderPath);
        
        try {
            let entries = null;
            
            // 방법 1: fs.readDir 직접 사용
            if (this.tauriApi.fs && this.tauriApi.fs.readDir) {
                console.log('📂 fs.readDir 사용');
                entries = await this.tauriApi.fs.readDir(folderPath, { recursive: false });
            }
            // 방법 2: invoke 사용
            else if (this.tauriApi.invoke) {
                console.log('📂 invoke로 readDir 호출');
                entries = await this.tauriApi.invoke('tauri', {
                    __tauriModule: 'Fs',
                    message: {
                        cmd: 'readDir',
                        path: folderPath,
                        options: { recursive: false }
                    }
                });
            }
            else {
                throw new Error('FS API를 사용할 수 없습니다');
            }
            
            if (entries && entries.length > 0) {
                const imageFiles = entries.filter(entry => {
                    if (entry.children) return false; // 디렉토리 제외
                    const name = (entry.name || entry.path || '').toLowerCase();
                    return name.endsWith('.jpg') || name.endsWith('.jpeg') || 
                           name.endsWith('.png') || name.endsWith('.webp');
                });
                
                console.log(`✅ 이미지 파일: ${imageFiles.length}개`);
                
                if (imageFiles.length > 0) {
                    if (confirm(`${imageFiles.length}개의 이미지를 발견했습니다. 인덱싱하시겠습니까?`)) {
                        await this.indexTauriFiles(imageFiles, folderPath);
                    }
                } else {
                    alert('이미지 파일을 찾을 수 없습니다.');
                }
            } else {
                alert('폴더가 비어있습니다.');
            }
            
        } catch (error) {
            console.error('❌ 폴더 처리 오류:', error);
            alert('폴더 처리 중 오류가 발생했습니다.\n' + error.message);
        }
    }
    
    // Tauri 파일 인덱싱
    async indexTauriFiles(fileEntries, basePath) {
        if (!this.models.isReady) {
            alert('AI 모델이 아직 로드 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        
        this.updateProgressLog(`🔄 인덱싱 시작: ${fileEntries.length}개 파일`);
        
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < fileEntries.length; i++) {
            const entry = fileEntries[i];
            const fileName = entry.name || entry.path || '';
            
            try {
                const filePath = basePath + '/' + fileName;
                this.updateProgressLog(`처리 중: ${fileName}`);
                
                let fileData = null;
                
                // 파일 읽기
                if (this.tauriApi.fs && this.tauriApi.fs.readBinaryFile) {
                    fileData = await this.tauriApi.fs.readBinaryFile(filePath);
                } else if (this.tauriApi.invoke) {
                    fileData = await this.tauriApi.invoke('tauri', {
                        __tauriModule: 'Fs',
                        message: {
                            cmd: 'readBinaryFile',
                            path: filePath
                        }
                    });
                }
                
                if (fileData) {
                    // Uint8Array로 변환 (필요한 경우)
                    const uint8Array = fileData instanceof Uint8Array ? fileData : new Uint8Array(fileData);
                    
                    // Blob 생성
                    const blob = new Blob([uint8Array], { type: 'image/*' });
                    const url = URL.createObjectURL(blob);
                    
                    // 이미지 로드
                    const img = new Image();
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        setTimeout(reject, 5000); // 5초 타임아웃
                        img.src = url;
                    });
                    
                    // 특징 추출
                    const embedding = await this.extractFeatures(img);
                    
                    // DB에 저장
                    const imageData = {
                        filename: fileName,
                        path: url,
                        embedding: embedding,
                        indexed: new Date().toISOString()
                    };
                    
                    await this.saveImageToDB(imageData);
                    successCount++;
                    this.metrics.indexedCount++;
                    
                    this.updateProgressLog(`✅ ${fileName}`);
                }
                
            } catch (error) {
                console.error(`실패: ${fileName}`, error);
                failCount++;
                this.updateProgressLog(`❌ ${fileName}: ${error.message}`);
            }
        }
        
        this.updateProgressLog(`\n✅ 인덱싱 완료!\n성공: ${successCount}개\n실패: ${failCount}개`);
        this.updateStatus(`✅ ${successCount}개 이미지 인덱싱 완료`);
    }
    
    switchMode(mode) {
        this.currentMode = mode;
        document.querySelectorAll('.mode-content').forEach(content => {
            content.style.display = 'none';
        });
        
        const modeElement = document.getElementById(mode + 'Mode');
        if (modeElement) {
            modeElement.style.display = 'block';
        }
        
        console.log(`모드 전환: ${mode}`);
    }
    
    updateStatus(message) {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = message;
        }
        console.log('상태:', message);
    }
    
    updateProgressLog(message) {
        const logEl = document.getElementById('progressLog');
        if (logEl) {
            const timestamp = new Date().toLocaleTimeString();
            logEl.innerHTML = `[${timestamp}] ${message}<br>` + logEl.innerHTML;
            logEl.scrollTop = 0;
        }
    }
    
    // 특징 추출
    async extractFeatures(imageElement) {
        if (!this.models.isReady) {
            return new Array(1280).fill(0);
        }
        
        try {
            let features = [];
            
            if (this.models.activeModel === 'standard') {
                const embeddings = this.models.mobileNet.infer(imageElement, true);
                const mobileNetFeatures = await embeddings.array();
                embeddings.dispose();
                features = mobileNetFeatures[0];
                
            } else if (this.models.activeModel === 'advanced') {
                features = await this.models.efficientNet.extractFeatures(imageElement);
                
            } else if (this.models.activeModel === 'hybrid') {
                const embeddings = this.models.mobileNet.infer(imageElement, true);
                const mobileNetFeatures = await embeddings.array();
                embeddings.dispose();
                
                const multiScaleFeatures = await this.models.efficientNet.extractFeatures(imageElement);
                
                features = mobileNetFeatures[0].map((f, i) => 
                    f * 0.6 + multiScaleFeatures[i] * 0.4
                );
            }
            
            return features;
            
        } catch (error) {
            console.error('특징 추출 실패:', error);
            return new Array(1280).fill(0);
        }
    }
    
    // 검색 이미지 처리
    async processSearchImage(file) {
        if (!this.models.isReady) {
            alert('AI 모델이 아직 로드 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        
        this.currentSearchFile = file.name;
        console.log('🔍 검색 파일:', this.currentSearchFile);
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                document.getElementById('previewImage').src = e.target.result;
                document.getElementById('previewContainer').style.display = 'block';
                
                this.updateStatus('🔍 유사 이미지 검색 중...');
                
                try {
                    const features = await this.extractFeatures(img);
                    await this.searchSimilar(features);
                    this.metrics.searchCount++;
                    this.updateStatus('✅ 검색 완료');
                } catch (error) {
                    console.error('검색 오류:', error);
                    this.updateStatus('❌ 검색 실패');
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    // 유사 이미지 검색
    async searchSimilar(queryFeatures) {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            const results = [];
            
            console.log(`📚 검색 대상: ${images.length}개 이미지`);
            
            if (images.length === 0) {
                document.getElementById('results').innerHTML = '<p style="text-align:center; color:#999;">인덱싱된 이미지가 없습니다.<br>먼저 인덱싱 모드에서 이미지를 추가해주세요.</p>';
                return;
            }
            
            for (const image of images) {
                if (this.currentSearchFile && image.filename === this.currentSearchFile) {
                    continue; // 자기 자신 제외
                }
                
                if (!image.embedding || image.embedding.length === 0) {
                    continue;
                }
                
                const similarity = this.calculateSimilarity(queryFeatures, image.embedding);
                
                results.push({
                    ...image,
                    similarity: similarity
                });
            }
            
            results.sort((a, b) => b.similarity - a.similarity);
            
            // 평균 유사도 계산
            if (results.length > 0) {
                const avgSim = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
                this.metrics.avgSimilarity = (avgSim * 100).toFixed(1);
            }
            
            console.log('🏆 상위 5개 결과:');
            results.slice(0, 5).forEach((r, i) => {
                console.log(`${i+1}. ${r.filename}: ${(r.similarity * 100).toFixed(1)}%`);
            });
            
            this.displayResults(results.slice(0, 20));
        };
    }
    
    // 유사도 계산 (코사인 유사도)
    calculateSimilarity(features1, features2) {
        if (!features1 || !features2) return 0;
        
        const len = Math.min(features1.length, features2.length);
        
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        for (let i = 0; i < len; i++) {
            dotProduct += features1[i] * features2[i];
            norm1 += features1[i] * features1[i];
            norm2 += features2[i] * features2[i];
        }
        
        norm1 = Math.sqrt(norm1);
        norm2 = Math.sqrt(norm2);
        
        if (norm1 === 0 || norm2 === 0) return 0;
        
        return dotProduct / (norm1 * norm2);
    }
    
    // 결과 표시
    displayResults(results) {
        const resultsDiv = document.getElementById('results');
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<p style="text-align:center; color:#999;">검색 결과가 없습니다.</p>';
            return;
        }
        
        resultsDiv.innerHTML = results.map((item, index) => {
            const score = (item.similarity * 100).toFixed(1);
            
            let scoreColor = '#4caf50';
            if (score < 70) scoreColor = '#ff9800';
            if (score < 50) scoreColor = '#f44336';
            
            return `
                <div style="border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); background: white;">
                    <img src="${item.path}" style="width: 100%; height: 200px; object-fit: cover;">
                    <div style="padding: 12px;">
                        <div style="font-size: 20px; font-weight: bold; color: ${scoreColor};">${score}%</div>
                        <div style="font-size: 12px; color: #666; margin-top: 5px;">${item.filename}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // 파일 인덱싱 (웹 모드)
    async indexFiles(files) {
        if (!this.models.isReady) {
            alert('AI 모델이 아직 로드 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        
        this.updateProgressLog(`🔄 인덱싱 시작: ${files.length}개 파일`);
        
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                await this.processFile(file);
                successCount++;
                this.metrics.indexedCount++;
                this.updateProgressLog(`✅ ${file.name}`);
            } catch (error) {
                console.error(`실패: ${file.name}`, error);
                failCount++;
                this.updateProgressLog(`❌ ${file.name}`);
            }
        }
        
        this.updateProgressLog(`\n✅ 인덱싱 완료!\n성공: ${successCount}개\n실패: ${failCount}개`);
        this.updateStatus(`✅ ${successCount}개 이미지 인덱싱 완료`);
    }
    
    // 파일 처리
    async processFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const img = new Image();
                img.onload = async () => {
                    try {
                        const embedding = await this.extractFeatures(img);
                        
                        const imageData = {
                            filename: file.name,
                            path: e.target.result,
                            embedding: embedding,
                            indexed: new Date().toISOString()
                        };
                        
                        await this.saveImageToDB(imageData);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    // DB 관리
    async saveImageToDB(imageData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.add(imageData);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async clearDB() {
        const transaction = this.db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        await store.clear();
        
        this.metrics.indexedCount = 0;
        this.metrics.searchCount = 0;
        this.metrics.avgSimilarity = 0;
    }
    
    async validateDB() {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            const output = document.getElementById('debugOutput');
            
            let report = `=== DB 검증 결과 ===\n`;
            report += `총 이미지: ${images.length}개\n`;
            report += `DB 이름: ${this.dbName}\n`;
            report += `앱 버전: ${this.version}\n\n`;
            
            report += `=== 성능 메트릭 ===\n`;
            report += `인덱싱된 이미지: ${this.metrics.indexedCount}개\n`;
            report += `검색 횟수: ${this.metrics.searchCount}회\n`;
            report += `평균 유사도: ${this.metrics.avgSimilarity}%\n\n`;
            
            if (images.length > 0) {
                report += `=== 최근 5개 이미지 ===\n`;
                images.slice(-5).forEach((img, i) => {
                    report += `${i+1}. ${img.filename}\n`;
                    report += `   - 인덱싱: ${img.indexed}\n`;
                    report += `   - 특징: ${img.embedding ? img.embedding.length : 0}차원\n`;
                });
            }
            
            output.textContent = report;
        };
    }
}

// 앱 시작
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOMContentLoaded - App 시작');
    
    try {
        window.app = new AdvancedFashionSearchApp();
        console.log('✅ App 생성 성공');
    } catch (error) {
        console.error('❌ App 생성 실패:', error);
        document.body.innerHTML = `
            <div style="padding: 20px; color: red;">
                <h2>❌ 앱 로딩 실패</h2>
                <p>에러: ${error.message}</p>
                <p>콘솔(F12)에서 자세한 내용을 확인하세요.</p>
            </div>
        `;
    }
});

console.log('✅ main_v21.2_stable.js 로드 완료');
