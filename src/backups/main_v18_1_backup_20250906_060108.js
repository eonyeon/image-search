// Fashion Image Search v18.1 - Bug Fixed Edition
// TensorFlow 에러 수정 + UI 개선 + 자동 검색 복구
// 2025-01-03

console.log('🚀 Fashion Search v18.1 - Bug Fixed Edition');

class LuxuryFashionSearchApp {
    constructor() {
        this.version = 'v18.1.0-FIXED';
        this.dbName = 'fashionSearchDB_v18';
        this.db = null;
        this.currentMode = 'search';
        this.models = {
            mobileNet: null,
            knnClassifier: null
        };
        this.cache = new Map();
        this.init();
    }
    
    async init() {
        this.setupUI();
        await this.loadModels();
        await this.openDB();
        this.updateStatus('✅ 시스템 준비 완료!');
    }
    
    async loadModels() {
        try {
            console.log('🔄 모델 로딩 중...');
            
            // TensorFlow.js 로드
            if (typeof tf === 'undefined') {
                await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.11.0/dist/tf.min.js');
                // TensorFlow 로드 대기
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // MobileNet 로드
            await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js');
            
            // MobileNet 초기화
            this.models.mobileNet = await mobilenet.load({
                version: 2,
                alpha: 1.0
            });
            console.log('✅ MobileNet 로드 완료');
            
            // KNN Classifier 로드
            await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/knn-classifier@1.2.2/dist/knn-classifier.min.js');
            this.models.knnClassifier = knnClassifier.create();
            console.log('✅ KNN Classifier 로드 완료');
            
        } catch (error) {
            console.error('❌ 모델 로딩 실패:', error);
            this.updateStatus('⚠️ 모델 로딩 실패. 새로고침해주세요.');
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
                <h1>Fashion Search v18.1</h1>
                <div id="status">🔄 초기화 중...</div>
                
                <div class="mode-buttons">
                    <button id="searchModeBtn" class="mode-btn active" data-mode="search">🔍 검색</button>
                    <button id="indexModeBtn" class="mode-btn" data-mode="index">📁 인덱싱</button>
                    <button id="debugModeBtn" class="mode-btn" data-mode="debug">⚙️ 설정</button>
                </div>
                
                <div id="searchMode" class="mode-content">
                    <div class="upload-area" id="uploadArea">
                        <p>🖼️ 이미지를 드래그하거나 클릭하여 업로드</p>
                        <input type="file" id="fileInput" accept="image/*" style="display:none">
                    </div>
                    
                    <div id="previewContainer" style="display:none;">
                        <img id="previewImage">
                        <div id="searchStatus"></div>
                    </div>
                    
                    <div id="results"></div>
                </div>
                
                <div id="indexMode" class="mode-content" style="display:none;">
                    <div class="index-buttons">
                        <button id="selectFolderBtn">📂 폴더 선택 (작동 안할 수 있음)</button>
                        <button id="selectFilesBtn">🖼️ 이미지 파일 선택</button>
                        <button id="clearDBBtn">🗑️ DB 초기화</button>
                    </div>
                    
                    <div id="dropZone">
                        <h3>드래그 & 드롭</h3>
                        <p>여러 이미지를 여기에 놓으세요</p>
                    </div>
                    
                    <div id="indexProgress"></div>
                </div>
                
                <div id="debugMode" class="mode-content" style="display:none;">
                    <div class="debug-buttons">
                        <button id="testBtn">테스트</button>
                        <button id="validateBtn">DB 검증</button>
                        <button id="clearAllBtn">완전 초기화</button>
                    </div>
                    <pre id="debugConsole"></pre>
                </div>
            </div>
        `;
        
        document.body.innerHTML = html;
        this.setupEventListeners();
        this.applyStyles();
    }
    
    setupEventListeners() {
        // 검색 모드 이벤트
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        uploadArea?.addEventListener('click', () => fileInput.click());
        uploadArea?.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea?.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        uploadArea?.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.processSearchImage(file);
            }
        });
        
        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.processSearchImage(file);
        });
        
        // 인덱싱 모드 이벤트
        document.getElementById('selectFolderBtn')?.addEventListener('click', () => this.selectFolder());
        document.getElementById('selectFilesBtn')?.addEventListener('click', () => this.selectMultipleFiles());
        document.getElementById('clearDBBtn')?.addEventListener('click', () => this.clearDB());
        
        // 드롭존
        const dropZone = document.getElementById('dropZone');
        dropZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        dropZone?.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });
        dropZone?.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files).filter(f => 
                f.type.startsWith('image/') || f.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
            );
            if (files.length > 0) {
                await this.indexImages(files);
            }
        });
        
        // 디버그 모드 이벤트
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
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
            
            .upload-area.dragover {
                background: #e3f2fd;
                border-color: #1565c0;
            }
            
            .upload-area p {
                color: #666;
                font-size: 18px;
            }
            
            #previewContainer {
                margin: 30px 0;
                text-align: center;
            }
            
            #previewImage {
                max-width: 400px;
                max-height: 400px;
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
                margin-bottom: 5px;
            }
            
            .result-filename {
                color: #666;
                font-size: 12px;
                word-break: break-all;
            }
            
            .index-buttons {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .index-buttons button,
            .debug-buttons button {
                padding: 15px;
                background: #1976d2;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 500;
                transition: background 0.3s;
            }
            
            .index-buttons button:hover,
            .debug-buttons button:hover {
                background: #1565c0;
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
            
            #dropZone.dragover {
                background: #e3f2fd;
                border-color: #1976d2;
            }
            
            #dropZone h3 {
                color: #666;
                margin-bottom: 10px;
            }
            
            #dropZone p {
                color: #999;
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
            
            .debug-buttons {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 10px;
                margin-bottom: 20px;
            }
            
            #debugConsole {
                background: #263238;
                color: #aed581;
                padding: 20px;
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                max-height: 400px;
                overflow-y: auto;
                white-space: pre-wrap;
            }
        `;
        document.head.appendChild(style);
    }
    
    // MobileNet 특징 추출 (수정된 버전)
    async extractFeatures(imageElement) {
        if (!this.models.mobileNet) {
            throw new Error('MobileNet이 로드되지 않았습니다');
        }
        
        try {
            // MobileNet embeddings 추출
            const embeddings = this.models.mobileNet.infer(imageElement, true);
            
            // 정규화 - tf.linalg.norm 사용
            const norm = tf.norm(embeddings);
            const normalized = tf.div(embeddings, norm);
            
            return normalized;
        } catch (error) {
            console.error('특징 추출 오류:', error);
            // 폴백: 정규화 없이 반환
            return this.models.mobileNet.infer(imageElement, true);
        }
    }
    
    // 검색용 이미지 처리
    async processSearchImage(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                // 미리보기 표시
                document.getElementById('previewImage').src = e.target.result;
                document.getElementById('previewContainer').style.display = 'block';
                document.getElementById('searchStatus').textContent = '🔍 검색 중...';
                
                try {
                    // 특징 추출
                    const features = await this.extractFeatures(img);
                    
                    // 배열로 변환 (dispose 전에)
                    const featuresArray = await features.array();
                    
                    // 텐서 메모리 정리
                    features.dispose();
                    
                    // 유사 이미지 검색 (배열 사용)
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
        
        request.onsuccess = async () => {
            const images = request.result;
            const results = [];
            
            for (const image of images) {
                if (!image.embedding || image.embedding.length === 0) continue;
                
                // 코사인 유사도 계산
                const similarity = this.cosineSimilarity(queryArray, image.embedding);
                
                results.push({
                    ...image,
                    similarity: similarity
                });
            }
            
            // 유사도 순으로 정렬
            results.sort((a, b) => b.similarity - a.similarity);
            
            // 상위 20개 표시
            this.displayResults(results.slice(0, 20));
        };
    }
    
    // 코사인 유사도 계산
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
                    <div class="result-filename">${item.filename}</div>
                </div>
            </div>
        `).join('');
    }
    
    // 다중 파일 선택
    async selectMultipleFiles() {
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
    
    // 폴더 선택 (Tauri에서 작동 안 할 수 있음)
    async selectFolder() {
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
    
    // 이미지 인덱싱
    async indexImages(files) {
        const progressDiv = document.getElementById('indexProgress');
        progressDiv.innerHTML = '<div class="progress-bar"><div class="progress-fill" id="progressFill">0%</div></div>';
        
        await this.clearDB();
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = ((i + 1) / files.length * 100).toFixed(1);
            document.getElementById('progressFill').style.width = `${progress}%`;
            document.getElementById('progressFill').textContent = `${progress}%`;
            
            try {
                const dataUrl = await this.fileToDataUrl(file);
                const img = await this.loadImage(dataUrl);
                
                // 특징 추출
                const features = await this.extractFeatures(img);
                const featuresArray = await features.array();
                
                // DB에 저장
                const imageData = {
                    filename: file.name,
                    path: dataUrl,
                    embedding: featuresArray,
                    indexed: new Date().toISOString()
                };
                
                await this.saveImageToDB(imageData);
                
                // 메모리 정리
                features.dispose();
                
                console.log(`✅ ${file.name}`);
            } catch (error) {
                console.error(`❌ ${file.name} 처리 실패:`, error);
            }
        }
        
        this.updateStatus(`✅ ${files.length}개 이미지 인덱싱 완료!`);
    }
    
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
            
            request.onerror = () => reject(request.error);
            
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
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log('✅ DB 초기화 완료');
                this.updateStatus('DB가 초기화되었습니다');
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
        
        console.textContent += `TensorFlow.js: ${typeof tf !== 'undefined' ? '✅' : '❌'}\n`;
        console.textContent += `MobileNet: ${this.models.mobileNet ? '✅' : '❌'}\n`;
        console.textContent += `KNN: ${this.models.knnClassifier ? '✅' : '❌'}\n`;
        console.textContent += `DB: ${this.db ? '✅' : '❌'}\n`;
        
        if (typeof tf !== 'undefined') {
            console.textContent += `\nTF Version: ${tf.version.tfjs}\n`;
            console.textContent += `Backend: ${tf.getBackend()}\n`;
        }
    }
    
    async validateDB() {
        const transaction = this.db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const images = request.result;
            const console = document.getElementById('debugConsole');
            
            console.textContent = `=== DB 검증 ===\n\n`;
            console.textContent += `총 이미지: ${images.length}개\n\n`;
            
            let validCount = 0;
            images.forEach(img => {
                if (img.embedding && img.embedding.length > 0) {
                    validCount++;
                }
            });
            
            console.textContent += `유효한 임베딩: ${validCount}/${images.length}\n`;
            
            if (images.length > 0) {
                console.textContent += `\n첫 번째 이미지:\n`;
                console.textContent += `  파일명: ${images[0].filename}\n`;
                console.textContent += `  임베딩 크기: ${images[0].embedding?.length || 0}\n`;
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
        
        document.getElementById(`${mode}Mode`).style.display = 'block';
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });
    }
    
    updateStatus(message) {
        document.getElementById('status').textContent = message;
        console.log(message);
    }
}

// 앱 초기화
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new LuxuryFashionSearchApp();
    window.app = app;
});

console.log('Fashion Search v18.1 - Bug Fixed Edition');
