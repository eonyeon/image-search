// Fashion Image Search v18.2 - HOTFIX
// DB 초기화 타이밍 문제 해결
// 2025-01-03

console.log('🚀 Fashion Search v18.2 - HOTFIX');

class LuxuryFashionSearchApp {
    constructor() {
        this.version = 'v18.2.0-HOTFIX';
        this.dbName = 'fashionSearchDB_v18';
        this.db = null;
        this.currentMode = 'search';
        this.models = {
            mobileNet: null,
            knnClassifier: null
        };
        this.isReady = false;  // 시스템 준비 상태
        this.init();
    }
    
    async init() {
        try {
            // 1. DB를 가장 먼저 초기화
            await this.openDB();
            console.log('✅ DB 초기화 완료');
            
            // 2. DB 준비 후 UI 생성
            this.setupUI();
            console.log('✅ UI 생성 완료');
            
            // 3. 시스템 준비 완료
            this.isReady = true;
            this.updateStatus('✅ 기본 시스템 준비 완료');
            
            // 4. 모델은 백그라운드에서 로드 (UI 블로킹 방지)
            this.loadModelsInBackground();
            
        } catch (error) {
            console.error('초기화 실패:', error);
            this.updateStatus('❌ 초기화 실패. 페이지를 새로고침해주세요.');
        }
    }
    
    async loadModelsInBackground() {
        try {
            console.log('🔄 백그라운드에서 AI 모델 로딩 중...');
            
            // TensorFlow.js 로드
            if (typeof tf === 'undefined') {
                await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.11.0/dist/tf.min.js');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // MobileNet 로드
            await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js');
            this.models.mobileNet = await mobilenet.load({
                version: 2,
                alpha: 1.0
            });
            console.log('✅ MobileNet 로드 완료');
            
            // KNN Classifier 로드
            await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/knn-classifier@1.2.2/dist/knn-classifier.min.js');
            this.models.knnClassifier = knnClassifier.create();
            console.log('✅ KNN Classifier 로드 완료');
            
            this.updateStatus('✅ 모든 시스템 준비 완료! (AI 모델 포함)');
            
        } catch (error) {
            console.error('❌ 모델 로딩 실패:', error);
            this.updateStatus('⚠️ AI 모델 로딩 실패. 기본 기능은 사용 가능합니다.');
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
    
    setupUI() {
        const html = `
            <div id="fashionSearchApp">
                <h1>Fashion Search v18.2 HOTFIX</h1>
                <div id="status">🔄 초기화 중...</div>
                
                <div class="mode-buttons">
                    <button class="mode-btn active" data-mode="search">🔍 검색</button>
                    <button class="mode-btn" data-mode="index">📁 인덱싱</button>
                    <button class="mode-btn" data-mode="debug">⚙️ 설정</button>
                </div>
                
                <div id="searchMode" class="mode-content">
                    <div class="upload-area" id="uploadArea">
                        <p>🖼️ 검색할 이미지를 드래그하거나 클릭</p>
                        <input type="file" id="fileInput" accept="image/*" style="display:none">
                    </div>
                    
                    <div id="previewContainer" style="display:none;">
                        <img id="previewImage" style="max-width:400px;">
                        <div id="searchStatus"></div>
                    </div>
                    
                    <div id="results"></div>
                </div>
                
                <div id="indexMode" class="mode-content" style="display:none;">
                    <div class="button-group">
                        <button id="selectFilesBtn" class="primary-btn">
                            🖼️ 이미지 파일 선택 (권장)
                        </button>
                        <button id="selectFolderBtn" class="secondary-btn">
                            📂 폴더 선택 (실험적)
                        </button>
                        <button id="clearDBBtn" class="danger-btn">
                            🗑️ DB 초기화
                        </button>
                    </div>
                    
                    <div id="dropZone">
                        <h3>📥 드래그 & 드롭</h3>
                        <p>여러 이미지를 여기에 놓으세요</p>
                    </div>
                    
                    <div id="indexProgress"></div>
                    <div id="indexStatus"></div>
                </div>
                
                <div id="debugMode" class="mode-content" style="display:none;">
                    <button id="testBtn">🧪 시스템 테스트</button>
                    <button id="validateBtn">✔️ DB 검증</button>
                    <button id="clearAllBtn">💣 완전 초기화</button>
                    <pre id="debugConsole"></pre>
                </div>
            </div>
        `;
        
        document.body.innerHTML = html;
        
        // DOM이 준비된 후 이벤트 리스너 등록
        setTimeout(() => {
            this.setupEventListeners();
        }, 100);
        
        this.applyStyles();
    }
    
    setupEventListeners() {
        // 검색 모드
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.background = '#e3f2fd';
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.background = '#fafafa';
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.background = '#fafafa';
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    this.processSearchImage(file);
                }
            });
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.processSearchImage(file);
            });
        }
        
        // 인덱싱 모드
        const selectFilesBtn = document.getElementById('selectFilesBtn');
        if (selectFilesBtn) {
            selectFilesBtn.addEventListener('click', () => {
                this.selectMultipleFiles();
            });
        }
        
        const selectFolderBtn = document.getElementById('selectFolderBtn');
        if (selectFolderBtn) {
            selectFolderBtn.addEventListener('click', () => {
                this.selectFolder();
            });
        }
        
        const clearDBBtn = document.getElementById('clearDBBtn');
        if (clearDBBtn) {
            clearDBBtn.addEventListener('click', () => {
                if (confirm('모든 인덱싱된 이미지를 삭제하시겠습니까?')) {
                    this.clearDB();
                }
            });
        }
        
        // 드롭존
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#1976d2';
                dropZone.style.background = '#e3f2fd';
            });
            
            dropZone.addEventListener('dragleave', () => {
                dropZone.style.borderColor = '#ddd';
                dropZone.style.background = '#fafafa';
            });
            
            dropZone.addEventListener('drop', async (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#ddd';
                dropZone.style.background = '#fafafa';
                
                const files = Array.from(e.dataTransfer.files).filter(f => 
                    f.type.startsWith('image/') || 
                    f.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                );
                
                if (files.length > 0) {
                    await this.indexImages(files);
                }
            });
        }
        
        // 디버그 모드
        document.getElementById('testBtn')?.addEventListener('click', () => this.runTest());
        document.getElementById('validateBtn')?.addEventListener('click', () => this.validateDB());
        document.getElementById('clearAllBtn')?.addEventListener('click', () => this.clearAndReload());
        
        // 모드 전환
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                if (mode) this.switchMode(mode);
            });
        });
    }
    
    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: #f5f5f5;
                padding: 20px;
            }
            
            #fashionSearchApp {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            
            h1 {
                color: #333;
                margin-bottom: 20px;
                font-size: 28px;
            }
            
            #status {
                background: #e8f4fd;
                color: #1976d2;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 20px;
                font-weight: 500;
            }
            
            .mode-buttons {
                display: flex;
                gap: 10px;
                margin-bottom: 30px;
            }
            
            .mode-btn {
                flex: 1;
                padding: 12px 20px;
                background: white;
                border: 2px solid #ddd;
                color: #666;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 500;
                transition: all 0.3s;
            }
            
            .mode-btn:hover {
                background: #f8f8f8;
            }
            
            .mode-btn.active {
                background: #1976d2;
                color: white;
                border-color: #1976d2;
            }
            
            .upload-area {
                border: 2px dashed #1976d2;
                border-radius: 12px;
                padding: 60px 20px;
                text-align: center;
                cursor: pointer;
                background: #fafafa;
                transition: all 0.3s;
            }
            
            .upload-area:hover {
                background: #f0f8ff;
            }
            
            .upload-area p {
                color: #666;
                font-size: 18px;
            }
            
            .button-group {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .primary-btn, .secondary-btn, .danger-btn {
                padding: 15px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 500;
                transition: all 0.3s;
            }
            
            .primary-btn {
                background: #1976d2;
                color: white;
            }
            
            .primary-btn:hover {
                background: #1565c0;
            }
            
            .secondary-btn {
                background: #757575;
                color: white;
            }
            
            .secondary-btn:hover {
                background: #616161;
            }
            
            .danger-btn {
                background: #d32f2f;
                color: white;
            }
            
            .danger-btn:hover {
                background: #c62828;
            }
            
            #dropZone {
                border: 3px dashed #ddd;
                border-radius: 12px;
                padding: 40px;
                text-align: center;
                background: #fafafa;
                transition: all 0.3s;
                margin-bottom: 20px;
            }
            
            #dropZone h3 {
                color: #666;
                margin-bottom: 10px;
            }
            
            #dropZone p {
                color: #999;
            }
            
            #previewImage {
                max-width: 100%;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            }
            
            #searchStatus {
                margin-top: 20px;
                padding: 10px;
                background: #f0f0f0;
                border-radius: 8px;
            }
            
            #results {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 20px;
                margin-top: 30px;
            }
            
            .result-item {
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                transition: transform 0.3s;
            }
            
            .result-item:hover {
                transform: translateY(-5px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            
            .result-item img {
                width: 100%;
                height: 200px;
                object-fit: cover;
            }
            
            .result-info {
                padding: 12px;
            }
            
            .similarity-score {
                font-size: 20px;
                font-weight: bold;
                color: #1976d2;
            }
            
            .progress-bar {
                background: #f0f0f0;
                border-radius: 8px;
                overflow: hidden;
                margin: 20px 0;
                height: 30px;
            }
            
            .progress-fill {
                background: #1976d2;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                transition: width 0.3s;
            }
            
            #debugConsole {
                background: #263238;
                color: #aed581;
                padding: 20px;
                border-radius: 8px;
                font-family: monospace;
                font-size: 14px;
                max-height: 400px;
                overflow-y: auto;
                white-space: pre-wrap;
                margin-top: 20px;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 파일 선택 (안정적)
    async selectMultipleFiles() {
        if (!this.checkReady()) return;
        
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*';
        
        input.onchange = async (e) => {
            const files = Array.from(e.target.files);
            console.log(`${files.length}개 파일 선택됨`);
            
            if (files.length > 0) {
                await this.indexImages(files);
            }
        };
        
        input.click();
    }
    
    // 폴더 선택 (실험적)
    async selectFolder() {
        if (!this.checkReady()) return;
        
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.directory = true;
        input.multiple = true;
        
        input.onchange = async (e) => {
            const allFiles = Array.from(e.target.files || []);
            const imageFiles = allFiles.filter(f => 
                f.type.startsWith('image/') || 
                f.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
            );
            
            console.log(`${imageFiles.length}개 이미지 발견`);
            
            if (imageFiles.length > 0) {
                await this.indexImages(imageFiles);
            } else {
                alert('선택한 폴더에 이미지 파일이 없습니다.');
            }
        };
        
        document.body.appendChild(input);
        input.style.display = 'none';
        input.click();
        
        setTimeout(() => {
            if (input.parentNode) {
                document.body.removeChild(input);
            }
        }, 60000);
    }
    
    // 시스템 준비 확인
    checkReady() {
        if (!this.isReady || !this.db) {
            alert('시스템이 아직 준비 중입니다. 잠시만 기다려주세요.');
            return false;
        }
        return true;
    }
    
    // 이미지 인덱싱
    async indexImages(files) {
        if (!this.checkReady()) return;
        
        const progressDiv = document.getElementById('indexProgress');
        const statusDiv = document.getElementById('indexStatus');
        
        progressDiv.innerHTML = '<div class="progress-bar"><div class="progress-fill" id="progressFill">0%</div></div>';
        statusDiv.textContent = `🔄 ${files.length}개 이미지 처리 중...`;
        
        // DB 초기화
        await this.clearDB();
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = ((i + 1) / files.length * 100).toFixed(1);
            
            const progressFill = document.getElementById('progressFill');
            if (progressFill) {
                progressFill.style.width = `${progress}%`;
                progressFill.textContent = `${progress}%`;
            }
            
            try {
                await this.processFile(file);
                successCount++;
                console.log(`✅ ${file.name}`);
            } catch (error) {
                errorCount++;
                console.error(`❌ ${file.name}:`, error.message);
            }
        }
        
        statusDiv.textContent = `✅ 완료: ${successCount}개 성공, ${errorCount}개 실패`;
        this.updateStatus(`✅ ${successCount}개 이미지 인덱싱 완료!`);
    }
    
    // 파일 처리
    async processFile(file) {
        const dataUrl = await this.fileToDataUrl(file);
        const img = await this.loadImage(dataUrl);
        
        let embedding = [];
        
        // MobileNet이 준비된 경우에만 사용
        if (this.models.mobileNet) {
            try {
                const features = await this.extractFeatures(img);
                const embeddingTensor = await features.array();
                
                // 배열인지 확인하고 평탄화
                if (Array.isArray(embeddingTensor)) {
                    embedding = embeddingTensor.flat();
                } else {
                    embedding = Array.from(embeddingTensor);
                }
                
                features.dispose();
                
                console.log(`임베딩 생성: ${file.name} - ${embedding.length}차원`);
                
            } catch (error) {
                console.warn('특징 추출 실패, 기본값 사용:', error.message);
                embedding = new Array(1280).fill(0); // 기본값
            }
        } else {
            // 모델이 없으면 기본값 사용
            console.warn('MobileNet 미로드, 기본값 사용');
            embedding = new Array(1280).fill(0);
        }
        
        // 임베딩 검증
        if (!Array.isArray(embedding) || embedding.length === 0) {
            console.error('임베딩 오류, 기본값 사용');
            embedding = new Array(1280).fill(0);
        }
        
        const imageData = {
            filename: file.name,
            path: dataUrl,
            embedding: embedding,
            indexed: new Date().toISOString()
        };
        
        await this.saveImageToDB(imageData);
    }
    
    // MobileNet 특징 추출
    async extractFeatures(imageElement) {
        if (!this.models.mobileNet) {
            throw new Error('MobileNet이 아직 로드되지 않았습니다');
        }
        
        try {
            const embeddings = this.models.mobileNet.infer(imageElement, true);
            const norm = tf.norm(embeddings);
            const normalized = tf.div(embeddings, norm);
            norm.dispose();
            return normalized;
        } catch (error) {
            console.error('특징 추출 오류:', error);
            return this.models.mobileNet.infer(imageElement, true);
        }
    }
    
    // 검색 이미지 처리
    async processSearchImage(file) {
        if (!this.models.mobileNet) {
            alert('AI 모델이 아직 로드 중입니다. 잠시만 기다려주세요.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                document.getElementById('previewImage').src = e.target.result;
                document.getElementById('previewContainer').style.display = 'block';
                document.getElementById('searchStatus').textContent = '🔍 검색 중...';
                
                try {
                    const features = await this.extractFeatures(img);
                    const featuresArray = await features.array();
                    features.dispose();
                    
                    await this.searchSimilar(featuresArray);
                    
                    document.getElementById('searchStatus').textContent = '✅ 검색 완료';
                } catch (error) {
                    console.error('검색 오류:', error);
                    document.getElementById('searchStatus').textContent = '❌ 검색 실패';
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    // 유사 이미지 검색
    async searchSimilar(queryArray) {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            const results = [];
            
            for (const image of images) {
                if (!image.embedding || image.embedding.length === 0) continue;
                
                const similarity = this.cosineSimilarity(queryArray, image.embedding);
                
                results.push({
                    ...image,
                    similarity: similarity
                });
            }
            
            results.sort((a, b) => b.similarity - a.similarity);
            this.displayResults(results.slice(0, 20));
        };
    }
    
    // 코사인 유사도
    cosineSimilarity(vec1, vec2) {
        if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;
        
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }
        
        if (norm1 === 0 || norm2 === 0) return 0;
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }
    
    // 결과 표시
    displayResults(results) {
        const resultsDiv = document.getElementById('results');
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<p>검색 결과가 없습니다.</p>';
            return;
        }
        
        resultsDiv.innerHTML = results.map(item => `
            <div class="result-item">
                <img src="${item.path}" alt="${item.filename}">
                <div class="result-info">
                    <div class="similarity-score">${(item.similarity * 100).toFixed(1)}%</div>
                    <div style="font-size:12px;color:#666;">${item.filename}</div>
                </div>
            </div>
        `).join('');
    }
    
    // 유틸리티 함수들
    fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
    
    // DB 관리
    async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2);
            
            request.onerror = () => {
                console.error('DB 열기 실패:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ DB 연결 성공');
                this.checkDBStatus();
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('images')) {
                    const store = db.createObjectStore('images', { keyPath: 'filename' });
                    store.createIndex('date', 'indexed', { unique: false });
                }
            };
        });
    }
    
    async checkDBStatus() {
        if (!this.db) return;
        
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const countRequest = store.count();
        
        countRequest.onsuccess = () => {
            const count = countRequest.result;
            if (count > 0) {
                this.updateStatus(`✅ ${count}개 이미지 준비 완료`);
            } else {
                this.updateStatus('💡 인덱싱 모드에서 이미지를 추가하세요');
            }
        };
    }
    
    async clearDB() {
        if (!this.db) return;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log('✅ DB 초기화 완료');
                resolve();
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    async saveImageToDB(imageData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.put(imageData);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    // 디버그 기능
    async runTest() {
        const console = document.getElementById('debugConsole');
        console.textContent = '=== 시스템 테스트 ===\n\n';
        
        console.textContent += `버전: ${this.version}\n`;
        console.textContent += `준비 상태: ${this.isReady ? '✅' : '❌'}\n`;
        console.textContent += `DB: ${this.db ? '✅' : '❌'}\n`;
        console.textContent += `TensorFlow: ${typeof tf !== 'undefined' ? '✅' : '❌'}\n`;
        console.textContent += `MobileNet: ${this.models.mobileNet ? '✅' : '❌'}\n`;
        console.textContent += `KNN: ${this.models.knnClassifier ? '✅' : '❌'}\n`;
        
        if (typeof tf !== 'undefined') {
            console.textContent += `\nTF Version: ${tf.version.tfjs}\n`;
            console.textContent += `Backend: ${tf.getBackend()}\n`;
        }
    }
    
    async validateDB() {
        if (!this.db) {
            alert('DB가 아직 준비되지 않았습니다.');
            return;
        }
        
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            const console = document.getElementById('debugConsole');
            
            console.textContent = `=== DB 검증 ===\n\n`;
            console.textContent += `총 이미지: ${images.length}개\n\n`;
            
            if (images.length > 0) {
                console.textContent += `샘플 데이터:\n`;
                images.slice(0, 5).forEach((img, i) => {
                    console.textContent += `${i+1}. ${img.filename}\n`;
                    console.textContent += `   임베딩 크기: ${img.embedding?.length || 0}\n`;
                });
            }
        };
    }
    
    async clearAndReload() {
        if (confirm('모든 데이터를 삭제하고 새로 시작하시겠습니까?')) {
            if (this.db) {
                this.db.close();
            }
            const deleteReq = indexedDB.deleteDatabase(this.dbName);
            deleteReq.onsuccess = () => location.reload();
        }
    }
    
    // UI 헬퍼
    switchMode(mode) {
        this.currentMode = mode;
        
        document.querySelectorAll('.mode-content').forEach(el => {
            el.style.display = 'none';
        });
        
        const modeElement = document.getElementById(`${mode}Mode`);
        if (modeElement) {
            modeElement.style.display = 'block';
        }
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });
    }
    
    updateStatus(message) {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = message;
        }
        console.log(message);
    }
}

// 앱 초기화
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new LuxuryFashionSearchApp();
    window.app = app;
});

console.log('Fashion Search v18.2 HOTFIX - DB 타이밍 문제 해결');
