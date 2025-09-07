// Fashion Image Search v21 - Advanced AI Models
// 고성능 모델 + Tauri 파일 시스템 통합
// 2025-01-03

console.log('🚀 Fashion Search v21 - Advanced AI Models');

class AdvancedFashionSearchApp {
    constructor() {
        console.log('📱 Advanced App 시작');
        this.version = 'v21.0.0-ADVANCED';
        this.dbName = 'fashionSearchDB_v21';
        this.db = null;
        this.currentMode = 'search';
        this.currentSearchFile = null;
        
        // 멀티 모델 시스템
        this.models = {
            mobileNet: null,
            efficientNet: null,
            activeModel: 'hybrid', // 'standard', 'advanced', 'hybrid'
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
        if (window.__TAURI__) {
            console.log('✅ Tauri API 사용 가능');
            this.hasTauri = true;
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
                
                // 이미지 스토어
                if (!db.objectStoreNames.contains('images')) {
                    const store = db.createObjectStore('images', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    store.createIndex('filename', 'filename', { unique: false });
                    store.createIndex('indexed', 'indexed', { unique: false });
                    store.createIndex('brand', 'brand', { unique: false });
                }
                
                // 메타데이터 스토어
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
            
            // MobileNet v3 로드 (기본 모델)
            await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js');
            this.models.mobileNet = await mobilenet.load({
                version: 2,
                alpha: 1.0
            });
            console.log('✅ MobileNet v2 로드 완료');
            
            // EfficientNet-Lite 시뮬레이션 (실제로는 MobileNet v2의 다중 스케일 특징 사용)
            // 실제 EfficientNet을 사용하려면 TFJS 모델 변환이 필요
            this.models.efficientNet = {
                extractFeatures: async (img) => {
                    // 다중 스케일 특징 추출 시뮬레이션
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
                    
                    // 특징 융합 (평균)
                    const fusedFeatures = features[0].map((_, i) => {
                        return features.reduce((sum, f) => sum + f[i], 0) / features.length;
                    });
                    
                    return fusedFeatures;
                }
            };
            console.log('✅ EfficientNet 시뮬레이션 준비 완료');
            
            this.models.isReady = true;
            this.updateStatus('✅ 고성능 AI 모델 준비 완료! (MobileNet + Multi-Scale)');
            
            // 모델 정보 표시
            this.displayModelInfo();
            
        } catch (error) {
            console.error('❌ 모델 로딩 실패:', error);
            this.updateStatus('⚠️ AI 모델 로딩 실패. 기본 기능만 사용 가능합니다.');
        }
    }
    
    displayModelInfo() {
        const modelInfo = document.getElementById('modelInfo');
        if (modelInfo) {
            modelInfo.innerHTML = `
                <div style="padding: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; font-size: 12px;">
                    <strong>활성 모델:</strong> ${this.models.activeModel === 'hybrid' ? 'Hybrid (MobileNet + Multi-Scale)' : 
                                                    this.models.activeModel === 'advanced' ? 'Advanced (Multi-Scale)' : 
                                                    'Standard (MobileNet)'}
                    <br>
                    <strong>특징 차원:</strong> ${this.models.activeModel === 'hybrid' ? '1286 + 패턴' : '1286'}
                    <br>
                    <strong>GPU 가속:</strong> ${tf.getBackend() === 'webgl' ? '활성화 ✓' : '비활성화'}
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
        console.log('🎨 Advanced UI 생성 중...');
        
        document.body.innerHTML = '';
        
        const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 1400px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
                <div style="background: white; border-radius: 20px; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                    
                    <!-- 헤더 -->
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #333; margin-bottom: 10px;">
                            🚀 Advanced Fashion Search v21
                        </h1>
                        <p id="status" style="color: #666; font-size: 14px;">초기화 중...</p>
                        <div id="modelInfo" style="margin-top: 10px;"></div>
                    </div>
                    
                    <!-- 모델 선택 -->
                    <div style="text-align: center; margin: 20px 0;">
                        <button id="toggleModelBtn" style="padding: 10px 20px; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; border: none; border-radius: 25px; cursor: pointer; font-size: 14px;">
                            🔄 모델 전환 (현재: Hybrid)
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
                        <button class="mode-btn" data-mode="analytics" style="padding: 12px 24px; margin: 0 5px; cursor: pointer; border: 2px solid #667eea; background: white; color: #667eea; border-radius: 25px; font-size: 16px; font-weight: 500;">
                            📊 분석
                        </button>
                        <button class="mode-btn" data-mode="debug" style="padding: 12px 24px; margin: 0 5px; cursor: pointer; border: 2px solid #667eea; background: white; color: #667eea; border-radius: 25px; font-size: 16px; font-weight: 500;">
                            ⚙️ 설정
                        </button>
                    </div>
                    
                    <!-- 검색 모드 -->
                    <div id="searchMode" class="mode-content" style="background: #f8f9ff; border-radius: 15px; padding: 30px; margin: 20px 0;">
                        <h2 style="color: #333; margin-bottom: 20px;">🔍 고급 검색 모드</h2>
                        <div style="border: 3px dashed #667eea; border-radius: 15px; padding: 60px 20px; text-align: center; cursor: pointer; background: white; transition: all 0.3s;" id="uploadArea">
                            <p style="color: #667eea; font-size: 18px; margin: 0;">🖼️ 이미지를 드래그하거나 클릭하여 선택</p>
                            <p style="color: #999; font-size: 12px; margin-top: 10px;">지원: JPG, PNG, WEBP</p>
                            <input type="file" id="fileInput" accept="image/*" style="display:none">
                        </div>
                        <div id="previewContainer" style="display: none; margin-top: 20px;">
                            <div style="display: flex; gap: 20px;">
                                <div style="flex: 1;">
                                    <h3>검색 이미지</h3>
                                    <img id="previewImage" style="width: 100%; max-width: 400px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                                    <div id="searchInfo" style="margin-top: 10px; padding: 10px; background: white; border-radius: 5px; font-size: 12px;"></div>
                                </div>
                                <div style="flex: 1;">
                                    <h3>특징 분석</h3>
                                    <canvas id="featureCanvas" width="300" height="200" style="background: white; border-radius: 5px;"></canvas>
                                </div>
                            </div>
                        </div>
                        <div id="results" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; margin-top: 30px;"></div>
                    </div>
                    
                    <!-- 인덱싱 모드 -->
                    <div id="indexMode" class="mode-content" style="display:none; background: #f8f9ff; border-radius: 15px; padding: 30px; margin: 20px 0;">
                        <h2 style="color: #333; margin-bottom: 20px;">📁 고급 인덱싱 모드</h2>
                        
                        <div style="text-align: center;">
                            <button id="selectFilesBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                🖼️ 파일 선택
                            </button>
                            <button id="selectFolderTauriBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: linear-gradient(135deg, #48c774 0%, #3ec46d 100%); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                📂 폴더 선택 (Tauri)
                            </button>
                            <button id="batchProcessBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                🚀 배치 처리
                            </button>
                            <button id="clearDBBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                🗑️ DB 초기화
                            </button>
                        </div>
                        
                        <div id="dropZone" style="margin-top: 20px; border: 3px dashed #667eea; border-radius: 15px; padding: 40px 20px; text-align: center; background: white;">
                            <h3 style="color: #667eea; margin: 0 0 10px 0;">📥 드래그 & 드롭</h3>
                            <p style="color: #999; margin: 0;">여러 이미지를 여기에 드래그하세요</p>
                        </div>
                        
                        <div id="indexingProgress" style="margin-top: 20px;">
                            <div id="progressStats" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
                                <div style="background: white; padding: 15px; border-radius: 10px; text-align: center;">
                                    <div style="font-size: 24px; font-weight: bold; color: #667eea;">0</div>
                                    <div style="font-size: 12px; color: #999;">전체</div>
                                </div>
                                <div style="background: white; padding: 15px; border-radius: 10px; text-align: center;">
                                    <div style="font-size: 24px; font-weight: bold; color: #48c774;">0</div>
                                    <div style="font-size: 12px; color: #999;">성공</div>
                                </div>
                                <div style="background: white; padding: 15px; border-radius: 10px; text-align: center;">
                                    <div style="font-size: 24px; font-weight: bold; color: #ff6b6b;">0</div>
                                    <div style="font-size: 12px; color: #999;">실패</div>
                                </div>
                                <div style="background: white; padding: 15px; border-radius: 10px; text-align: center;">
                                    <div style="font-size: 24px; font-weight: bold; color: #f093fb;">0%</div>
                                    <div style="font-size: 12px; color: #999;">진행률</div>
                                </div>
                            </div>
                            <div id="progressBar" style="background: #e0e0e0; border-radius: 10px; overflow: hidden; height: 30px;">
                                <div id="progressFill" style="width: 0%; background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; transition: width 0.3s;"></div>
                            </div>
                            <div id="progressLog" style="margin-top: 20px; padding: 20px; background: white; border-radius: 10px; max-height: 200px; overflow-y: auto; font-size: 12px; font-family: monospace;"></div>
                        </div>
                    </div>
                    
                    <!-- 분석 모드 -->
                    <div id="analyticsMode" class="mode-content" style="display:none; background: #f8f9ff; border-radius: 15px; padding: 30px; margin: 20px 0;">
                        <h2 style="color: #333; margin-bottom: 20px;">📊 성능 분석</h2>
                        <div id="analyticsContent">
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px;">
                                <div style="background: white; padding: 20px; border-radius: 10px;">
                                    <h3 style="color: #667eea; margin: 0 0 10px 0;">인덱싱 통계</h3>
                                    <div id="indexStats"></div>
                                </div>
                                <div style="background: white; padding: 20px; border-radius: 10px;">
                                    <h3 style="color: #764ba2; margin: 0 0 10px 0;">검색 성능</h3>
                                    <div id="searchStats"></div>
                                </div>
                                <div style="background: white; padding: 20px; border-radius: 10px;">
                                    <h3 style="color: #48c774; margin: 0 0 10px 0;">모델 성능</h3>
                                    <div id="modelStats"></div>
                                </div>
                            </div>
                            <div style="background: white; padding: 20px; border-radius: 10px;">
                                <h3>브랜드별 분포</h3>
                                <canvas id="brandChart" width="400" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 디버그 모드 -->
                    <div id="debugMode" class="mode-content" style="display:none; background: #f8f9ff; border-radius: 15px; padding: 30px; margin: 20px 0;">
                        <h2 style="color: #333; margin-bottom: 20px;">⚙️ 고급 설정</h2>
                        <div style="text-align: center;">
                            <button id="validateDBBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                ✔️ DB 검증
                            </button>
                            <button id="exportDBBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: linear-gradient(135deg, #48c774 0%, #3ec46d 100%); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                💾 DB 내보내기
                            </button>
                            <button id="importDBBtn" style="padding: 15px 30px; margin: 5px; cursor: pointer; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; border-radius: 25px; font-size: 16px; font-weight: 500;">
                                📥 DB 가져오기
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
        console.log('✅ Advanced UI HTML 삽입 완료');
    }
    
    attachAdvancedEventListeners() {
        console.log('🔗 Advanced 이벤트 리스너 연결 중...');
        
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
                
                const modelNames = {
                    'standard': 'Standard (MobileNet)',
                    'advanced': 'Advanced (Multi-Scale)',
                    'hybrid': 'Hybrid (Combined)'
                };
                
                toggleModelBtn.innerHTML = `🔄 모델 전환 (현재: ${modelNames[this.models.activeModel]})`;
                this.displayModelInfo();
                console.log(`모델 전환: ${this.models.activeModel}`);
            });
        }
        
        // 검색 모드 - 파일 선택
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
        
        // 인덱싱 모드 - 파일 선택
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
        
        // Tauri 폴더 선택
        const selectFolderTauriBtn = document.getElementById('selectFolderTauriBtn');
        if (selectFolderTauriBtn) {
            selectFolderTauriBtn.addEventListener('click', async () => {
                if (this.hasTauri && window.__TAURI__) {
                    try {
                        // 직접 접근 방식으로 변경
                        const dialog = window.__TAURI__.dialog;
                        const fs = window.__TAURI__.fs;
                        
                        console.log('Tauri Dialog API:', dialog);
                        console.log('Tauri FS API:', fs);
                        
                        // 폴더 선택 다이얼로그
                        const selected = await dialog.open({
                            directory: true,
                            multiple: false,
                            title: '이미지 폴더 선택'
                        });
                        
                        if (selected) {
                            console.log('선택된 폴더:', selected);
                            
                            // 폴더 내 파일 읽기
                            const entries = await fs.readDir(selected, { recursive: false });
                            
                            // 이미지 파일 필터링
                            const imageFiles = entries.filter(entry => {
                                const name = entry.name.toLowerCase();
                                return name.endsWith('.jpg') || name.endsWith('.jpeg') || 
                                       name.endsWith('.png') || name.endsWith('.webp') || 
                                       name.endsWith('.gif') || name.endsWith('.bmp');
                            });
                            
                            console.log(`이미지 파일 발견: ${imageFiles.length}개`);
                            
                            if (imageFiles.length > 0) {
                                if (confirm(`${imageFiles.length}개의 이미지를 발견했습니다. 인덱싱을 시작하시겠습니까?`)) {
                                    await this.indexTauriFiles(imageFiles, selected);
                                }
                            } else {
                                alert('선택한 폴더에 이미지 파일이 없습니다.');
                            }
                        }
                    } catch (error) {
                        console.error('Tauri 폴더 선택 오류:', error);
                        console.error('에러 스택:', error.stack);
                        alert('폴더 선택 중 오류가 발생했습니다: ' + error.message);
                    }
                } else {
                    // 웹 폴백
                    console.log('Tauri API 없음 - 웹 폴더 선택 사용');
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.webkitdirectory = true;
                    input.directory = true;
                    input.multiple = true;
                    
                    input.onchange = (e) => {
                        const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
                        if (files.length > 0) {
                            if (confirm(`${files.length}개의 이미지를 발견했습니다. 인덱싱을 시작하시겠습니까?`)) {
                                this.indexFiles(files);
                            }
                        }
                    };
                    
                    input.click();
                }
            });
        }
        
        // 배치 처리
        const batchProcessBtn = document.getElementById('batchProcessBtn');
        if (batchProcessBtn) {
            batchProcessBtn.addEventListener('click', () => {
                this.batchReindexAll();
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
                if (confirm('정말로 DB를 초기화하시겠습니까? 모든 인덱싱된 이미지가 삭제됩니다.')) {
                    await this.clearDB();
                    this.updateProgressLog('✅ DB가 초기화되었습니다.');
                }
            });
        }
        
        const validateDBBtn = document.getElementById('validateDBBtn');
        if (validateDBBtn) {
            validateDBBtn.addEventListener('click', () => {
                this.validateDB();
            });
        }
        
        const exportDBBtn = document.getElementById('exportDBBtn');
        if (exportDBBtn) {
            exportDBBtn.addEventListener('click', () => {
                this.exportDB();
            });
        }
        
        const importDBBtn = document.getElementById('importDBBtn');
        if (importDBBtn) {
            importDBBtn.addEventListener('click', () => {
                this.importDB();
            });
        }
        
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
    
    switchMode(mode) {
        this.currentMode = mode;
        document.querySelectorAll('.mode-content').forEach(content => {
            content.style.display = 'none';
        });
        
        const modeElement = document.getElementById(mode + 'Mode');
        if (modeElement) {
            modeElement.style.display = 'block';
        }
        
        // 분석 모드 활성화 시 통계 업데이트
        if (mode === 'analytics') {
            this.updateAnalytics();
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
    
    updateProgressStats(total, success, failed, progress) {
        const statsEl = document.getElementById('progressStats');
        if (statsEl) {
            const divs = statsEl.querySelectorAll('div > div');
            if (divs[0]) divs[0].textContent = total;
            if (divs[2]) divs[2].textContent = success;
            if (divs[4]) divs[4].textContent = failed;
            if (divs[6]) divs[6].textContent = `${progress}%`;
        }
        
        const fillEl = document.getElementById('progressFill');
        if (fillEl) {
            fillEl.style.width = `${progress}%`;
        }
    }
    
    // 고급 특징 추출
    async extractAdvancedFeatures(imageElement) {
        if (!this.models.isReady) {
            console.warn('모델이 아직 준비되지 않았습니다.');
            return new Array(1286).fill(0);
        }
        
        try {
            let features = [];
            
            if (this.models.activeModel === 'standard') {
                // 표준 MobileNet
                const embeddings = this.models.mobileNet.infer(imageElement, true);
                const mobileNetFeatures = await embeddings.array();
                embeddings.dispose();
                features = mobileNetFeatures[0];
                
            } else if (this.models.activeModel === 'advanced') {
                // 다중 스케일 EfficientNet 시뮬레이션
                features = await this.models.efficientNet.extractFeatures(imageElement);
                
            } else if (this.models.activeModel === 'hybrid') {
                // 하이브리드: MobileNet + Multi-Scale
                const embeddings = this.models.mobileNet.infer(imageElement, true);
                const mobileNetFeatures = await embeddings.array();
                embeddings.dispose();
                
                const multiScaleFeatures = await this.models.efficientNet.extractFeatures(imageElement);
                
                // 특징 융합 (가중 평균)
                features = mobileNetFeatures[0].map((f, i) => 
                    f * 0.6 + multiScaleFeatures[i] * 0.4
                );
            }
            
            // 색상 특징 추가
            const colorFeatures = await this.extractColorFeatures(imageElement);
            
            // 패턴 특징 추가
            const patternFeatures = await this.extractPatternFeatures(imageElement);
            
            // 최종 특징 벡터
            return [...features, ...colorFeatures, ...patternFeatures];
            
        } catch (error) {
            console.error('특징 추출 실패:', error);
            return new Array(1286).fill(0);
        }
    }
    
    // 색상 특징 추출 (개선된 버전)
    async extractColorFeatures(imageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(imageElement, 0, 0, 100, 100);
        
        const imageData = ctx.getImageData(0, 0, 100, 100);
        const data = imageData.data;
        
        // HSV 히스토그램
        const hueHist = new Array(12).fill(0);
        const satHist = new Array(4).fill(0);
        const valHist = new Array(4).fill(0);
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            
            // RGB to HSV
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const diff = max - min;
            
            let h = 0;
            if (diff !== 0) {
                if (max === r) h = ((g - b) / diff + 6) % 6;
                else if (max === g) h = (b - r) / diff + 2;
                else h = (r - g) / diff + 4;
            }
            
            const s = max === 0 ? 0 : diff / max;
            const v = max;
            
            // 히스토그램 업데이트
            const hueIdx = Math.floor(h * 2) % 12;
            const satIdx = Math.floor(s * 4);
            const valIdx = Math.floor(v * 4);
            
            hueHist[hueIdx]++;
            satHist[satIdx]++;
            valHist[valIdx]++;
        }
        
        // 정규화
        const pixelCount = data.length / 4;
        const normalizedFeatures = [
            ...hueHist.map(h => h / pixelCount),
            ...satHist.map(s => s / pixelCount),
            ...valHist.map(v => v / pixelCount)
        ];
        
        return normalizedFeatures;
    }
    
    // 패턴 특징 추출
    async extractPatternFeatures(imageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(imageElement, 0, 0, 100, 100);
        
        const imageData = ctx.getImageData(0, 0, 100, 100);
        const data = imageData.data;
        
        // 엣지 검출 (간단한 Sobel 필터)
        let edgeCount = 0;
        for (let y = 1; y < 99; y++) {
            for (let x = 1; x < 99; x++) {
                const idx = (y * 100 + x) * 4;
                
                // 수평 그래디언트
                const gx = Math.abs(
                    data[idx - 4] - data[idx + 4]
                );
                
                // 수직 그래디언트
                const gy = Math.abs(
                    data[idx - 400] - data[idx + 400]
                );
                
                const edge = Math.sqrt(gx * gx + gy * gy);
                if (edge > 30) edgeCount++;
            }
        }
        
        // 텍스처 복잡도
        const textureComplexity = edgeCount / (98 * 98);
        
        return [textureComplexity];
    }
    
    // 검색 이미지 처리
    async processSearchImage(file) {
        if (!this.models.isReady) {
            alert('AI 모델이 아직 로드 중입니다. 잠시만 기다려주세요.');
            return;
        }
        
        this.currentSearchFile = file.name;
        console.log('🔍 검색 파일:', this.currentSearchFile);
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                // 미리보기 표시
                document.getElementById('previewImage').src = e.target.result;
                document.getElementById('previewContainer').style.display = 'block';
                
                // 검색 정보 표시
                const searchInfo = document.getElementById('searchInfo');
                if (searchInfo) {
                    searchInfo.innerHTML = `
                        <strong>파일명:</strong> ${file.name}<br>
                        <strong>크기:</strong> ${(file.size / 1024).toFixed(1)} KB<br>
                        <strong>해상도:</strong> ${img.width} × ${img.height}<br>
                        <strong>모델:</strong> ${this.models.activeModel}
                    `;
                }
                
                this.updateStatus('🔍 특징 추출 중...');
                
                try {
                    // 특징 추출
                    const features = await this.extractAdvancedFeatures(img);
                    console.log('검색 특징 추출 완료:', features.length);
                    
                    // 특징 시각화
                    this.visualizeFeatures(features);
                    
                    // 유사 이미지 검색
                    this.updateStatus('🔍 유사 이미지 검색 중...');
                    await this.searchSimilar(features);
                    
                    this.metrics.searchCount++;
                    this.updateStatus('✅ 검색 완료');
                    
                } catch (error) {
                    console.error('검색 오류:', error);
                    this.updateStatus('❌ 검색 실패: ' + error.message);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    // 특징 시각화
    visualizeFeatures(features) {
        const canvas = document.getElementById('featureCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // 배경 클리어
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // 특징 벡터 시각화 (처음 300개만)
        const featuresToShow = Math.min(300, features.length);
        const barWidth = width / featuresToShow;
        
        for (let i = 0; i < featuresToShow; i++) {
            const value = Math.abs(features[i]);
            const barHeight = value * height * 0.8;
            
            // 색상 그래디언트
            const hue = (i / featuresToShow) * 360;
            ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            
            ctx.fillRect(
                i * barWidth,
                height - barHeight,
                barWidth - 1,
                barHeight
            );
        }
        
        // 라벨
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.fillText('Feature Vector Visualization', 10, 20);
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
            
            let totalSimilarity = 0;
            
            for (const image of images) {
                // 자기 자신 제외
                if (this.currentSearchFile && image.filename === this.currentSearchFile) {
                    continue;
                }
                
                if (!image.embedding || image.embedding.length === 0) {
                    continue;
                }
                
                // 고급 유사도 계산
                const similarity = this.calculateAdvancedSimilarity(queryFeatures, image.embedding);
                totalSimilarity += similarity;
                
                results.push({
                    ...image,
                    similarity: similarity
                });
            }
            
            // 평균 유사도 업데이트
            this.metrics.avgSimilarity = totalSimilarity / results.length;
            
            // 유사도 순으로 정렬
            results.sort((a, b) => b.similarity - a.similarity);
            
            console.log('=== 상위 5개 결과 ===');
            results.slice(0, 5).forEach((r, i) => {
                console.log(`${i+1}. ${r.filename}: ${(r.similarity * 100).toFixed(1)}%`);
            });
            
            // 결과 표시
            this.displayAdvancedResults(results.slice(0, 20));
        };
    }
    
    // 고급 유사도 계산
    calculateAdvancedSimilarity(features1, features2) {
        if (!features1 || !features2) return 0;
        
        const len = Math.min(features1.length, features2.length);
        
        // 코사인 유사도 계산
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
        
        let cosineSimilarity = dotProduct / (norm1 * norm2);
        
        // 모델별 가중치 적용
        if (this.models.activeModel === 'hybrid') {
            // 하이브리드 모드: 특징 타입별 가중치
            const mobileNetSim = this.calculatePartialSimilarity(features1, features2, 0, 1280);
            const colorSim = this.calculatePartialSimilarity(features1, features2, 1280, 1280 + 20);
            const patternSim = this.calculatePartialSimilarity(features1, features2, 1280 + 20, len);
            
            cosineSimilarity = mobileNetSim * 0.5 + colorSim * 0.3 + patternSim * 0.2;
        }
        
        return Math.max(0, Math.min(1, cosineSimilarity));
    }
    
    // 부분 유사도 계산
    calculatePartialSimilarity(features1, features2, start, end) {
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        for (let i = start; i < end && i < features1.length && i < features2.length; i++) {
            dotProduct += features1[i] * features2[i];
            norm1 += features1[i] * features1[i];
            norm2 += features2[i] * features2[i];
        }
        
        norm1 = Math.sqrt(norm1);
        norm2 = Math.sqrt(norm2);
        
        if (norm1 === 0 || norm2 === 0) return 0;
        
        return dotProduct / (norm1 * norm2);
    }
    
    // 고급 결과 표시
    displayAdvancedResults(results) {
        const resultsDiv = document.getElementById('results');
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<p style="text-align:center; color:#999;">검색 결과가 없습니다.</p>';
            return;
        }
        
        resultsDiv.innerHTML = results.map((item, index) => {
            const score = (item.similarity * 100).toFixed(1);
            
            // 점수별 색상
            let scoreColor = '#4caf50';
            if (score < 70) scoreColor = '#ff9800';
            if (score < 50) scoreColor = '#f44336';
            
            // 순위별 배지 색상
            let rankColor = '#4caf50';
            if (index >= 3) rankColor = '#ff9800';
            if (index >= 10) rankColor = '#9e9e9e';
            
            // 브랜드 추론 (간단한 규칙 기반)
            const brand = this.inferBrand(item);
            
            return `
                <div style="position: relative; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); background: white; border: 1px solid #eee; transition: transform 0.3s;">
                    <div style="position: absolute; top: 10px; left: 10px; background: ${rankColor}; color: white; padding: 5px 10px; border-radius: 20px; font-weight: bold; font-size: 12px; z-index: 1;">
                        #${index + 1}
                    </div>
                    ${brand ? `<div style="position: absolute; top: 10px; right: 10px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 5px 10px; border-radius: 20px; font-size: 11px; z-index: 1;">${brand}</div>` : ''}
                    <img src="${item.path}" style="width: 100%; height: 250px; object-fit: cover; display: block;">
                    <div style="padding: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="font-size: 24px; font-weight: bold; color: ${scoreColor};">${score}%</div>
                            <div style="font-size: 11px; color: #999;">
                                ${this.models.activeModel === 'hybrid' ? '🚀' : this.models.activeModel === 'advanced' ? '⚡' : '📊'}
                            </div>
                        </div>
                        <div style="font-size: 12px; color: #666; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.filename}</div>
                        <div style="height: 4px; background: #e0e0e0; border-radius: 2px; overflow: hidden; margin-top: 8px;">
                            <div style="height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); width: ${score}%; transition: width 0.5s;"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // 호버 효과
        resultsDiv.querySelectorAll('div').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    }
    
    // 브랜드 추론 (간단한 규칙)
    inferBrand(item) {
        const filename = item.filename.toLowerCase();
        
        // 파일명 기반 간단한 추론
        if (filename.includes('lv') || filename.includes('louis') || filename.includes('vuitton')) {
            return 'Louis Vuitton';
        }
        if (filename.includes('chanel') || filename.includes('cc')) {
            return 'Chanel';
        }
        if (filename.includes('gucci') || filename.includes('gg')) {
            return 'Gucci';
        }
        if (filename.includes('prada')) {
            return 'Prada';
        }
        if (filename.includes('hermes')) {
            return 'Hermès';
        }
        
        // 색상 기반 추론 (매우 간단한 버전)
        if (item.embedding && item.embedding.length > 1280) {
            const brown = item.embedding[1284];
            const black = item.embedding[1283];
            
            if (brown > 0.3) return 'LV/Gucci';
            if (black > 0.5) return 'Chanel/Prada';
        }
        
        return null;
    }
    
    // Tauri 파일 인덱싱
    async indexTauriFiles(fileEntries, basePath) {
        if (!this.models.isReady) {
            alert('AI 모델이 아직 로드 중입니다. 잠시만 기다려주세요.');
            return;
        }
        
        // 직접 접근 방식
        const fs = window.__TAURI__.fs;
        const startTime = Date.now();
        
        this.updateProgressLog(`🔄 Tauri 인덱싱 시작: ${fileEntries.length}개 파일`);
        
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < fileEntries.length; i++) {
            const entry = fileEntries[i];
            const progress = Math.round(((i + 1) / fileEntries.length) * 100);
            
            this.updateProgressStats(fileEntries.length, successCount, failCount, progress);
            this.updateProgressLog(`처리 중: ${entry.name}`);
            
            try {
                // 파일 읽기
                const filePath = `${basePath}/${entry.name}`;
                const fileData = await fs.readBinaryFile(filePath);
                
                // Blob 생성
                const blob = new Blob([fileData], { type: 'image/*' });
                const url = URL.createObjectURL(blob);
                
                // 이미지 로드
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = url;
                });
                
                // 특징 추출
                const embedding = await this.extractAdvancedFeatures(img);
                
                // DB에 저장
                const imageData = {
                    filename: entry.name,
                    path: url,
                    embedding: embedding,
                    indexed: new Date().toISOString(),
                    brand: this.inferBrandFromFilename(entry.name)
                };
                
                await this.saveImageToDB(imageData);
                successCount++;
                this.metrics.indexedCount++;
                
                console.log(`✅ ${entry.name} 인덱싱 완료`);
                
            } catch (error) {
                console.error(`파일 처리 실패 (${entry.name}):`, error);
                failCount++;
                this.updateProgressLog(`❌ 실패: ${entry.name} - ${error.message}`);
            }
            
            // UI 업데이트를 위한 딜레이
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
        
        this.updateProgressStats(fileEntries.length, successCount, failCount, 100);
        this.updateProgressLog(`✅ 인덱싱 완료! 성공: ${successCount}, 실패: ${failCount}, 시간: ${elapsedTime}초`);
    }
    
    // 파일명에서 브랜드 추론
    inferBrandFromFilename(filename) {
        const name = filename.toLowerCase();
        
        const brands = {
            'lv': 'Louis Vuitton',
            'louis': 'Louis Vuitton',
            'vuitton': 'Louis Vuitton',
            'chanel': 'Chanel',
            'cc': 'Chanel',
            'gucci': 'Gucci',
            'gg': 'Gucci',
            'prada': 'Prada',
            'hermes': 'Hermès',
            'dior': 'Dior',
            'celine': 'Celine',
            'fendi': 'Fendi',
            'ysl': 'YSL',
            'saint laurent': 'YSL'
        };
        
        for (const [key, brand] of Object.entries(brands)) {
            if (name.includes(key)) {
                return brand;
            }
        }
        
        return 'Unknown';
    }
    
    // 웹 파일 인덱싱
    async indexFiles(files) {
        if (!this.models.isReady) {
            alert('AI 모델이 아직 로드 중입니다. 잠시만 기다려주세요.');
            return;
        }
        
        const startTime = Date.now();
        
        this.updateProgressLog(`🔄 인덱싱 시작: ${files.length}개 파일`);
        
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = Math.round(((i + 1) / files.length) * 100);
            
            this.updateProgressStats(files.length, successCount, failCount, progress);
            this.updateProgressLog(`처리 중: ${file.name}`);
            
            try {
                await this.processFile(file);
                successCount++;
                this.metrics.indexedCount++;
            } catch (error) {
                console.error(`파일 처리 실패 (${file.name}):`, error);
                failCount++;
                this.updateProgressLog(`❌ 실패: ${file.name}`);
            }
            
            // UI 업데이트를 위한 딜레이
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
        
        this.updateProgressStats(files.length, successCount, failCount, 100);
        this.updateProgressLog(`✅ 인덱싱 완료! 성공: ${successCount}, 실패: ${failCount}, 시간: ${elapsedTime}초`);
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
                        const embedding = await this.extractAdvancedFeatures(img);
                        
                        // DB에 저장
                        const imageData = {
                            filename: file.name,
                            path: e.target.result,
                            embedding: embedding,
                            indexed: new Date().toISOString(),
                            brand: this.inferBrandFromFilename(file.name)
                        };
                        
                        await this.saveImageToDB(imageData);
                        console.log(`✅ ${file.name} 인덱싱 완료`);
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
    
    // 배치 재인덱싱
    async batchReindexAll() {
        if (!confirm('모든 이미지를 다시 인덱싱하시겠습니까? 시간이 걸릴 수 있습니다.')) {
            return;
        }
        
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = async () => {
            const images = request.result;
            
            if (images.length === 0) {
                alert('재인덱싱할 이미지가 없습니다.');
                return;
            }
            
            this.updateProgressLog(`🔄 배치 재인덱싱 시작: ${images.length}개 이미지`);
            
            let successCount = 0;
            let failCount = 0;
            
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                const progress = Math.round(((i + 1) / images.length) * 100);
                
                this.updateProgressStats(images.length, successCount, failCount, progress);
                this.updateProgressLog(`재인덱싱: ${image.filename}`);
                
                try {
                    // 이미지 로드
                    const img = new Image();
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        img.src = image.path;
                    });
                    
                    // 새로운 특징 추출
                    const newEmbedding = await this.extractAdvancedFeatures(img);
                    
                    // 업데이트
                    image.embedding = newEmbedding;
                    image.reindexed = new Date().toISOString();
                    
                    // DB 업데이트
                    await this.updateImageInDB(image);
                    successCount++;
                    
                } catch (error) {
                    console.error(`재인덱싱 실패 (${image.filename}):`, error);
                    failCount++;
                }
                
                // UI 업데이트를 위한 딜레이
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            this.updateProgressStats(images.length, successCount, failCount, 100);
            this.updateProgressLog(`✅ 배치 재인덱싱 완료! 성공: ${successCount}, 실패: ${failCount}`);
        };
    }
    
    // DB 관리 함수들
    async saveImageToDB(imageData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.add(imageData);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async updateImageInDB(imageData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.put(imageData);
            
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
            
            // 브랜드별 통계
            const brandStats = {};
            let validCount = 0;
            let invalidCount = 0;
            
            images.forEach(img => {
                if (img.embedding && img.embedding.length > 0) {
                    validCount++;
                    const brand = img.brand || 'Unknown';
                    brandStats[brand] = (brandStats[brand] || 0) + 1;
                } else {
                    invalidCount++;
                }
            });
            
            let report = `=== DB 검증 결과 (v21 Advanced) ===\n`;
            report += `총 이미지: ${images.length}개\n`;
            report += `유효 이미지: ${validCount}개\n`;
            report += `무효 이미지: ${invalidCount}개\n`;
            report += `DB 이름: ${this.dbName}\n`;
            report += `앱 버전: ${this.version}\n`;
            report += `활성 모델: ${this.models.activeModel}\n\n`;
            
            report += `=== 브랜드별 분포 ===\n`;
            Object.entries(brandStats).sort((a, b) => b[1] - a[1]).forEach(([brand, count]) => {
                report += `${brand}: ${count}개 (${(count / validCount * 100).toFixed(1)}%)\n`;
            });
            
            report += `\n=== 성능 메트릭 ===\n`;
            report += `총 인덱싱: ${this.metrics.indexedCount}개\n`;
            report += `총 검색: ${this.metrics.searchCount}회\n`;
            report += `평균 유사도: ${(this.metrics.avgSimilarity * 100).toFixed(1)}%\n`;
            
            if (images.length > 0) {
                report += `\n=== 최근 5개 이미지 ===\n`;
                images.slice(-5).forEach((img, i) => {
                    report += `${i+1}. ${img.filename}\n`;
                    report += `   - 인덱싱: ${img.indexed}\n`;
                    report += `   - 브랜드: ${img.brand || 'Unknown'}\n`;
                    report += `   - 특징 벡터: ${img.embedding ? img.embedding.length : 0}차원\n`;
                });
            }
            
            output.textContent = report;
        };
    }
    
    // DB 내보내기
    async exportDB() {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            const exportData = {
                version: this.version,
                exportDate: new Date().toISOString(),
                imageCount: images.length,
                images: images
            };
            
            const json = JSON.stringify(exportData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `fashion_search_db_${new Date().getTime()}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            this.updateProgressLog(`✅ DB 내보내기 완료: ${images.length}개 이미지`);
        };
    }
    
    // DB 가져오기
    async importDB() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    if (!importData.images || !Array.isArray(importData.images)) {
                        alert('잘못된 형식의 파일입니다.');
                        return;
                    }
                    
                    if (confirm(`${importData.imageCount}개의 이미지를 가져오시겠습니까? 기존 데이터는 유지됩니다.`)) {
                        let successCount = 0;
                        
                        for (const image of importData.images) {
                            try {
                                await this.saveImageToDB(image);
                                successCount++;
                            } catch (error) {
                                console.error('이미지 가져오기 실패:', error);
                            }
                        }
                        
                        this.updateProgressLog(`✅ DB 가져오기 완료: ${successCount}/${importData.imageCount}개 성공`);
                    }
                } catch (error) {
                    alert('파일 읽기 실패: ' + error.message);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    // 분석 업데이트
    async updateAnalytics() {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            
            // 인덱싱 통계
            const indexStats = document.getElementById('indexStats');
            if (indexStats) {
                indexStats.innerHTML = `
                    <div>총 이미지: ${images.length}개</div>
                    <div>세션 인덱싱: ${this.metrics.indexedCount}개</div>
                    <div>평균 크기: ${this.calculateAvgSize(images)} KB</div>
                `;
            }
            
            // 검색 통계
            const searchStats = document.getElementById('searchStats');
            if (searchStats) {
                searchStats.innerHTML = `
                    <div>총 검색: ${this.metrics.searchCount}회</div>
                    <div>평균 유사도: ${(this.metrics.avgSimilarity * 100).toFixed(1)}%</div>
                    <div>캐시 히트율: N/A</div>
                `;
            }
            
            // 모델 통계
            const modelStats = document.getElementById('modelStats');
            if (modelStats) {
                modelStats.innerHTML = `
                    <div>활성 모델: ${this.models.activeModel}</div>
                    <div>GPU 가속: ${tf ? tf.getBackend() : 'N/A'}</div>
                    <div>특징 차원: 1286+</div>
                `;
            }
            
            // 브랜드 차트
            this.drawBrandChart(images);
        };
    }
    
    calculateAvgSize(images) {
        if (images.length === 0) return 0;
        
        let totalSize = 0;
        images.forEach(img => {
            if (img.path) {
                // Base64 크기 추정
                totalSize += img.path.length * 0.75 / 1024;
            }
        });
        
        return (totalSize / images.length).toFixed(1);
    }
    
    drawBrandChart(images) {
        const canvas = document.getElementById('brandChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // 브랜드별 집계
        const brandCounts = {};
        images.forEach(img => {
            const brand = img.brand || 'Unknown';
            brandCounts[brand] = (brandCounts[brand] || 0) + 1;
        });
        
        // 정렬
        const sortedBrands = Object.entries(brandCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        if (sortedBrands.length === 0) {
            ctx.fillStyle = '#999';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('데이터 없음', width / 2, height / 2);
            return;
        }
        
        // 차트 그리기
        const barWidth = width / sortedBrands.length * 0.8;
        const maxCount = Math.max(...sortedBrands.map(b => b[1]));
        
        sortedBrands.forEach(([brand, count], i) => {
            const barHeight = (count / maxCount) * height * 0.7;
            const x = i * (width / sortedBrands.length) + (width / sortedBrands.length - barWidth) / 2;
            const y = height - barHeight - 30;
            
            // 바
            const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // 라벨
            ctx.fillStyle = '#333';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(brand, x + barWidth / 2, height - 15);
            ctx.fillText(count, x + barWidth / 2, y - 5);
        });
    }
}

// 앱 시작
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOMContentLoaded - Advanced App 시작');
    
    try {
        window.app = new AdvancedFashionSearchApp();
        console.log('✅ Advanced App 생성 성공');
    } catch (error) {
        console.error('❌ App 생성 실패:', error);
        document.body.innerHTML = `
            <div style="padding: 20px; color: red;">
                <h2>❌ 앱 로딩 실패</h2>
                <p>에러: ${error.message}</p>
                <p>개발자 도구(F12)를 열어 콘솔을 확인하세요.</p>
            </div>
        `;
    }
});

console.log('✅ main_v21_advanced.js 로드 완료');
