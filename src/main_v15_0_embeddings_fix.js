import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readDir, readBinaryFile } from '@tauri-apps/api/fs';
import localforage from 'localforage';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// Fashion Search v15.0 - Embeddings Layer 문제 해결
class FashionSearchEmbeddingsFix {
    constructor() {
        this.currentMode = 'search';
        this.uploadedImage = null;
        this.imageDatabase = [];
        this.version = '15.0.0';
        this.model = null;
        this.modelLoaded = false;
        this.debugMode = true;
        this.debugLogs = [];
        
        // 새 DB
        this.storage = localforage.createInstance({
            name: 'FashionSearchDB',
            storeName: 'fashionVectorsV15EmbeddingsFix'
        });
        
        this.init();
    }
    
    addDebugLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${message}`);
        this.debugLogs.push({ message, type, timestamp });
        
        const container = document.getElementById('debug-log-container');
        if (container) {
            const logEntry = document.createElement('div');
            const colors = {
                info: '#0f0',
                error: '#f00',
                warning: '#ff0',
                success: '#0ff',
                critical: '#f0f'
            };
            logEntry.style.cssText = `color: ${colors[type]}; margin: 2px 0; font-size: 11px;`;
            logEntry.textContent = `${timestamp} ${message}`;
            container.appendChild(logEntry);
            container.scrollTop = container.scrollHeight;
            
            while (container.children.length > 50) {
                container.removeChild(container.firstChild);
            }
        }
    }
    
    async init() {
        this.addDebugLog('🚀 Fashion Search v15.0 - Embeddings Fix', 'critical');
        
        // 디버그 패널 생성
        this.createDebugPanel();
        
        // TensorFlow 초기화 - CPU 모드로 시작
        this.addDebugLog('CPU 백엔드로 시작 (안정성 우선)', 'warning');
        await tf.setBackend('cpu');
        await tf.ready();
        this.addDebugLog(`✅ TensorFlow 백엔드: ${tf.getBackend()}`, 'success');
        
        // 모델 로드
        await this.loadModel();
        
        // DB 로드
        await this.loadDatabase();
        
        // 이벤트 리스너
        this.setupEventListeners();
        
        // 전역 등록
        window.fashionApp = this;
        
        this.addDebugLog('✅ 초기화 완료!', 'success');
    }
    
    createDebugPanel() {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            width: 550px;
            max-height: 350px;
            background: rgba(0, 0, 0, 0.95);
            color: #0f0;
            border: 2px solid #0f0;
            border-radius: 5px;
            padding: 10px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            z-index: 10000;
        `;
        
        debugPanel.innerHTML = `
            <div style="color: #ff0; font-weight: bold; margin-bottom: 5px;">
                🔍 Debug Console v15.0 - EMBEDDINGS FIX
            </div>
            <div id="debug-log-container" style="overflow-y: auto; max-height: 300px;"></div>
        `;
        
        document.body.appendChild(debugPanel);
        
        const controlPanel = document.createElement('div');
        controlPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(255, 0, 0, 0.95);
            color: white;
            padding: 15px;
            border-radius: 5px;
            font-family: Arial;
            font-size: 13px;
            z-index: 9999;
        `;
        
        controlPanel.innerHTML = `
            <h3 style="margin-top: 0;">🔧 v15.0 Embeddings 컨트롤</h3>
            <button onclick="fashionApp.deepTestModel()" style="margin: 3px; padding: 5px 10px;">
                🔬 심층 모델 테스트
            </button>
            <button onclick="fashionApp.testDirectInference()" style="margin: 3px; padding: 5px 10px;">
                🎯 직접 추론 테스트
            </button>
            <button onclick="fashionApp.switchBackend()" style="margin: 3px; padding: 5px 10px;">
                🔄 백엔드 전환
            </button>
            <button onclick="fashionApp.clearAndReload()" style="margin: 3px; padding: 5px 10px; background: red;">
                💣 완전 초기화
            </button>
        `;
        
        document.body.appendChild(controlPanel);
    }
    
    async loadModel() {
        try {
            this.showLoading('MobileNet v2 모델 로드 중...');
            this.addDebugLog('모델 로드 시작...', 'warning');
            
            // 기존 모델 정리
            if (this.model) {
                this.model = null;
                await tf.disposeVariables();
            }
            
            // MobileNet v2 로드 - 다른 설정 시도
            this.model = await mobilenet.load({
                version: 2,
                alpha: 0.75  // 1.0 대신 0.75 사용
            });
            
            this.modelLoaded = true;
            this.addDebugLog('✅ MobileNet v2 (alpha=0.75) 로드', 'success');
            
            // 모델 구조 확인
            await this.inspectModel();
            
            this.hideLoading();
        } catch (error) {
            this.addDebugLog(`❌ 모델 로드 실패: ${error.message}`, 'error');
            this.hideLoading();
        }
    }
    
    async inspectModel() {
        this.addDebugLog('=== 모델 구조 검사 ===', 'critical');
        
        // 테스트 이미지
        const testImage = tf.randomUniform([1, 224, 224, 3]);
        
        // embeddings=false로 시도 (분류 출력)
        const classOutput = await this.model.infer(testImage, false);
        this.addDebugLog(`분류 출력 shape: ${classOutput.shape}`, 'info');
        
        // embeddings=true로 시도 (특징 벡터)
        const embeddings = await this.model.infer(testImage, true);
        this.addDebugLog(`임베딩 출력 shape: ${embeddings.shape}`, 'info');
        
        // 실제 값 확인
        const embData = await embeddings.data();
        const embArray = Array.from(embData);
        
        // 통계 계산
        const nonZeros = embArray.filter(v => Math.abs(v) > 0.001).length;
        const uniqueValues = new Set(embArray.map(v => v.toFixed(3))).size;
        const avgValue = embArray.reduce((a,b) => a+b, 0) / embArray.length;
        const maxValue = Math.max(...embArray);
        const minValue = Math.min(...embArray);
        
        this.addDebugLog(`벡터 통계:`, 'critical');
        this.addDebugLog(`  길이: ${embArray.length}`, 'info');
        this.addDebugLog(`  0이 아닌 값: ${nonZeros}/${embArray.length}`, nonZeros < 100 ? 'error' : 'success');
        this.addDebugLog(`  고유 값 수: ${uniqueValues}`, uniqueValues < 100 ? 'error' : 'success');
        this.addDebugLog(`  평균: ${avgValue.toFixed(4)}`, 'info');
        this.addDebugLog(`  최소: ${minValue.toFixed(4)}`, 'info');
        this.addDebugLog(`  최대: ${maxValue.toFixed(4)}`, 'info');
        
        // 처음 10개 값
        this.addDebugLog(`처음 10개: [${embArray.slice(0, 10).map(v => v.toFixed(3)).join(', ')}]`, 'info');
        
        // 정리
        testImage.dispose();
        classOutput.dispose();
        embeddings.dispose();
    }
    
    async deepTestModel() {
        this.addDebugLog('=== 심층 모델 테스트 ===', 'critical');
        
        // 실제 이미지로 테스트
        const canvas = document.createElement('canvas');
        canvas.width = 224;
        canvas.height = 224;
        const ctx = canvas.getContext('2d');
        
        // 테스트 1: 순수 색상
        const colors = ['red', 'green', 'blue', 'yellow'];
        const colorVectors = [];
        
        for (const color of colors) {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 224, 224);
            
            const tensor = tf.browser.fromPixels(canvas);
            const normalized = tensor.div(255.0);
            const batched = normalized.expandDims(0);
            
            // 임베딩 추출
            const embeddings = await this.model.infer(batched, true);
            const data = await embeddings.data();
            const vector = Array.from(data);
            
            colorVectors.push({color, vector});
            
            this.addDebugLog(`${color}: [${vector.slice(0, 5).map(v => v.toFixed(3)).join(', ')}...]`, 'info');
            
            // 정리
            tensor.dispose();
            normalized.dispose();
            batched.dispose();
            embeddings.dispose();
        }
        
        // 유사도 계산
        this.addDebugLog('색상 간 유사도:', 'critical');
        for (let i = 0; i < colorVectors.length; i++) {
            for (let j = i + 1; j < colorVectors.length; j++) {
                const sim = this.cosineSimilarity(colorVectors[i].vector, colorVectors[j].vector);
                const color = sim > 0.9 ? 'error' : sim > 0.7 ? 'warning' : 'success';
                this.addDebugLog(`  ${colorVectors[i].color} vs ${colorVectors[j].color}: ${(sim * 100).toFixed(1)}%`, color);
            }
        }
    }
    
    async testDirectInference() {
        this.addDebugLog('=== 직접 추론 테스트 ===', 'critical');
        
        // 다른 방법으로 특징 추출 시도
        const testImg = tf.randomUniform([1, 224, 224, 3]);
        
        // 방법 1: classify 사용
        try {
            const predictions = await this.model.classify(testImg);
            this.addDebugLog(`classify 결과: ${predictions.length}개 클래스`, 'info');
        } catch (error) {
            this.addDebugLog(`classify 실패: ${error.message}`, 'error');
        }
        
        // 방법 2: 레이어별 출력 시도
        try {
            // embeddings=true는 보통 마지막-1 레이어
            const embeddings = await this.model.infer(testImg, true);
            const shape = embeddings.shape;
            this.addDebugLog(`임베딩 shape: [${shape}]`, 'info');
            
            // 실제 값 확인
            const data = await embeddings.data();
            const arr = Array.from(data);
            
            // 값 분포 분석
            const histogram = {};
            arr.forEach(v => {
                const bucket = Math.floor(v * 10) / 10;
                histogram[bucket] = (histogram[bucket] || 0) + 1;
            });
            
            const sortedBuckets = Object.entries(histogram)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            
            this.addDebugLog('값 분포 (상위 5개):', 'info');
            sortedBuckets.forEach(([bucket, count]) => {
                this.addDebugLog(`  ${bucket}: ${count}개`, 'info');
            });
            
            embeddings.dispose();
        } catch (error) {
            this.addDebugLog(`임베딩 추출 실패: ${error.message}`, 'error');
        }
        
        testImg.dispose();
    }
    
    async switchBackend() {
        const current = tf.getBackend();
        const newBackend = current === 'webgl' ? 'cpu' : 'webgl';
        
        this.addDebugLog(`백엔드 전환: ${current} → ${newBackend}`, 'warning');
        
        await tf.setBackend(newBackend);
        await tf.ready();
        
        this.addDebugLog(`✅ 새 백엔드: ${tf.getBackend()}`, 'success');
        
        // 모델 재로드
        await this.loadModel();
    }
    
    // 새로운 특징 추출 메서드 - 핵심!
    async extractFeatures(imgElement) {
        return tf.tidy(() => {
            // 이미지를 텐서로 변환
            const tensor = tf.browser.fromPixels(imgElement);
            
            // 크기 조정
            const resized = tf.image.resizeBilinear(tensor, [224, 224]);
            
            // 정규화 - MobileNet v2는 -1 ~ 1 범위 사용
            const normalized = resized.sub(127.5).div(127.5);
            
            // 배치 차원 추가
            const batched = normalized.expandDims(0);
            
            return batched;
        });
    }
    
    async getEmbeddings(tensor) {
        // 임베딩 추출
        const embeddings = await this.model.infer(tensor, true);
        
        // 데이터 가져오기
        const data = await embeddings.data();
        
        // 배열로 변환 전에 복사본 생성
        const buffer = new ArrayBuffer(data.byteLength);
        const view = new Float32Array(buffer);
        view.set(data);
        
        // 정리
        embeddings.dispose();
        
        // 새 배열 반환
        return Array.from(view);
    }
    
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
    
    setupEventListeners() {
        // 모드 전환
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchMode(e.currentTarget.dataset.mode);
            });
        });
        
        // 파일 업로드
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            uploadArea.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.selectImageFile();
            });
            
            // 드래그 앤 드롭
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.backgroundColor = '#e3f2fd';
            });
            
            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.style.backgroundColor = '';
            });
            
            uploadArea.addEventListener('drop', async (e) => {
                e.preventDefault();
                uploadArea.style.backgroundColor = '';
                
                const files = e.dataTransfer.files;
                if (files.length > 0 && files[0].type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        await this.handleImageDataUrl(event.target.result, files[0].name);
                    };
                    reader.readAsDataURL(files[0]);
                }
            });
        }
        
        // 검색 버튼
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.searchSimilarImages());
        }
        
        // 폴더 선택
        const selectFolderBtn = document.getElementById('select-folder-btn');
        if (selectFolderBtn) {
            selectFolderBtn.addEventListener('click', () => this.selectFolder());
        }
        
        // DB 초기화
        const clearDbBtn = document.getElementById('clear-db-btn');
        if (clearDbBtn) {
            clearDbBtn.addEventListener('click', () => this.clearAndReload());
        }
    }
    
    async selectImageFile() {
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
                const imageData = await readBinaryFile(selected);
                const blob = new Blob([imageData]);
                const dataUrl = await this.blobToDataURL(blob);
                const fileName = selected.split('\\').pop().split('/').pop();
                await this.handleImageDataUrl(dataUrl, fileName);
            }
        } catch (error) {
            this.addDebugLog(`파일 선택 실패: ${error.message}`, 'error');
        }
    }
    
    async handleImageDataUrl(dataUrl, fileName) {
        this.addDebugLog(`이미지 로드: ${fileName}`, 'info');
        
        const imgElement = document.getElementById('uploaded-image');
        const previewSection = document.getElementById('preview-section');
        
        if (imgElement && previewSection) {
            imgElement.src = dataUrl;
            imgElement.style.display = 'block';
            previewSection.style.display = 'block';
        }
        
        const img = new Image();
        img.onload = async () => {
            const tensor = await this.extractFeatures(img);
            this.uploadedImage = {
                fileName: fileName,
                tensor: tensor,
                element: img
            };
            
            const searchBtn = document.getElementById('search-btn');
            if (searchBtn) {
                searchBtn.disabled = false;
                searchBtn.style.opacity = '1';
            }
            
            this.addDebugLog(`✅ 이미지 준비 완료`, 'success');
        };
        
        img.src = dataUrl;
    }
    
    async searchSimilarImages() {
        if (!this.uploadedImage || !this.modelLoaded) {
            alert('이미지를 업로드하고 모델이 로드될 때까지 기다려주세요.');
            return;
        }
        
        this.addDebugLog('검색 시작...', 'info');
        this.showLoading('유사 이미지 검색 중...');
        
        try {
            // 쿼리 이미지 특징 추출
            const queryVector = await this.getEmbeddings(this.uploadedImage.tensor);
            
            this.addDebugLog(`쿼리 벡터: ${queryVector.length}차원`, 'info');
            this.addDebugLog(`쿼리 샘플: [${queryVector.slice(0, 5).map(v => v.toFixed(3)).join(', ')}]`, 'info');
            
            // 유사도 계산
            const results = [];
            
            for (const img of this.imageDatabase) {
                const similarity = this.cosineSimilarity(queryVector, img.features);
                results.push({
                    ...img,
                    similarity: similarity
                });
            }
            
            results.sort((a, b) => b.similarity - a.similarity);
            
            // 통계
            if (results.length > 0) {
                const sims = results.map(r => r.similarity);
                const maxSim = Math.max(...sims);
                const minSim = Math.min(...sims);
                const range = maxSim - minSim;
                
                this.addDebugLog('유사도 통계:', 'critical');
                this.addDebugLog(`  최대: ${(maxSim * 100).toFixed(1)}%`, 'info');
                this.addDebugLog(`  최소: ${(minSim * 100).toFixed(1)}%`, 'info');
                this.addDebugLog(`  범위: ${(range * 100).toFixed(1)}%`, range < 0.1 ? 'error' : 'success');
                
                if (range < 0.05) {
                    this.addDebugLog('⚠️ 유사도 범위 문제! 모델 재초기화 필요!', 'error');
                }
            }
            
            await this.displayResults(results);
            
        } catch (error) {
            this.addDebugLog(`❌ 검색 실패: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async selectFolder() {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: '이미지 폴더 선택'
            });
            
            if (selected) {
                this.addDebugLog(`폴더 선택: ${selected}`, 'info');
                await this.indexFolder(selected);
            }
        } catch (error) {
            this.addDebugLog(`폴더 선택 실패: ${error.message}`, 'error');
        }
    }
    
    async indexFolder(folderPath) {
        this.showLoading('이미지 인덱싱 중...');
        this.addDebugLog(`=== 인덱싱 시작 ===`, 'critical');
        
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
            
            // 초기화
            this.imageDatabase = [];
            
            let processed = 0;
            const testVectors = [];
            
            for (const imageInfo of images) {
                try {
                    // 이미지 로드
                    const imageData = await readBinaryFile(imageInfo.path);
                    const blob = new Blob([imageData]);
                    const dataUrl = await this.blobToDataURL(blob);
                    
                    // 이미지 엘리먼트 생성
                    const img = new Image();
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        img.src = dataUrl;
                    });
                    
                    // 특징 추출
                    const tensor = await this.extractFeatures(img);
                    const featureVector = await this.getEmbeddings(tensor);
                    
                    // 처음 3개 상세 로그
                    if (processed < 3) {
                        this.addDebugLog(`이미지 ${processed + 1}: ${imageInfo.name}`, 'info');
                        this.addDebugLog(`  처음 5개: [${featureVector.slice(0, 5).map(v => v.toFixed(3)).join(', ')}]`, 'info');
                        
                        // 값 분석
                        const nonZeros = featureVector.filter(v => Math.abs(v) > 0.001).length;
                        this.addDebugLog(`  0이 아닌 값: ${nonZeros}/${featureVector.length}`, 
                            nonZeros < 100 ? 'error' : 'info');
                        
                        if (testVectors.length > 0) {
                            const sim = this.cosineSimilarity(featureVector, testVectors[testVectors.length - 1]);
                            this.addDebugLog(`  이전과 유사도: ${(sim * 100).toFixed(1)}%`, 
                                sim > 0.95 ? 'error' : 'success');
                        }
                        
                        testVectors.push(featureVector);
                    }
                    
                    // DB에 저장
                    this.imageDatabase.push({
                        name: imageInfo.name,
                        path: imageInfo.path,
                        features: featureVector
                    });
                    
                    // 메모리 정리
                    tensor.dispose();
                    URL.revokeObjectURL(dataUrl);
                    
                    processed++;
                    
                    // 진행상황
                    if (processed % 10 === 0) {
                        const progress = Math.round((processed / images.length) * 100);
                        this.updateLoadingMessage(`인덱싱 중... ${processed}/${images.length} (${progress}%)`);
                        
                        const memory = tf.memory();
                        this.addDebugLog(`메모리: ${memory.numTensors} tensors`, 'info');
                        
                        await tf.nextFrame();
                    }
                    
                } catch (error) {
                    this.addDebugLog(`실패: ${imageInfo.name} - ${error.message}`, 'error');
                    processed++;
                }
            }
            
            // 최종 검증
            if (testVectors.length >= 2) {
                const finalSim = this.cosineSimilarity(testVectors[0], testVectors[1]);
                this.addDebugLog(`최종 검증 유사도: ${(finalSim * 100).toFixed(1)}%`, 
                    finalSim > 0.95 ? 'error' : 'success');
                
                if (finalSim > 0.95) {
                    this.addDebugLog('⚠️ 벡터가 너무 비슷합니다!', 'error');
                    this.addDebugLog('백엔드를 전환하거나 모델을 재로드해보세요.', 'warning');
                }
            }
            
            // DB 저장
            await this.saveDatabase();
            
            this.addDebugLog(`✅ 인덱싱 완료: ${this.imageDatabase.length}개`, 'success');
            alert(`인덱싱 완료!\n${this.imageDatabase.length}개의 이미지가 인덱싱되었습니다.`);
            
        } catch (error) {
            this.addDebugLog(`❌ 인덱싱 실패: ${error.message}`, 'error');
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
            resultItem.style.cssText = `
                border: 2px solid #ddd;
                border-radius: 8px;
                overflow: hidden;
                margin: 10px;
                display: inline-block;
                width: 200px;
                vertical-align: top;
            `;
            
            if (result.similarity > 0.8) {
                resultItem.style.borderColor = '#4CAF50';
                resultItem.style.borderWidth = '3px';
            }
            
            try {
                const imageData = await readBinaryFile(result.path);
                const blob = new Blob([imageData]);
                const imageUrl = URL.createObjectURL(blob);
                
                resultItem.innerHTML = `
                    <img src="${imageUrl}" alt="${result.name}" 
                         style="width: 100%; height: 200px; object-fit: cover;">
                    <div style="padding: 10px;">
                        <div style="font-size: 12px; overflow: hidden; text-overflow: ellipsis;">
                            ${result.name}
                        </div>
                        <div style="font-size: 20px; font-weight: bold; color: #2196F3;">
                            ${(result.similarity * 100).toFixed(1)}%
                        </div>
                    </div>
                `;
            } catch (error) {
                resultItem.innerHTML = `
                    <div style="padding: 20px; text-align: center;">
                        <div>${result.name}</div>
                        <div style="font-size: 20px; font-weight: bold; color: #2196F3;">
                            ${(result.similarity * 100).toFixed(1)}%
                        </div>
                    </div>
                `;
            }
            
            resultsContainer.appendChild(resultItem);
        }
        
        if (resultsSection) {
            resultsSection.style.display = 'block';
        }
    }
    
    async blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
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
                this.addDebugLog(`DB 로드: ${this.imageDatabase.length}개 이미지`, 'success');
            } else {
                this.addDebugLog('새 버전 - DB 초기화 필요', 'warning');
            }
        } catch (error) {
            this.addDebugLog(`DB 로드 실패: ${error.message}`, 'error');
        }
    }
    
    async clearAndReload() {
        if (confirm('모든 데이터를 삭제하고 새로 시작하시겠습니까?')) {
            this.addDebugLog('완전 초기화 시작...', 'critical');
            
            await this.storage.clear();
            this.imageDatabase = [];
            
            this.model = null;
            await tf.disposeVariables();
            
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
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
        
        this.addDebugLog(`모드 전환: ${mode}`, 'info');
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
}

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Fashion Search v15.0 - Embeddings Fix');
    
    const style = document.createElement('style');
    style.textContent = `
        .mode-content { display: none; }
        .mode-content.active { display: block; }
        .mode-btn.active { background-color: #2196F3; color: white; }
        #upload-area { transition: all 0.3s; cursor: pointer; }
        #upload-area:hover { border-color: #2196F3; background-color: #f5f5f5; }
    `;
    document.head.appendChild(style);
    
    new FashionSearchEmbeddingsFix();
});
