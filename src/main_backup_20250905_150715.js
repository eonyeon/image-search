import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readDir, readBinaryFile } from '@tauri-apps/api/fs';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import localforage from 'localforage';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// Fashion Search v11.8 - 완전 수정 버전
class FashionSearchComplete {
    constructor() {
        this.currentMode = 'search';
        this.uploadedImage = null;
        this.imageDatabase = [];
        this.version = '11.8.0';
        this.model = null;
        this.modelLoaded = false;
        this.debugMode = true;
        this.debugLogs = [];
        
        // 완전히 새 DB (강제 초기화)
        this.storage = localforage.createInstance({
            name: 'FashionSearchDB',
            storeName: 'fashionVectorsV118Complete'
        });
        
        this.init();
    }
    
    // 화면 디버그 로그
    addDebugLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${message}`);
        this.debugLogs.push({ message, type, timestamp });
        this.updateDebugPanel();
    }
    
    updateDebugPanel() {
        let panel = document.getElementById('debug-panel');
        
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'debug-panel';
            panel.style.cssText = `
                position: fixed;
                bottom: 10px;
                right: 10px;
                width: 450px;
                max-height: 350px;
                background: rgba(0, 0, 0, 0.95);
                color: #0f0;
                border: 2px solid #0f0;
                border-radius: 5px;
                padding: 10px;
                font-family: 'Courier New', monospace;
                font-size: 11px;
                overflow-y: auto;
                z-index: 10000;
            `;
            
            const title = document.createElement('div');
            title.style.cssText = 'color: #0ff; font-weight: bold; margin-bottom: 5px;';
            title.textContent = '🔍 Debug Console v11.8 - FIXED';
            panel.appendChild(title);
            
            const logContainer = document.createElement('div');
            logContainer.id = 'debug-log-container';
            panel.appendChild(logContainer);
            
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '✖';
            closeBtn.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                background: transparent;
                color: #f00;
                border: none;
                cursor: pointer;
                font-size: 16px;
            `;
            closeBtn.onclick = () => panel.style.display = 'none';
            panel.appendChild(closeBtn);
            
            document.body.appendChild(panel);
        }
        
        const logContainer = document.getElementById('debug-log-container');
        if (logContainer) {
            const recentLogs = this.debugLogs.slice(-25);
            
            logContainer.innerHTML = recentLogs.map(log => {
                let color = '#0f0';
                if (log.type === 'error') color = '#f00';
                if (log.type === 'warning') color = '#ff0';
                if (log.type === 'success') color = '#0ff';
                if (log.type === 'critical') color = '#f0f';
                
                return `<div style="color: ${color}; margin: 2px 0;">${log.timestamp} ${log.message}</div>`;
            }).join('');
            
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    }

    async init() {
        this.addDebugLog('🚀 Fashion Search v11.8 - 완전 수정 버전', 'success');
        this.addDebugLog('⚠️ DB 초기화 필수!', 'warning');
        
        try {
            await tf.setBackend('webgl');
            await tf.ready();
            this.addDebugLog(`TensorFlow: ${tf.getBackend()}`, 'success');
            
            // TensorFlow 메모리 상태
            const memory = tf.memory();
            this.addDebugLog(`Tensors: ${memory.numTensors}, Bytes: ${(memory.numBytes/1048576).toFixed(2)}MB`, 'info');
        } catch (error) {
            this.addDebugLog(`WebGL 실패: ${error.message}`, 'error');
            await tf.setBackend('cpu');
            this.addDebugLog('CPU 모드 전환', 'warning');
        }
        
        await this.loadModel();
        await this.loadDatabase();
        this.setupEventListeners();
        this.showDebugControls();
        
        this.addDebugLog('초기화 완료!', 'success');
        window.fashionApp = this;
    }
    
    showDebugControls() {
        const controlPanel = document.createElement('div');
        controlPanel.id = 'control-panel';
        controlPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(33, 150, 243, 0.95);
            color: white;
            padding: 15px;
            border-radius: 5px;
            font-family: Arial;
            font-size: 13px;
            z-index: 9999;
            max-width: 350px;
        `;
        
        controlPanel.innerHTML = `
            <h3 style="margin-top: 0;">🔍 디버그 컨트롤 v11.8</h3>
            <p style="color: yellow;">⚠️ 99.9% 버그 수정 버전</p>
            <button id="test-model-btn" style="margin: 3px; padding: 5px 10px;">모델 테스트</button>
            <button id="test-vectors-btn" style="margin: 3px; padding: 5px 10px;">벡터 전체 검사</button>
            <button id="show-db-info-btn" style="margin: 3px; padding: 5px 10px;">DB 정보</button>
            <button id="test-similarity-btn" style="margin: 3px; padding: 5px 10px;">유사도 테스트</button>
            <button id="analyze-vectors-btn" style="margin: 3px; padding: 5px 10px;">벡터 분석</button>
            <button id="clear-debug-btn" style="margin: 3px; padding: 5px 10px;">로그 지우기</button>
        `;
        
        document.body.appendChild(controlPanel);
        
        document.getElementById('test-model-btn').onclick = () => this.testModelOutput();
        document.getElementById('test-vectors-btn').onclick = () => this.testVectorsComplete();
        document.getElementById('show-db-info-btn').onclick = () => this.showDatabaseInfo();
        document.getElementById('test-similarity-btn').onclick = () => this.testSimilarityDebug();
        document.getElementById('analyze-vectors-btn').onclick = () => this.analyzeVectors();
        document.getElementById('clear-debug-btn').onclick = () => {
            this.debugLogs = [];
            this.updateDebugPanel();
        };
    }
    
    async loadModel() {
        try {
            this.showLoading('모델 로드 중...');
            this.addDebugLog('MobileNet v2 로드 시작...', 'info');
            
            this.model = await mobilenet.load({
                version: 2,
                alpha: 1.0
            });
            
            this.modelLoaded = true;
            this.addDebugLog('✅ 모델 로드 완료', 'success');
            
            // 모델 출력 테스트
            await this.testModelOutput();
            
            this.hideLoading();
        } catch (error) {
            this.addDebugLog(`❌ 모델 로드 실패: ${error.message}`, 'error');
            this.hideLoading();
        }
    }
    
    async testModelOutput() {
        this.addDebugLog('=== 모델 출력 테스트 ===', 'info');
        
        try {
            // 완전히 다른 2개 이미지 생성
            const img1 = tf.randomUniform([224, 224, 3], 0, 255);
            const img2 = tf.randomUniform([224, 224, 3], 0, 255);
            
            const norm1 = img1.div(255.0);
            const norm2 = img2.div(255.0);
            
            const batch1 = norm1.expandDims(0);
            const batch2 = norm2.expandDims(0);
            
            // 특징 추출
            const features1 = await this.model.infer(batch1, true);
            const features2 = await this.model.infer(batch2, true);
            
            // 배열로 변환 - await 중요!
            const arr1 = await features1.array();
            const arr2 = await features2.array();
            
            // 실제 배열 데이터 추출
            const vec1 = arr1[0];
            const vec2 = arr2[0];
            
            this.addDebugLog(`벡터1 차원: ${vec1.length}`, 'info');
            this.addDebugLog(`벡터1 처음: [${vec1.slice(0, 3).map(v => v.toFixed(3)).join(', ')}]`, 'info');
            this.addDebugLog(`벡터1 중간: [${vec1.slice(640, 643).map(v => v.toFixed(3)).join(', ')}]`, 'info');
            this.addDebugLog(`벡터1 끝: [${vec1.slice(-3).map(v => v.toFixed(3)).join(', ')}]`, 'info');
            
            this.addDebugLog(`벡터2 처음: [${vec2.slice(0, 3).map(v => v.toFixed(3)).join(', ')}]`, 'info');
            this.addDebugLog(`벡터2 중간: [${vec2.slice(640, 643).map(v => v.toFixed(3)).join(', ')}]`, 'info');
            this.addDebugLog(`벡터2 끝: [${vec2.slice(-3).map(v => v.toFixed(3)).join(', ')}]`, 'info');
            
            // 유사도 계산
            const similarity = this.calculateCosineSimilarity(vec1, vec2);
            this.addDebugLog(`테스트 유사도: ${(similarity * 100).toFixed(1)}%`, similarity > 0.95 ? 'error' : 'success');
            
            // 같은 값 개수 확인
            let sameCount = 0;
            for (let i = 0; i < vec1.length; i++) {
                if (Math.abs(vec1[i] - vec2[i]) < 0.0001) sameCount++;
            }
            this.addDebugLog(`같은 값 개수: ${sameCount}/${vec1.length}`, sameCount > 100 ? 'error' : 'success');
            
            // 메모리 정리
            img1.dispose();
            img2.dispose();
            norm1.dispose();
            norm2.dispose();
            batch1.dispose();
            batch2.dispose();
            features1.dispose();
            features2.dispose();
            
        } catch (error) {
            this.addDebugLog(`모델 테스트 실패: ${error.message}`, 'error');
        }
    }
    
    setupEventListeners() {
        // 모드 전환
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.switchMode(mode);
            });
        });

        // 업로드 영역
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            uploadArea.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const selected = await open({
                        multiple: false,
                        filters: [{
                            name: 'Image',
                            extensions: ['png', 'jpeg', 'jpg', 'gif', 'webp']
                        }]
                    });
                    
                    if (selected) {
                        this.addDebugLog(`파일 선택: ${selected}`, 'info');
                        await this.handleFileUpload(selected);
                    }
                } catch (error) {
                    this.addDebugLog(`파일 선택 실패: ${error.message}`, 'error');
                }
            });
            
            // 드래그 앤 드롭 이벤트들
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', async (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0 && files[0].type.startsWith('image/')) {
                    const file = files[0];
                    this.addDebugLog(`드롭: ${file.name}`, 'info');
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        await this.handleDataUrl(event.target.result, file.name);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // 검색 버튼
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', async () => {
                if (this.uploadedImage) {
                    await this.searchSimilarImages();
                }
            });
        }

        // 폴더 선택
        const selectFolderBtn = document.getElementById('select-folder-btn');
        if (selectFolderBtn) {
            selectFolderBtn.addEventListener('click', async () => {
                await this.selectFolder();
            });
        }

        // DB 초기화
        const clearDbBtn = document.getElementById('clear-db-btn');
        if (clearDbBtn) {
            clearDbBtn.addEventListener('click', async () => {
                if (confirm('DB를 초기화하시겠습니까?')) {
                    await this.clearDB();
                    this.addDebugLog('✅ DB 초기화 완료', 'success');
                    alert('DB가 초기화되었습니다.');
                }
            });
        }
    }

    async handleFileUpload(filePath) {
        try {
            const fileData = await readBinaryFile(filePath);
            const fileName = filePath.split('\\').pop().split('/').pop();
            const blob = new Blob([fileData]);
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                await this.handleDataUrl(e.target.result, fileName);
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            this.addDebugLog(`파일 읽기 실패: ${error.message}`, 'error');
        }
    }

    async handleDataUrl(dataUrl, fileName) {
        const imgElement = document.getElementById('uploaded-image');
        const previewSection = document.getElementById('preview-section');
        
        if (imgElement && previewSection) {
            imgElement.src = dataUrl;
            imgElement.style.display = 'block';
            previewSection.style.display = 'block';
        }
        
        const img = new Image();
        img.onload = async () => {
            this.uploadedImage = {
                file: { name: fileName },
                tensor: await this.preprocessImage(img),
                element: img
            };
            
            const searchBtn = document.getElementById('search-btn');
            if (searchBtn) {
                searchBtn.disabled = false;
            }
            
            this.addDebugLog(`이미지 준비: ${fileName}`, 'success');
        };
        
        img.src = dataUrl;
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        document.querySelectorAll('.mode-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const targetMode = document.getElementById(`${mode}-mode`);
        if (targetMode) {
            targetMode.classList.add('active');
        }
    }

    async preprocessImage(imgElement) {
        return tf.tidy(() => {
            const tensor = tf.browser.fromPixels(imgElement);
            const resized = tf.image.resizeBilinear(tensor, [224, 224]);
            const normalized = resized.div(255.0);
            const batched = normalized.expandDims(0);
            return batched;
        });
    }

    calculateCosineSimilarity(vec1, vec2) {
        if (!vec1 || !vec2 || vec1.length !== vec2.length) {
            return 0;
        }
        
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }
        
        if (norm1 === 0 || norm2 === 0) return 0;
        
        const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        return (similarity + 1) / 2;
    }

    async searchSimilarImages() {
        if (!this.uploadedImage || !this.modelLoaded) {
            this.addDebugLog('이미지/모델 준비 안됨', 'error');
            return;
        }

        this.addDebugLog('검색 시작...', 'info');
        this.showLoading('검색 중...');

        try {
            // 특징 추출
            const queryFeatures = await this.model.infer(this.uploadedImage.tensor, true);
            const queryArray = await queryFeatures.array();
            
            // 새 배열로 완전 복사
            const queryVector = new Float32Array(queryArray[0]);
            
            this.addDebugLog(`쿼리 벡터: ${queryVector.length}차원`, 'info');
            this.addDebugLog(`쿼리 샘플: [${Array.from(queryVector.slice(0, 3)).map(v => v.toFixed(3)).join(', ')}]`, 'info');
            
            queryFeatures.dispose();
            
            // 유사도 계산
            const results = [];
            
            for (const img of this.imageDatabase) {
                const similarity = this.calculateCosineSimilarity(Array.from(queryVector), img.features);
                results.push({
                    ...img,
                    similarity: similarity
                });
            }

            results.sort((a, b) => b.similarity - a.similarity);
            
            // 통계
            if (results.length > 0) {
                const similarities = results.map(r => r.similarity);
                const max = Math.max(...similarities);
                const min = Math.min(...similarities);
                const avg = similarities.reduce((a,b) => a+b, 0) / similarities.length;
                const range = max - min;
                
                this.addDebugLog(`유사도 통계:`, 'info');
                this.addDebugLog(`  최대: ${(max * 100).toFixed(1)}%`, 'info');
                this.addDebugLog(`  최소: ${(min * 100).toFixed(1)}%`, 'info');
                this.addDebugLog(`  평균: ${(avg * 100).toFixed(1)}%`, 'info');
                this.addDebugLog(`  범위: ${(range * 100).toFixed(1)}%`, range < 0.01 ? 'critical' : 'success');
                
                if (range < 0.01) {
                    this.addDebugLog('⚠️ 유사도 범위 문제!', 'critical');
                    alert('유사도 계산 문제. DB 재인덱싱 필요!');
                }
                
                // 상위 3개
                results.slice(0, 3).forEach((r, i) => {
                    this.addDebugLog(`  ${i+1}. ${r.name}: ${(r.similarity * 100).toFixed(1)}%`, 'info');
                });
            }

            await this.displayResults(results);
            
        } catch (error) {
            this.addDebugLog(`검색 실패: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async displayResults(results) {
        const resultsContainer = document.getElementById('search-results');
        const resultsSection = document.getElementById('results-section');
        
        if (!resultsContainer) return;

        resultsContainer.innerHTML = '';

        const topResults = results.slice(0, 20);

        for (const result of topResults) {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            if (result.similarity > 0.8) {
                resultItem.style.border = '3px solid #4CAF50';
            } else if (result.similarity > 0.7) {
                resultItem.style.border = '3px solid #FFC107';
            }
            
            try {
                const imageData = await readBinaryFile(result.path);
                const blob = new Blob([imageData]);
                const imageUrl = URL.createObjectURL(blob);
                
                resultItem.innerHTML = `
                    <img src="${imageUrl}" alt="${result.name}" style="width: 100%; height: auto;">
                    <div style="padding: 10px;">
                        <div style="font-size: 12px;">${result.name}</div>
                        <div style="font-size: 16px; font-weight: bold; color: #2196F3;">
                            ${(result.similarity * 100).toFixed(1)}%
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error(`이미지 로드 실패: ${result.path}`);
            }
            
            resultsContainer.appendChild(resultItem);
        }

        if (resultsSection) {
            resultsSection.style.display = 'block';
        }
    }

    getMimeType(filepath) {
        const ext = filepath.split('.').pop().toLowerCase();
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp'
        };
        return mimeTypes[ext] || 'image/jpeg';
    }

    async selectFolder() {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: '이미지 폴더 선택'
            });

            if (selected) {
                this.addDebugLog(`폴더: ${selected}`, 'info');
                await this.indexFolder(selected);
            }
        } catch (error) {
            this.addDebugLog(`폴더 선택 실패: ${error.message}`, 'error');
        }
    }

    async indexFolder(folderPath) {
        this.showLoading('인덱싱 중...');
        this.addDebugLog(`인덱싱 시작: ${folderPath}`, 'info');

        try {
            const entries = await readDir(folderPath, { recursive: true });
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            const images = [];

            function collectImages(entries) {
                for (const entry of entries) {
                    if (entry.children) {
                        collectImages(entry.children);
                    } else {
                        const ext = entry.name.split('.').pop().toLowerCase();
                        if (imageExtensions.includes(ext)) {
                            images.push({
                                name: entry.name,
                                path: entry.path
                            });
                        }
                    }
                }
            }

            collectImages(entries);
            this.addDebugLog(`${images.length}개 이미지 발견`, 'info');

            // DB 초기화
            this.imageDatabase = [];
            
            let processed = 0;
            const testVectors = [];
            
            for (const imageInfo of images) {
                try {
                    const imageData = await readBinaryFile(imageInfo.path);
                    const blob = new Blob([imageData]);
                    const url = URL.createObjectURL(blob);
                    
                    const img = new Image();
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        img.src = url;
                    });

                    // 전처리
                    const tensor = await this.preprocessImage(img);
                    
                    // 특징 추출
                    const features = await this.model.infer(tensor, true);
                    
                    // 중요: 배열 변환 후 완전 복사
                    const featuresArray = await features.array();
                    
                    // Float32Array로 명시적 복사
                    const featureVector = new Float32Array(featuresArray[0]);
                    
                    // Array로 변환하여 저장
                    const vectorAsArray = Array.from(featureVector);
                    
                    // 처음 3개 디버그
                    if (processed < 3) {
                        this.addDebugLog(`이미지 ${processed + 1}: ${imageInfo.name}`, 'info');
                        this.addDebugLog(`  처음: [${vectorAsArray.slice(0, 3).map(v => v.toFixed(3)).join(', ')}]`, 'info');
                        this.addDebugLog(`  중간: [${vectorAsArray.slice(640, 643).map(v => v.toFixed(3)).join(', ')}]`, 'info');
                        this.addDebugLog(`  끝: [${vectorAsArray.slice(-3).map(v => v.toFixed(3)).join(', ')}]`, 'info');
                        testVectors.push(vectorAsArray);
                    }
                    
                    // DB에 저장
                    this.imageDatabase.push({
                        name: imageInfo.name,
                        path: imageInfo.path,
                        features: vectorAsArray  // Array로 저장
                    });
                    
                    // 메모리 정리 중요!
                    tensor.dispose();
                    features.dispose();
                    URL.revokeObjectURL(url);
                    
                    processed++;
                    
                    if (processed % 10 === 0) {
                        const progress = Math.round((processed / images.length) * 100);
                        this.updateLoadingMessage(`인덱싱... ${processed}/${images.length} (${progress}%)`);
                        this.addDebugLog(`진행: ${progress}%`, 'info');
                        
                        // 메모리 정리
                        await tf.nextFrame();
                        
                        // 가비지 컬렉션 유도
                        if (processed % 20 === 0) {
                            const memory = tf.memory();
                            this.addDebugLog(`메모리: ${memory.numTensors} tensors`, 'info');
                        }
                    }
                    
                } catch (error) {
                    this.addDebugLog(`실패: ${imageInfo.name} - ${error.message}`, 'error');
                    processed++;
                }
            }

            // 테스트
            if (testVectors.length >= 2) {
                const testSim = this.calculateCosineSimilarity(testVectors[0], testVectors[1]);
                this.addDebugLog(`테스트 유사도: ${(testSim * 100).toFixed(1)}%`, testSim > 0.99 ? 'critical' : 'success');
                
                if (testSim > 0.99) {
                    this.addDebugLog('⚠️ 벡터가 거의 동일! 문제!', 'critical');
                }
            }

            await this.saveDatabase();
            
            this.addDebugLog(`✅ 인덱싱 완료: ${this.imageDatabase.length}개`, 'success');
            alert(`인덱싱 완료!\n${this.imageDatabase.length}개의 이미지`);
            
        } catch (error) {
            this.addDebugLog(`인덱싱 실패: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async saveDatabase() {
        try {
            await this.storage.setItem('imageDatabase', this.imageDatabase);
            await this.storage.setItem('version', this.version);
            this.addDebugLog('DB 저장 완료', 'success');
        } catch (error) {
            this.addDebugLog(`DB 저장 실패: ${error.message}`, 'error');
        }
    }

    async loadDatabase() {
        try {
            const version = await this.storage.getItem('version');
            const imageDb = await this.storage.getItem('imageDatabase');
            
            if (imageDb && version === this.version) {
                this.imageDatabase = imageDb;
                this.addDebugLog(`DB 로드: ${this.imageDatabase.length}개`, 'success');
                
                // DB 검증
                if (this.imageDatabase.length >= 2) {
                    const testSim = this.calculateCosineSimilarity(
                        this.imageDatabase[0].features,
                        this.imageDatabase[1].features
                    );
                    this.addDebugLog(`DB 검증 유사도: ${(testSim * 100).toFixed(1)}%`, testSim > 0.99 ? 'critical' : 'info');
                    
                    if (testSim > 0.99) {
                        this.addDebugLog('⚠️ DB 문제! 재인덱싱 필요!', 'critical');
                        alert('DB에 문제가 있습니다. 초기화 후 재인덱싱하세요!');
                    }
                }
            } else if (version !== this.version) {
                this.addDebugLog('버전 변경. 재인덱싱 필요', 'warning');
            }
        } catch (error) {
            this.addDebugLog(`DB 로드 실패: ${error.message}`, 'error');
        }
    }

    async clearDB() {
        await this.storage.clear();
        this.imageDatabase = [];
        this.addDebugLog('DB 초기화 완료', 'success');
    }

    showLoading(message) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
            const textElement = loadingElement.querySelector('.loading-text');
            if (textElement) {
                textElement.textContent = message || '처리 중...';
            }
        }
    }

    updateLoadingMessage(message) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            const textElement = loadingElement.querySelector('.loading-text');
            if (textElement) {
                textElement.textContent = message;
            }
        }
    }

    hideLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
    
    // 디버그 메서드들
    testVectorsComplete() {
        this.addDebugLog('=== 벡터 전체 검사 ===', 'critical');
        
        if (this.imageDatabase.length < 2) {
            this.addDebugLog('이미지 2개 이상 필요', 'warning');
            return;
        }
        
        const vec1 = this.imageDatabase[0].features;
        const vec2 = this.imageDatabase[1].features;
        
        this.addDebugLog(`벡터 차원: ${vec1.length}`, 'info');
        this.addDebugLog(`벡터1 처음: [${vec1.slice(0, 5).map(v => v.toFixed(3)).join(', ')}]`, 'info');
        this.addDebugLog(`벡터1 중간: [${vec1.slice(640, 645).map(v => v.toFixed(3)).join(', ')}]`, 'info');
        this.addDebugLog(`벡터1 끝: [${vec1.slice(-5).map(v => v.toFixed(3)).join(', ')}]`, 'info');
        
        this.addDebugLog(`벡터2 처음: [${vec2.slice(0, 5).map(v => v.toFixed(3)).join(', ')}]`, 'info');
        this.addDebugLog(`벡터2 중간: [${vec2.slice(640, 645).map(v => v.toFixed(3)).join(', ')}]`, 'info');
        this.addDebugLog(`벡터2 끝: [${vec2.slice(-5).map(v => v.toFixed(3)).join(', ')}]`, 'info');
        
        // 같은 값 개수
        let sameCount = 0;
        for (let i = 0; i < vec1.length; i++) {
            if (Math.abs(vec1[i] - vec2[i]) < 0.0001) sameCount++;
        }
        
        this.addDebugLog(`같은 값: ${sameCount}/${vec1.length} (${(sameCount/vec1.length*100).toFixed(1)}%)`, 
                         sameCount > vec1.length * 0.9 ? 'critical' : 'success');
        
        if (sameCount > vec1.length * 0.9) {
            this.addDebugLog('⚠️ 90% 이상 동일! 심각한 문제!', 'critical');
        }
    }
    
    analyzeVectors() {
        this.addDebugLog('=== 벡터 심층 분석 ===', 'critical');
        
        if (this.imageDatabase.length < 3) {
            this.addDebugLog('3개 이상 이미지 필요', 'warning');
            return;
        }
        
        // 처음 3개 이미지의 벡터 분석
        for (let idx = 0; idx < Math.min(3, this.imageDatabase.length); idx++) {
            const vec = this.imageDatabase[idx].features;
            const name = this.imageDatabase[idx].name;
            
            // 통계
            const min = Math.min(...vec);
            const max = Math.max(...vec);
            const avg = vec.reduce((a,b) => a+b, 0) / vec.length;
            const zeros = vec.filter(v => Math.abs(v) < 0.0001).length;
            
            this.addDebugLog(`${idx+1}. ${name}:`, 'info');
            this.addDebugLog(`  범위: ${min.toFixed(3)} ~ ${max.toFixed(3)}`, 'info');
            this.addDebugLog(`  평균: ${avg.toFixed(3)}`, 'info');
            this.addDebugLog(`  제로값: ${zeros}개 (${(zeros/vec.length*100).toFixed(1)}%)`, 'info');
        }
        
        // 벡터 간 차이 분석
        const vec1 = this.imageDatabase[0].features;
        const vec2 = this.imageDatabase[1].features;
        
        let maxDiff = 0;
        let maxDiffIdx = 0;
        let totalDiff = 0;
        
        for (let i = 0; i < vec1.length; i++) {
            const diff = Math.abs(vec1[i] - vec2[i]);
            totalDiff += diff;
            if (diff > maxDiff) {
                maxDiff = diff;
                maxDiffIdx = i;
            }
        }
        
        const avgDiff = totalDiff / vec1.length;
        
        this.addDebugLog(`벡터1 vs 벡터2:`, 'info');
        this.addDebugLog(`  평균 차이: ${avgDiff.toFixed(6)}`, avgDiff < 0.001 ? 'critical' : 'info');
        this.addDebugLog(`  최대 차이: ${maxDiff.toFixed(6)} (위치: ${maxDiffIdx})`, 'info');
        
        if (avgDiff < 0.001) {
            this.addDebugLog('⚠️ 평균 차이가 너무 작음! 벡터가 거의 동일!', 'critical');
        }
    }
    
    showDatabaseInfo() {
        this.addDebugLog('=== DB 정보 ===', 'info');
        this.addDebugLog(`이미지 수: ${this.imageDatabase.length}개`, 'info');
        this.addDebugLog(`DB 버전: ${this.version}`, 'info');
        
        if (this.imageDatabase.length > 0) {
            const sample = this.imageDatabase[0];
            this.addDebugLog(`첫 이미지: ${sample.name}`, 'info');
            this.addDebugLog(`벡터 차원: ${sample.features ? sample.features.length : 0}`, 'info');
            this.addDebugLog(`벡터 타입: ${Array.isArray(sample.features) ? 'Array' : typeof sample.features}`, 'info');
        }
        
        // 메모리 상태
        const memory = tf.memory();
        this.addDebugLog(`TF 메모리: ${memory.numTensors} tensors, ${(memory.numBytes/1048576).toFixed(2)}MB`, 'info');
    }
    
    testSimilarityDebug() {
        this.addDebugLog('=== 유사도 테스트 ===', 'critical');
        
        if (this.imageDatabase.length < 2) {
            this.addDebugLog('이미지 2개 이상 필요', 'warning');
            return;
        }
        
        let minSim = 1, maxSim = 0;
        const pairs = Math.min(5, Math.floor(this.imageDatabase.length / 2));
        
        for (let i = 0; i < pairs; i++) {
            const idx1 = i * 2;
            const idx2 = i * 2 + 1;
            
            if (idx2 < this.imageDatabase.length) {
                const sim = this.calculateCosineSimilarity(
                    this.imageDatabase[idx1].features,
                    this.imageDatabase[idx2].features
                );
                
                this.addDebugLog(`${i+1}. ${this.imageDatabase[idx1].name} vs ${this.imageDatabase[idx2].name}: ${(sim * 100).toFixed(1)}%`, 
                               sim > 0.99 ? 'critical' : 'info');
                
                minSim = Math.min(minSim, sim);
                maxSim = Math.max(maxSim, sim);
            }
        }
        
        const range = maxSim - minSim;
        this.addDebugLog(`유사도 범위: ${(range * 100).toFixed(1)}%`, range < 0.01 ? 'critical' : 'success');
        
        if (range < 0.01) {
            this.addDebugLog('⚠️ 모든 유사도가 거의 동일! DB 재인덱싱 필요!', 'critical');
        } else {
            this.addDebugLog('✅ 유사도 분포 정상', 'success');
        }
    }
}

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Fashion Search v11.8 - Complete Fix');
    
    // CSS 스타일
    const style = document.createElement('style');
    style.textContent = `
        #upload-area { cursor: pointer; transition: all 0.3s; }
        #upload-area:hover { background-color: #f5f5f5; border-color: #2196F3; }
        #upload-area.dragover { background-color: #e3f2fd; border-color: #2196F3; }
        .result-item { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; margin: 10px; }
        #loading { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: none; align-items: center; justify-content: center; z-index: 9999; flex-direction: column; }
        .loading-text { color: white; margin-top: 20px; font-size: 18px; }
        .loader { border: 5px solid #f3f3f3; border-top: 5px solid #2196F3; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .mode-content { display: none; }
        .mode-content.active { display: block; }
    `;
    document.head.appendChild(style);
    
    new FashionSearchComplete();
});
