import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readDir, readBinaryFile } from '@tauri-apps/api/fs';
import localforage from 'localforage';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// Fashion Search v14.0 - 최종 해결 버전
class FashionSearchFinal {
    constructor() {
        this.currentMode = 'search';
        this.uploadedImage = null;
        this.imageDatabase = [];
        this.version = '14.0.0';
        this.model = null;
        this.modelLoaded = false;
        this.debugMode = true;
        this.debugLogs = [];
        
        // 완전히 새로운 DB
        this.storage = localforage.createInstance({
            name: 'FashionSearchDB',
            storeName: 'fashionVectorsV14Final'
        });
        
        this.init();
    }
    
    // 디버그 로그
    addDebugLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${message}`);
        this.debugLogs.push({ message, type, timestamp });
        
        // 화면에 로그 표시
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
            
            // 최대 50개 유지
            while (container.children.length > 50) {
                container.removeChild(container.firstChild);
            }
        }
    }
    
    async init() {
        this.addDebugLog('🚀 Fashion Search v14.0 - 최종 해결 버전', 'critical');
        
        // 디버그 패널 생성
        this.createDebugPanel();
        
        // TensorFlow 초기화 - WebGL 우선 시도
        try {
            await tf.setBackend('webgl');
            await tf.ready();
            
            // WebGL 최적화 설정
            tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
            tf.env().set('WEBGL_FORCE_F16_TEXTURES', false);
            
            this.addDebugLog(`✅ TensorFlow 백엔드: ${tf.getBackend()}`, 'success');
        } catch (error) {
            this.addDebugLog('WebGL 실패, CPU로 전환', 'warning');
            await tf.setBackend('cpu');
            await tf.ready();
        }
        
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
        // 디버그 패널
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            width: 500px;
            max-height: 300px;
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
            <div style="color: #0ff; font-weight: bold; margin-bottom: 5px;">
                🔍 Debug Console v14.0 - FINAL
            </div>
            <div id="debug-log-container" style="overflow-y: auto; max-height: 250px;"></div>
        `;
        
        document.body.appendChild(debugPanel);
        
        // 컨트롤 패널
        const controlPanel = document.createElement('div');
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
        `;
        
        controlPanel.innerHTML = `
            <h3 style="margin-top: 0;">🔧 v14.0 컨트롤</h3>
            <button onclick="fashionApp.testModel()" style="margin: 3px; padding: 5px 10px;">
                🧪 모델 테스트
            </button>
            <button onclick="fashionApp.validateDatabase()" style="margin: 3px; padding: 5px 10px;">
                📊 DB 검증
            </button>
            <button onclick="fashionApp.clearAndReload()" style="margin: 3px; padding: 5px 10px; background: orange;">
                🔄 완전 초기화
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
            
            // MobileNet v2 로드 - alpha=1.0 사용
            this.model = await mobilenet.load({
                version: 2,
                alpha: 1.0
            });
            
            this.modelLoaded = true;
            this.addDebugLog('✅ MobileNet v2 (alpha=1.0) 로드 완료', 'success');
            
            // 모델 테스트
            await this.testModelIntegrity();
            
            this.hideLoading();
        } catch (error) {
            this.addDebugLog(`❌ 모델 로드 실패: ${error.message}`, 'error');
            alert('모델 로드 실패. 인터넷 연결을 확인하세요.');
            this.hideLoading();
        }
    }
    
    async testModelIntegrity() {
        this.addDebugLog('모델 무결성 테스트...', 'info');
        
        // 3개의 테스트 이미지 생성
        const test1 = tf.randomUniform([1, 224, 224, 3]);
        const test2 = tf.zeros([1, 224, 224, 3]);
        const test3 = tf.ones([1, 224, 224, 3]);
        
        // 특징 추출
        const feat1 = await this.model.infer(test1, true);
        const feat2 = await this.model.infer(test2, true);
        const feat3 = await this.model.infer(test3, true);
        
        // 배열로 변환 - 핵심!
        const arr1 = await feat1.data();  // .array() 대신 .data() 사용
        const arr2 = await feat2.data();
        const arr3 = await feat3.data();
        
        // 벡터를 일반 배열로 변환
        const vec1 = Array.from(arr1);
        const vec2 = Array.from(arr2);
        const vec3 = Array.from(arr3);
        
        // 유사도 계산
        const sim12 = this.cosineSimilarity(vec1, vec2);
        const sim13 = this.cosineSimilarity(vec1, vec3);
        const sim23 = this.cosineSimilarity(vec2, vec3);
        
        this.addDebugLog(`테스트 유사도:`, 'critical');
        this.addDebugLog(`  랜덤 vs 검정: ${(sim12 * 100).toFixed(1)}%`, sim12 > 0.9 ? 'error' : 'success');
        this.addDebugLog(`  랜덤 vs 흰색: ${(sim13 * 100).toFixed(1)}%`, sim13 > 0.9 ? 'error' : 'success');
        this.addDebugLog(`  검정 vs 흰색: ${(sim23 * 100).toFixed(1)}%`, sim23 > 0.9 ? 'error' : 'success');
        
        // 정리
        test1.dispose();
        test2.dispose();
        test3.dispose();
        feat1.dispose();
        feat2.dispose();
        feat3.dispose();
        
        if (sim12 > 0.9 || sim13 > 0.9 || sim23 > 0.9) {
            this.addDebugLog('⚠️ 모델에 문제가 있을 수 있습니다!', 'error');
        } else {
            this.addDebugLog('✅ 모델이 정상적으로 작동합니다.', 'success');
        }
    }
    
    async testModel() {
        this.addDebugLog('=== 심층 모델 테스트 ===', 'critical');
        
        // 캔버스로 실제 이미지 생성
        const canvas = document.createElement('canvas');
        canvas.width = 224;
        canvas.height = 224;
        const ctx = canvas.getContext('2d');
        
        const tests = [];
        
        // 빨간색 이미지
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 224, 224);
        const redTensor = tf.browser.fromPixels(canvas).div(255.0).expandDims(0);
        
        // 파란색 이미지
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, 224, 224);
        const blueTensor = tf.browser.fromPixels(canvas).div(255.0).expandDims(0);
        
        // 체크보드 패턴
        for (let i = 0; i < 224; i += 28) {
            for (let j = 0; j < 224; j += 28) {
                ctx.fillStyle = ((i + j) / 28) % 2 === 0 ? 'black' : 'white';
                ctx.fillRect(i, j, 28, 28);
            }
        }
        const patternTensor = tf.browser.fromPixels(canvas).div(255.0).expandDims(0);
        
        // 특징 추출
        const redFeat = await this.model.infer(redTensor, true);
        const blueFeat = await this.model.infer(blueTensor, true);
        const patternFeat = await this.model.infer(patternTensor, true);
        
        // 배열로 변환 - data() 메서드 사용!
        const redVec = Array.from(await redFeat.data());
        const blueVec = Array.from(await blueFeat.data());
        const patternVec = Array.from(await patternFeat.data());
        
        // 유사도 계산
        const simRB = this.cosineSimilarity(redVec, blueVec);
        const simRP = this.cosineSimilarity(redVec, patternVec);
        const simBP = this.cosineSimilarity(blueVec, patternVec);
        
        this.addDebugLog('색상/패턴 유사도:', 'critical');
        this.addDebugLog(`  빨강 vs 파랑: ${(simRB * 100).toFixed(1)}%`, simRB > 0.9 ? 'error' : 'info');
        this.addDebugLog(`  빨강 vs 패턴: ${(simRP * 100).toFixed(1)}%`, simRP > 0.9 ? 'error' : 'info');
        this.addDebugLog(`  파랑 vs 패턴: ${(simBP * 100).toFixed(1)}%`, simBP > 0.9 ? 'error' : 'info');
        
        // 벡터 통계
        this.addDebugLog('벡터 통계:', 'info');
        this.addDebugLog(`  빨강 평균: ${this.mean(redVec).toFixed(3)}`, 'info');
        this.addDebugLog(`  파랑 평균: ${this.mean(blueVec).toFixed(3)}`, 'info');
        this.addDebugLog(`  패턴 평균: ${this.mean(patternVec).toFixed(3)}`, 'info');
        
        // 정리
        redTensor.dispose();
        blueTensor.dispose();
        patternTensor.dispose();
        redFeat.dispose();
        blueFeat.dispose();
        patternFeat.dispose();
    }
    
    mean(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
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
        
        norm1 = Math.sqrt(norm1);
        norm2 = Math.sqrt(norm2);
        
        if (norm1 === 0 || norm2 === 0) return 0;
        
        return dotProduct / (norm1 * norm2);
    }
    
    async validateDatabase() {
        if (this.imageDatabase.length < 2) {
            this.addDebugLog('DB가 비어있습니다. 먼저 이미지를 인덱싱하세요.', 'warning');
            return;
        }
        
        this.addDebugLog('=== DB 검증 ===', 'critical');
        
        const sampleSize = Math.min(5, this.imageDatabase.length);
        const similarities = [];
        
        for (let i = 0; i < sampleSize; i++) {
            for (let j = i + 1; j < sampleSize; j++) {
                const sim = this.cosineSimilarity(
                    this.imageDatabase[i].features,
                    this.imageDatabase[j].features
                );
                similarities.push(sim);
                
                this.addDebugLog(
                    `${i+1} vs ${j+1}: ${(sim * 100).toFixed(1)}%`,
                    sim > 0.95 ? 'error' : 'info'
                );
            }
        }
        
        const avgSim = this.mean(similarities);
        const maxSim = Math.max(...similarities);
        const minSim = Math.min(...similarities);
        const range = maxSim - minSim;
        
        this.addDebugLog(`평균: ${(avgSim * 100).toFixed(1)}%, 범위: ${(range * 100).toFixed(1)}%`, 'critical');
        
        if (range < 0.1) {
            this.addDebugLog('⚠️ 벡터 다양성 부족! DB 재인덱싱 필요!', 'error');
        } else {
            this.addDebugLog('✅ 벡터 다양성 정상', 'success');
        }
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
            const tensor = await this.preprocessImage(img);
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
    
    async preprocessImage(imgElement) {
        return tf.tidy(() => {
            const tensor = tf.browser.fromPixels(imgElement);
            const resized = tf.image.resizeBilinear(tensor, [224, 224]);
            const normalized = resized.div(255.0);
            const batched = normalized.expandDims(0);
            return batched;
        });
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
            const queryFeatures = await this.model.infer(this.uploadedImage.tensor, true);
            const queryData = await queryFeatures.data();  // .data() 사용!
            const queryVector = Array.from(queryData);
            
            queryFeatures.dispose();
            
            this.addDebugLog(`쿼리 벡터: ${queryVector.length}차원`, 'info');
            
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
                    this.addDebugLog('⚠️ 유사도 범위 문제! DB 재인덱싱 필요!', 'error');
                }
            }
            
            await this.displayResults(results);
            
        } catch (error) {
            this.addDebugLog(`❌ 검색 실패: ${error.message}`, 'error');
            alert('검색 중 오류가 발생했습니다.');
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
                transition: all 0.3s;
            `;
            
            // 유사도에 따른 테두리
            if (result.similarity > 0.8) {
                resultItem.style.borderColor = '#4CAF50';
                resultItem.style.borderWidth = '3px';
            } else if (result.similarity > 0.7) {
                resultItem.style.borderColor = '#FFC107';
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
                
                resultItem.onmouseover = () => {
                    resultItem.style.transform = 'scale(1.05)';
                    resultItem.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
                };
                
                resultItem.onmouseout = () => {
                    resultItem.style.transform = '';
                    resultItem.style.boxShadow = '';
                };
                
            } catch (error) {
                resultItem.innerHTML = `
                    <div style="padding: 20px; text-align: center;">
                        <div style="color: #999;">이미지 로드 실패</div>
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
            const vectorSamples = [];
            
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
                    
                    // 전처리
                    const tensor = await this.preprocessImage(img);
                    
                    // 특징 추출 - 핵심!
                    const features = await this.model.infer(tensor, true);
                    
                    // data() 메서드로 Float32Array 가져오기
                    const featuresData = await features.data();
                    
                    // 일반 배열로 변환 - 완전한 복사
                    const featureVector = Array.from(featuresData);
                    
                    // 처음 3개는 상세 로그
                    if (processed < 3) {
                        this.addDebugLog(`이미지 ${processed + 1}: ${imageInfo.name}`, 'info');
                        this.addDebugLog(`  처음 5개: [${featureVector.slice(0, 5).map(v => v.toFixed(3)).join(', ')}]`, 'info');
                        vectorSamples.push(featureVector);
                        
                        // 이전 벡터와 비교
                        if (vectorSamples.length > 1) {
                            const prevVector = vectorSamples[vectorSamples.length - 2];
                            const sim = this.cosineSimilarity(featureVector, prevVector);
                            this.addDebugLog(`  이전과 유사도: ${(sim * 100).toFixed(1)}%`, 
                                sim > 0.95 ? 'error' : 'success');
                        }
                    }
                    
                    // DB에 저장
                    this.imageDatabase.push({
                        name: imageInfo.name,
                        path: imageInfo.path,
                        features: featureVector  // 완전히 복사된 배열
                    });
                    
                    // 메모리 정리 - 매우 중요!
                    tensor.dispose();
                    features.dispose();
                    URL.revokeObjectURL(dataUrl);
                    
                    processed++;
                    
                    // 진행상황
                    if (processed % 10 === 0) {
                        const progress = Math.round((processed / images.length) * 100);
                        this.updateLoadingMessage(`인덱싱 중... ${processed}/${images.length} (${progress}%)`);
                        
                        // 메모리 체크
                        const memory = tf.memory();
                        this.addDebugLog(`메모리: ${memory.numTensors} tensors`, 'info');
                        
                        // 프레임 양보
                        await tf.nextFrame();
                    }
                    
                } catch (error) {
                    this.addDebugLog(`실패: ${imageInfo.name} - ${error.message}`, 'error');
                    processed++;
                }
            }
            
            // 검증
            if (vectorSamples.length >= 2) {
                const sim01 = this.cosineSimilarity(vectorSamples[0], vectorSamples[1]);
                this.addDebugLog(`최종 검증 유사도: ${(sim01 * 100).toFixed(1)}%`, 
                    sim01 > 0.95 ? 'error' : 'success');
                
                if (sim01 > 0.95) {
                    this.addDebugLog('⚠️ 벡터가 너무 비슷합니다!', 'error');
                    alert('인덱싱에 문제가 있습니다. 다시 시도해주세요.');
                }
            }
            
            // DB 저장
            await this.saveDatabase();
            
            this.addDebugLog(`✅ 인덱싱 완료: ${this.imageDatabase.length}개`, 'success');
            alert(`인덱싱 완료!\n${this.imageDatabase.length}개의 이미지가 인덱싱되었습니다.`);
            
        } catch (error) {
            this.addDebugLog(`❌ 인덱싱 실패: ${error.message}`, 'error');
            alert('인덱싱 중 오류가 발생했습니다.');
        } finally {
            this.hideLoading();
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
            
            // DB 삭제
            await this.storage.clear();
            this.imageDatabase = [];
            
            // 모델 재로드
            this.model = null;
            await tf.disposeVariables();
            
            // 페이지 새로고침
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
    console.log('🚀 Fashion Search v14.0 시작');
    
    // 기본 스타일
    const style = document.createElement('style');
    style.textContent = `
        .mode-content { display: none; }
        .mode-content.active { display: block; }
        .mode-btn.active { background-color: #2196F3; color: white; }
        .result-item { cursor: pointer; }
        #upload-area { transition: all 0.3s; cursor: pointer; }
        #upload-area:hover { border-color: #2196F3; background-color: #f5f5f5; }
        #loading { 
            position: fixed; 
            top: 0; 
            left: 0; 
            right: 0; 
            bottom: 0; 
            background: rgba(0,0,0,0.7); 
            display: none; 
            align-items: center; 
            justify-content: center; 
            z-index: 9999; 
            flex-direction: column;
        }
        .loading-text { 
            color: white; 
            margin-top: 20px; 
            font-size: 18px; 
        }
    `;
    document.head.appendChild(style);
    
    // 앱 시작
    new FashionSearchFinal();
});
