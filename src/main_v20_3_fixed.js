// Fashion Image Search v20.3 - Fixed Folder & Dual Model
// 폴더 선택 버그 수정 및 듀얼 모델 시스템
// 2025-01-03

console.log('🚀 Fashion Search v20.3 - Fixed & Enhanced');

class LuxuryFashionSearchApp {
    constructor() {
        console.log('📱 App constructor 시작');
        this.version = 'v20.3.0-FIXED-ENHANCED';
        this.dbName = 'fashionSearchDB_v20_3';
        this.db = null;
        this.currentMode = 'search';
        this.currentSearchFile = null;
        this.models = {
            mobileNet: null,
            efficientNet: null,
            activeModel: 'standard',
            highAccuracyAvailable: false
        };
        this.isReady = false;
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
            this.updateStatus('🔄 AI 모델 로딩 중...');
            
            // 5. 모델 로드
            await this.loadModels();
            
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
                    store.createIndex('indexed', 'indexed', { unique: false });
                    store.createIndex('modelType', 'modelType', { unique: false });
                }
            };
        });
    }
    
    async loadModels() {
        try {
            console.log('🤖 AI 모델 로딩 시작...');
            
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
            
            // 표준 모델: MobileNet 로드
            await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js');
            this.models.mobileNet = await mobilenet.load({
                version: 2,
                alpha: 1.0
            });
            console.log('✅ MobileNet v2 (표준 모델) 로드 완료');
            
            this.isReady = true;
            this.updateStatus('✅ 표준 모델 준비 완료! 고정확도 모델 로딩 중...');
            
            // 고정확도 모델 백그라운드 로드
            this.loadHighAccuracyModel();
            
        } catch (error) {
            console.error('❌ 모델 로딩 실패:', error);
            this.updateStatus('⚠️ AI 모델 로딩 실패. 기본 기능만 사용 가능합니다.');
        }
    }
    
    async loadHighAccuracyModel() {
        try {
            console.log('🔄 고정확도 모델 로딩 시도...');
            
            // MobileNet v2 alpha=1.4 (140% 크기, 더 정확)
            this.models.efficientNet = await mobilenet.load({
                version: 2,
                alpha: 1.4  // 더 큰 모델
            });
            
            this.models.highAccuracyAvailable = true;
            console.log('✅ 고정확도 모델 (MobileNet v2 alpha=1.4) 로드 완료');
            this.updateStatus('✅ 모든 모델 준비 완료! 표준/고정확도 모드 사용 가능');
            this.updateModelToggle();
            
        } catch (error) {
            console.log('⚠️ 고정확도 모델 로드 실패:', error);
            this.models.highAccuracyAvailable = false;
        }
    }
    
    updateModelToggle() {
        const toggleBtn = document.getElementById('modelToggleBtn');
        if (toggleBtn) {
            if (this.models.highAccuracyAvailable) {
                toggleBtn.style.display = 'inline-block';
                toggleBtn.disabled = false;
                toggleBtn.textContent = this.models.activeModel === 'high' 
                    ? '🚀 고정확도 모드 ON' 
                    : '⚡ 표준 모드 ON';
            } else {
                toggleBtn.style.display = 'none';
            }
        }
    }
    
    toggleModel() {
        if (!this.models.highAccuracyAvailable) return;
        
        this.models.activeModel = this.models.activeModel === 'standard' ? 'high' : 'standard';
        this.updateModelToggle();
        
        const modelName = this.models.activeModel === 'high' ? '고정확도 모드' : '표준 모드';
        this.updateStatus(`✅ ${modelName} 활성화됨`);
        console.log(`모델 전환: ${this.models.activeModel}`);
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
    
    setupUI() {
        console.log('🎨 UI 생성 중...');
        
        // 기존 로딩 메시지 제거
        document.body.innerHTML = '';
        
        const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
                <div style="background: white; border-radius: 20px; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                    <h1 style="text-align: center; color: #333; margin-bottom: 10px;">🎯 Fashion Image Search v20.3</h1>
                    <p id="status" style="text-align: center; color: #666; font-size: 14px;">초기화 중...</p>
                    
                    <!-- 모델 토글 버튼 -->
                    <div style="text-align: center; margin: 10px 0;">
                        <button id="modelToggleBtn" onclick="app.toggleModel()" style="display: none; padding: 10px 20px; border: none; border-radius: 20px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; font-weight: bold; cursor: pointer; font-size: 14px;">
                            ⚡ 표준 모드 ON
                        </button>
                    </div>
                    
                    <!-- 모드 버튼 -->
                    <div style="text-align: center; margin: 20px 0;">
                        <button class="mode-btn active" data-mode="search" style="padding: 12px 24px; margin: 0 5px; cursor: pointer; border: 2px solid #667eea; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 25px; font-size: 16px; font-weight: 500;">
                            🔍 검색 모드
                        </button>
                        <button class="mode-btn" data-mode="index" style="padding: 12px 24px; margin: 0 5px; cursor: pointer; border: 2px solid #667eea; background: white; color: #667eea; border-radius: 25px; font-size: 16px; font-weight: 500;">
                            📁 인덱싱 모드
                        </button>
                        <button class="mode-btn" data-mode="debug" style="padding: 12px 24px; margin: 0 5px; cursor: pointer; border: 2px solid #667eea; background: white; color: #667eea; border-radius: 25px; font-size: 16px; font-weight: 500;">
                            ⚙️ 설정
                        </button>
                    </div>
                    
                    <!-- 검색 모드 -->
                    <div id="searchMode" class="mode-content" style="background: #f8f9ff; border-radius: 15px; padding: 30px; margin: 20px 0;">
                        <h2 style="color: #333; margin-bottom: 20px;">🔍 검색 모드</h2>
                        <div style="border: 3px dashed #667eea; border-radius: 15px; padding: 60px 20px; text-align: center; cursor: pointer; background: white; transition: all 0.3s;" id="uploadArea">
                            <p style="color: #667eea; font-size: 18px; margin: 0;">🖼️ 이미지를 드래그하거나 클릭하여 선택하세요</p>
                            <input type="file" id="fileInput" accept="image/*" style="display:none">
                        </div>
                        <div id="previewContainer" style="display: none; margin-top: 20px; text-align: center;">
                            <img id="previewImage" style="max-width: 400px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                            <div id="searchStatus" style="margin-top: 10px; color: #666;"></div>
                        </div>
                        <div id="results" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-top: 30px;"></div>
                    </div>
                    
                    <!-- 인덱싱 모드 -->
                    <div id="indexMode" class="mode-content" style="display:none; background: #f8f9ff; border-radius: 15px; padding: 30px; margin: 20px 0;">
                        <h2 style="color: #333; margin-bottom: 20px;">📁 인덱싱 모드</h2>
                        <div style="text-align: center;">
                            <button id="selectFilesBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                🖼️ 이미지 파일 선택
                            </button>
                            <button id="selectFolderBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: white; color: #667eea; border: 2px solid #667eea; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                📂 폴더 선택
                            </button>
                            <button id="clearDBBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                🗑️ DB 초기화
                            </button>
                        </div>
                        
                        <div id="dropZone" style="margin-top: 20px; border: 3px dashed #667eea; border-radius: 15px; padding: 40px 20px; text-align: center; background: white;">
                            <h3 style="color: #667eea; margin: 0 0 10px 0;">📥 파일 드래그 & 드롭</h3>
                            <p style="color: #999; margin: 0;">여러 이미지를 여기에 드래그하세요</p>
                        </div>
                        
                        <div id="indexingProgress" style="margin-top: 20px; padding: 20px; background: white; border-radius: 10px; min-height: 100px; text-align: center;"></div>
                    </div>
                    
                    <!-- 디버그 모드 -->
                    <div id="debugMode" class="mode-content" style="display:none; background: #f8f9ff; border-radius: 15px; padding: 30px; margin: 20px 0;">
                        <h2 style="color: #333; margin-bottom: 20px;">⚙️ 설정 및 디버그</h2>
                        <div style="text-align: center;">
                            <button id="validateDBBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                ✔️ DB 검증
                            </button>
                            <button id="reindexBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: white; color: #667eea; border: 2px solid #667eea; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                🔄 재인덱싱 (모델 변경 시)
                            </button>
                            <button id="reinitBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                💣 완전 초기화
                            </button>
                        </div>
                        <div id="debugOutput" style="margin-top: 20px; padding: 20px; background: white; border-radius: 10px; font-family: monospace; white-space: pre-wrap; max-height: 400px; overflow-y: auto; font-size: 13px; line-height: 1.5;"></div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.innerHTML = html;
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        console.log('✅ HTML 삽입 완료');
    }
    
    attachEventListeners() {
        console.log('🔗 이벤트 리스너 연결 중...');
        
        // 모드 전환
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('모드 버튼 클릭:', e.target.dataset.mode);
                
                // 버튼 스타일 변경
                document.querySelectorAll('.mode-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'white';
                    b.style.color = '#667eea';
                });
                e.target.classList.add('active');
                e.target.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                e.target.style.color = 'white';
                
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
        
        // 파일 업로드 (검색)
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        if (uploadArea && fileInput) {
            // 클릭 이벤트
            uploadArea.addEventListener('click', () => {
                console.log('업로드 영역 클릭');
                fileInput.click();
            });
            
            // 파일 선택 이벤트
            fileInput.addEventListener('change', (e) => {
                console.log('파일 선택됨:', e.target.files);
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
        
        // 인덱싱 파일 선택
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
                    if (files.length > 0) {
                        this.indexFiles(files);
                    }
                };
                input.click();
            });
        }
        
        // 폴더 선택 - 디버깅 강화
        const selectFolderBtn = document.getElementById('selectFolderBtn');
        if (selectFolderBtn) {
            selectFolderBtn.addEventListener('click', () => {
                console.log('📂 폴더 선택 버튼 클릭됨');
                
                const input = document.createElement('input');
                input.type = 'file';
                input.webkitdirectory = true;
                input.directory = true;
                input.multiple = true;
                
                // 디버깅을 위한 속성 확인
                console.log('Input 속성:', {
                    webkitdirectory: input.webkitdirectory,
                    directory: input.directory,
                    multiple: input.multiple
                });
                
                input.addEventListener('change', (e) => {
                    console.log('📁 폴더 선택 change 이벤트 발생');
                    console.log('Event:', e);
                    console.log('Files:', e.target.files);
                    
                    const allFiles = Array.from(e.target.files);
                    console.log(`전체 파일 수: ${allFiles.length}`);
                    
                    if (allFiles.length === 0) {
                        console.log('⚠️ 선택된 파일이 없습니다');
                        return;
                    }
                    
                    // 이미지 파일 필터링 - 더 자세한 로그
                    const imageFiles = allFiles.filter(f => {
                        const isImage = f.type.startsWith('image/') || 
                                       /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(f.name);
                        
                        console.log(`파일: ${f.name}, MIME: ${f.type}, 이미지여부: ${isImage}`);
                        
                        return isImage;
                    });
                    
                    console.log(`✅ 이미지 파일 수: ${imageFiles.length}`);
                    
                    if (imageFiles.length > 0) {
                        const confirmMsg = `${imageFiles.length}개의 이미지를 발견했습니다.\n인덱싱을 시작하시겠습니까?`;
                        if (confirm(confirmMsg)) {
                            console.log('인덱싱 시작...');
                            this.indexFiles(imageFiles);
                        }
                    } else {
                        alert('선택한 폴더에 이미지 파일이 없습니다.');
                    }
                });
                
                // 클릭 이벤트 발생
                console.log('📂 파일 선택 다이얼로그 열기');
                input.click();
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
        
        // DB 초기화
        const clearDBBtn = document.getElementById('clearDBBtn');
        if (clearDBBtn) {
            clearDBBtn.addEventListener('click', async () => {
                if (confirm('정말로 DB를 초기화하시겠습니까? 모든 인덱싱된 이미지가 삭제됩니다.')) {
                    await this.clearDB();
                    document.getElementById('indexingProgress').innerHTML = '<p style="color: green;">✅ DB가 초기화되었습니다.</p>';
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
        
        // 재인덱싱
        const reindexBtn = document.getElementById('reindexBtn');
        if (reindexBtn) {
            reindexBtn.addEventListener('click', async () => {
                const transaction = this.db.transaction(['images'], 'readonly');
                const store = transaction.objectStore('images');
                const request = store.getAll();
                
                request.onsuccess = () => {
                    const images = request.result;
                    if (images.length === 0) {
                        alert('재인덱싱할 이미지가 없습니다.');
                        return;
                    }
                    
                    if (confirm(`${images.length}개의 이미지를 다시 인덱싱하시겠습니까? (현재 모델: ${this.models.activeModel})`)) {
                        this.reindexImages(images);
                    }
                };
            });
        }
        
        // 완전 초기화
        const reinitBtn = document.getElementById('reinitBtn');
        if (reinitBtn) {
            reinitBtn.addEventListener('click', () => {
                if (confirm('완전 초기화를 진행하시겠습니까? 모든 데이터가 삭제되고 페이지가 새로고침됩니다.')) {
                    indexedDB.deleteDatabase(this.dbName);
                    location.reload();
                }
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
    
    // 이미지 특징 추출 - 다중 스케일 지원
    async extractFeatures(imageElement) {
        const activeModel = this.models.activeModel === 'high' && this.models.efficientNet 
            ? this.models.efficientNet 
            : this.models.mobileNet;
            
        if (!activeModel) {
            console.warn('모델이 로드되지 않았습니다.');
            return new Array(1286).fill(0);
        }
        
        try {
            // 다중 스케일 특징 추출 (고정확도 모드에서만)
            let mobileNetFeatures;
            
            if (this.models.activeModel === 'high') {
                // 224px와 256px 두 스케일에서 특징 추출
                const canvas224 = document.createElement('canvas');
                const ctx224 = canvas224.getContext('2d');
                canvas224.width = 224;
                canvas224.height = 224;
                ctx224.drawImage(imageElement, 0, 0, 224, 224);
                
                const canvas256 = document.createElement('canvas');
                const ctx256 = canvas256.getContext('2d');
                canvas256.width = 256;
                canvas256.height = 256;
                ctx256.drawImage(imageElement, 0, 0, 256, 256);
                
                const features224 = activeModel.infer(canvas224, true);
                const features256 = activeModel.infer(canvas256, true);
                
                const array224 = await features224.array();
                const array256 = await features256.array();
                
                features224.dispose();
                features256.dispose();
                
                // 가중 평균 (60:40)
                mobileNetFeatures = array224[0].map((val, i) => 
                    val * 0.6 + array256[0][i] * 0.4
                );
            } else {
                // 표준 모드: 단일 스케일
                const embeddings = activeModel.infer(imageElement, true);
                const array = await embeddings.array();
                embeddings.dispose();
                mobileNetFeatures = array[0];
            }
            
            // 색상 특징 추출
            const colorFeatures = await this.extractColorFeatures(imageElement);
            
            // 특징 결합 (1280 + 6 = 1286)
            const features = [...mobileNetFeatures, ...colorFeatures];
            
            return features;
            
        } catch (error) {
            console.error('특징 추출 실패:', error);
            return new Array(1286).fill(0);
        }
    }
    
    // 색상 특징 추출 - 개선된 버전
    async extractColorFeatures(imageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(imageElement, 0, 0, 100, 100);
        
        const imageData = ctx.getImageData(0, 0, 100, 100);
        const data = imageData.data;
        
        let totalR = 0, totalG = 0, totalB = 0;
        let isDark = 0, isBrown = 0, isWhite = 0;
        
        const pixelCount = data.length / 4;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            totalR += r;
            totalG += g;
            totalB += b;
            
            // 색상 카테고리 판별 - 개선된 로직
            const brightness = (r + g + b) / 3;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            
            // 검정색 판별
            if (brightness < 60) isDark++;
            
            // 흰색/베이지 판별
            if (brightness > 200 && (max - min) < 30) isWhite++;
            
            // 브라운 판별 - 더 정확한 조건
            if (r > g && g > b && r > 100 && r < 180 && (r - b) > 30) isBrown++;
        }
        
        return [
            totalR / pixelCount / 255,  // 평균 R
            totalG / pixelCount / 255,  // 평균 G
            totalB / pixelCount / 255,  // 평균 B
            isDark / pixelCount,        // 검정 비율
            isBrown / pixelCount,       // 브라운 비율
            isWhite / pixelCount        // 흰색 비율
        ];
    }
    
    // 검색 이미지 처리
    async processSearchImage(file) {
        if (!this.isReady) {
            alert('AI 모델이 아직 로드 중입니다. 잠시만 기다려주세요.');
            return;
        }
        
        this.currentSearchFile = file.name;
        console.log('🔍 검색 파일:', this.currentSearchFile);
        console.log('🤖 사용 모델:', this.models.activeModel);
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                // 미리보기 표시
                document.getElementById('previewImage').src = e.target.result;
                document.getElementById('previewContainer').style.display = 'block';
                document.getElementById('searchStatus').textContent = `🔍 ${this.models.activeModel === 'high' ? '고정확도' : '표준'} 모드로 검색 중...`;
                
                try {
                    // 특징 추출
                    const features = await this.extractFeatures(img);
                    console.log('검색 특징 추출 완료:', features.length);
                    
                    // 유사 이미지 검색
                    await this.searchSimilar(features);
                    
                    document.getElementById('searchStatus').textContent = '✅ 검색 완료';
                } catch (error) {
                    console.error('검색 오류:', error);
                    document.getElementById('searchStatus').textContent = '❌ 검색 실패: ' + error.message;
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
            
            console.log(`검색 대상: ${images.length}개 이미지`);
            
            if (images.length === 0) {
                document.getElementById('results').innerHTML = '<p style="text-align:center; color:#999;">인덱싱된 이미지가 없습니다. 먼저 이미지를 인덱싱하세요.</p>';
                return;
            }
            
            for (const image of images) {
                // 자기 자신 제외
                if (this.currentSearchFile && image.filename === this.currentSearchFile) {
                    console.log(`자기 자신 제외: ${image.filename}`);
                    continue;
                }
                
                if (!image.embedding || image.embedding.length === 0) {
                    continue;
                }
                
                // 유사도 계산
                const similarity = this.calculateSimilarity(queryFeatures, image.embedding);
                
                results.push({
                    ...image,
                    similarity: similarity
                });
            }
            
            // 유사도 순으로 정렬
            results.sort((a, b) => b.similarity - a.similarity);
            
            console.log('=== 상위 5개 결과 ===');
            results.slice(0, 5).forEach((r, i) => {
                console.log(`${i+1}. ${r.filename}: ${(r.similarity * 100).toFixed(1)}%`);
            });
            
            // 결과 표시
            this.displayResults(results.slice(0, 20));
        };
    }
    
    // 유사도 계산 - 개선된 버전
    calculateSimilarity(features1, features2) {
        if (!features1 || !features2) return 0;
        
        const len = Math.min(features1.length, features2.length);
        
        // 코사인 유사도 계산
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        // MobileNet 특징 (0-1280)
        for (let i = 0; i < Math.min(1280, len); i++) {
            dotProduct += features1[i] * features2[i];
            norm1 += features1[i] * features1[i];
            norm2 += features2[i] * features2[i];
        }
        
        let mobileNetSim = 0;
        if (norm1 > 0 && norm2 > 0) {
            mobileNetSim = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        }
        
        // 색상 유사도 (1280-1286)
        let colorSim = 0;
        if (len > 1280) {
            let colorDot = 0;
            let colorNorm1 = 0;
            let colorNorm2 = 0;
            
            for (let i = 1280; i < Math.min(1286, len); i++) {
                colorDot += features1[i] * features2[i];
                colorNorm1 += features1[i] * features1[i];
                colorNorm2 += features2[i] * features2[i];
            }
            
            if (colorNorm1 > 0 && colorNorm2 > 0) {
                colorSim = colorDot / (Math.sqrt(colorNorm1) * Math.sqrt(colorNorm2));
            }
        }
        
        // 가중 평균 (형태 70%, 색상 30%)
        let finalSim = mobileNetSim * 0.7 + colorSim * 0.3;
        
        // 색상 보너스/페널티
        if (len >= 1285) {
            const brown1 = features1[1284];
            const brown2 = features2[1284];
            const black1 = features1[1283];
            const black2 = features2[1283];
            
            // 같은 색상 계열이면 보너스
            if (brown1 > 0.2 && brown2 > 0.2) {
                finalSim = Math.min(1, finalSim * 1.1);  // 브라운 매치
            } else if (black1 > 0.3 && black2 > 0.3) {
                finalSim = Math.min(1, finalSim * 1.1);  // 블랙 매치
            }
            // 다른 색상이면 페널티
            else if ((brown1 > 0.2 && black2 > 0.3) || (black1 > 0.3 && brown2 > 0.2)) {
                finalSim = finalSim * 0.9;  // 색상 불일치
            }
        }
        
        return Math.max(0, Math.min(1, finalSim));
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
            
            let rankColor = '#4caf50';
            if (index >= 3) rankColor = '#ff9800';
            if (index >= 10) rankColor = '#9e9e9e';
            
            const scoreColor = score >= 70 ? '#4caf50' : score >= 50 ? '#ff9800' : '#f44336';
            
            return `
                <div style="position: relative; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); background: white; border: 1px solid #eee;">
                    <div style="position: absolute; top: 10px; left: 10px; background: ${rankColor}; color: white; padding: 5px 10px; border-radius: 20px; font-weight: bold; font-size: 12px; z-index: 1;">
                        #${index + 1}
                    </div>
                    ${item.modelType ? `<div style="position: absolute; top: 10px; right: 10px; background: ${item.modelType === 'high' ? '#f093fb' : '#667eea'}; color: white; padding: 3px 8px; border-radius: 10px; font-size: 10px; z-index: 1;">
                        ${item.modelType === 'high' ? 'HD' : 'SD'}
                    </div>` : ''}
                    <img src="${item.path}" style="width: 100%; height: 200px; object-fit: cover; display: block;">
                    <div style="padding: 12px;">
                        <div style="font-size: 20px; font-weight: bold; color: ${scoreColor};">${score}%</div>
                        <div style="font-size: 12px; color: #666; margin-top: 5px;">${item.filename}</div>
                        <div style="height: 4px; background: #e0e0e0; border-radius: 2px; overflow: hidden; margin-top: 8px;">
                            <div style="height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); width: ${score}%;"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // 파일 인덱싱
    async indexFiles(files) {
        if (!this.isReady) {
            alert('AI 모델이 아직 로드 중입니다. 잠시만 기다려주세요.');
            return;
        }
        
        const progressDiv = document.getElementById('indexingProgress');
        const startTime = Date.now();
        
        progressDiv.innerHTML = `
            <h3>🔄 인덱싱 준비 중...</h3>
            <p>총 ${files.length}개 파일</p>
            <p>모델: ${this.models.activeModel === 'high' ? '고정확도' : '표준'}</p>
        `;
        
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = ((i + 1) / files.length * 100).toFixed(1);
            
            progressDiv.innerHTML = `
                <h3>🔄 인덱싱 진행 중... (${i + 1}/${files.length})</h3>
                <p>현재 파일: ${file.name}</p>
                <p>모델: ${this.models.activeModel === 'high' ? '고정확도' : '표준'}</p>
                <div style="width: 100%; background: #e0e0e0; border-radius: 10px; overflow: hidden; margin-top: 10px;">
                    <div style="width: ${progress}%; background: linear-gradient(90deg, #667eea, #764ba2); height: 20px;"></div>
                </div>
                <p style="margin-top: 10px; font-size: 12px;">성공: ${successCount} | 실패: ${failCount}</p>
            `;
            
            try {
                await this.processFile(file);
                successCount++;
            } catch (error) {
                console.error(`파일 처리 실패 (${file.name}):`, error);
                failCount++;
            }
            
            // 약간의 딜레이 (UI 업데이트)
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
        
        progressDiv.innerHTML = `
            <h3>✅ 인덱싱 완료!</h3>
            <p>성공: ${successCount}개 | 실패: ${failCount}개</p>
            <p>소요 시간: ${elapsedTime}초</p>
            <p>사용 모델: ${this.models.activeModel === 'high' ? '고정확도' : '표준'}</p>
        `;
    }
    
    // 파일 처리
    async processFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const img = new Image();
                img.onload = async () => {
                    try {
                        // 특징 추출
                        const embedding = await this.extractFeatures(img);
                        
                        // DB에 저장
                        const imageData = {
                            filename: file.name,
                            path: e.target.result,
                            embedding: embedding,
                            indexed: new Date().toISOString(),
                            modelType: this.models.activeModel
                        };
                        
                        await this.saveImageToDB(imageData);
                        console.log(`✅ ${file.name} 인덱싱 완료 (${this.models.activeModel})`);
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
    
    // 재인덱싱
    async reindexImages(images) {
        const progressDiv = document.getElementById('debugOutput');
        progressDiv.textContent = '재인덱싱 중...';
        
        // 기존 DB 클리어
        await this.clearDB();
        
        // 파일 객체로 변환하여 재인덱싱
        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            progressDiv.textContent = `재인덱싱 중... (${i + 1}/${images.length})\n${image.filename}`;
            
            // dataURL을 이미지로 변환
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = async () => {
                    try {
                        const embedding = await this.extractFeatures(img);
                        const imageData = {
                            filename: image.filename,
                            path: image.path,
                            embedding: embedding,
                            indexed: new Date().toISOString(),
                            modelType: this.models.activeModel
                        };
                        await this.saveImageToDB(imageData);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                };
                img.src = image.path;
            });
        }
        
        progressDiv.textContent = `✅ 재인덱싱 완료! (${images.length}개 이미지, 모델: ${this.models.activeModel})`;
    }
    
    // DB에 이미지 저장
    async saveImageToDB(imageData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.add(imageData);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    // DB 초기화
    async clearDB() {
        const transaction = this.db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        await store.clear();
    }
    
    // DB 검증
    async validateDB() {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            const output = document.getElementById('debugOutput');
            
            let report = `=== DB 검증 결과 ===\n`;
            report += `총 이미지 수: ${images.length}개\n`;
            report += `DB 이름: ${this.dbName}\n`;
            report += `앱 버전: ${this.version}\n`;
            report += `현재 활성 모델: ${this.models.activeModel}\n`;
            report += `고정확도 모델 사용 가능: ${this.models.highAccuracyAvailable ? '예' : '아니오'}\n\n`;
            
            if (images.length > 0) {
                // 모델별 통계
                const modelStats = {};
                images.forEach(img => {
                    const model = img.modelType || 'unknown';
                    modelStats[model] = (modelStats[model] || 0) + 1;
                });
                
                report += `=== 모델별 인덱싱 분포 ===\n`;
                Object.entries(modelStats).forEach(([model, count]) => {
                    report += `${model}: ${count}개\n`;
                });
                
                report += `\n=== 최근 5개 이미지 ===\n`;
                images.slice(-5).forEach((img, i) => {
                    report += `${i+1}. ${img.filename}\n`;
                    report += `   - 인덱싱: ${img.indexed}\n`;
                    report += `   - 특징 벡터: ${img.embedding ? img.embedding.length : 0}차원\n`;
                    report += `   - 모델: ${img.modelType || 'unknown'}\n`;
                });
            }
            
            output.textContent = report;
        };
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

console.log('✅ main.js (v20.3) 로드 완료');
