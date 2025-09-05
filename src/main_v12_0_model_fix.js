import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readDir, readBinaryFile } from '@tauri-apps/api/fs';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import localforage from 'localforage';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// Fashion Search v12.0 - 모델 문제 해결 버전
class FashionSearchModelFix {
    constructor() {
        this.currentMode = 'search';
        this.uploadedImage = null;
        this.imageDatabase = [];
        this.version = '12.0.0';
        this.model = null;
        this.modelLoaded = false;
        this.debugMode = true;
        this.debugLogs = [];
        
        // 새 DB
        this.storage = localforage.createInstance({
            name: 'FashionSearchDB',
            storeName: 'fashionVectorsV120ModelFix'
        });
        
        this.init();
    }
    
    // 디버그 로그
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
                width: 500px;
                max-height: 400px;
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
            title.textContent = '🔍 Debug Console v12.0 - MODEL FIX';
            panel.appendChild(title);
            
            const logContainer = document.createElement('div');
            logContainer.id = 'debug-log-container';
            panel.appendChild(logContainer);
            
            document.body.appendChild(panel);
        }
        
        const logContainer = document.getElementById('debug-log-container');
        if (logContainer) {
            const recentLogs = this.debugLogs.slice(-30);
            
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
        this.addDebugLog('🚀 Fashion Search v12.0 - 모델 문제 해결', 'critical');
        this.addDebugLog('⚠️ CPU 백엔드로 테스트', 'warning');
        
        try {
            // CPU 백엔드로 먼저 시도
            await tf.setBackend('cpu');
            await tf.ready();
            this.addDebugLog(`TensorFlow 백엔드: ${tf.getBackend()}`, 'warning');
            
            // 메모리 상태
            const memory = tf.memory();
            this.addDebugLog(`초기 메모리: ${memory.numTensors} tensors`, 'info');
        } catch (error) {
            this.addDebugLog(`백엔드 설정 실패: ${error.message}`, 'error');
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
            background: rgba(255, 0, 0, 0.95);
            color: white;
            padding: 15px;
            border-radius: 5px;
            font-family: Arial;
            font-size: 13px;
            z-index: 9999;
            max-width: 400px;
        `;
        
        controlPanel.innerHTML = `
            <h3 style="margin-top: 0;">🔧 디버그 컨트롤 v12.0</h3>
            <p style="color: yellow;">⚠️ 모델 문제 해결 테스트</p>
            <button id="test-backend-btn" style="margin: 3px; padding: 5px 10px;">백엔드 전환</button>
            <button id="test-raw-model-btn" style="margin: 3px; padding: 5px 10px;">Raw 모델 테스트</button>
            <button id="test-image-processing-btn" style="margin: 3px; padding: 5px 10px;">이미지 처리 테스트</button>
            <button id="reload-model-btn" style="margin: 3px; padding: 5px 10px;">모델 재로드</button>
            <button id="clear-all-btn" style="margin: 3px; padding: 5px 10px; background: red;">완전 초기화</button>
        `;
        
        document.body.appendChild(controlPanel);
        
        document.getElementById('test-backend-btn').onclick = () => this.switchBackend();
        document.getElementById('test-raw-model-btn').onclick = () => this.testRawModel();
        document.getElementById('test-image-processing-btn').onclick = () => this.testImageProcessing();
        document.getElementById('reload-model-btn').onclick = () => this.reloadModel();
        document.getElementById('clear-all-btn').onclick = () => this.completeReset();
    }
    
    async loadModel() {
        try {
            this.showLoading('모델 로드 중...');
            this.addDebugLog('MobileNet v2 로드 시작...', 'warning');
            
            // 캐시 클리어
            if (this.model) {
                this.model = null;
                await tf.disposeVariables();
            }
            
            // 모델 로드 - alpha를 0.5로 낮춰서 테스트
            this.model = await mobilenet.load({
                version: 2,
                alpha: 0.5  // 더 작은 모델로 테스트
            });
            
            this.modelLoaded = true;
            this.addDebugLog('✅ 모델 로드 완료 (alpha=0.5)', 'success');
            
            // 즉시 모델 테스트
            await this.testRawModel();
            
            this.hideLoading();
        } catch (error) {
            this.addDebugLog(`❌ 모델 로드 실패: ${error.message}`, 'error');
            this.hideLoading();
        }
    }
    
    async testRawModel() {
        this.addDebugLog('=== RAW 모델 테스트 ===', 'critical');
        
        try {
            // 3개의 완전히 다른 패턴 이미지 생성
            const img1 = tf.randomUniform([224, 224, 3], 0, 1);  // 랜덤
            const img2 = tf.zeros([224, 224, 3]);                // 검정
            const img3 = tf.ones([224, 224, 3]);                 // 흰색
            
            const batch1 = img1.expandDims(0);
            const batch2 = img2.expandDims(0);
            const batch3 = img3.expandDims(0);
            
            // infer 대신 predict 사용해보기
            this.addDebugLog('모델 추론 방식: infer(embeddings=true)', 'info');
            
            const features1 = await this.model.infer(batch1, true);
            const features2 = await this.model.infer(batch2, true);
            const features3 = await this.model.infer(batch3, true);
            
            // 동기적으로 배열 가져오기
            const arr1 = await features1.arraySync();
            const arr2 = await features2.arraySync();
            const arr3 = await features3.arraySync();
            
            this.addDebugLog(`벡터 차원: ${arr1[0].length}`, 'info');
            
            // 각 벡터의 통계
            const stats1 = this.getVectorStats(arr1[0]);
            const stats2 = this.getVectorStats(arr2[0]);
            const stats3 = this.getVectorStats(arr3[0]);
            
            this.addDebugLog('랜덤 이미지:', 'info');
            this.addDebugLog(`  처음 5개: [${arr1[0].slice(0, 5).map(v => v.toFixed(3)).join(', ')}]`, 'info');
            this.addDebugLog(`  통계: min=${stats1.min.toFixed(3)}, max=${stats1.max.toFixed(3)}, std=${stats1.std.toFixed(3)}`, 'info');
            
            this.addDebugLog('검정 이미지:', 'info');
            this.addDebugLog(`  처음 5개: [${arr2[0].slice(0, 5).map(v => v.toFixed(3)).join(', ')}]`, 'info');
            this.addDebugLog(`  통계: min=${stats2.min.toFixed(3)}, max=${stats2.max.toFixed(3)}, std=${stats2.std.toFixed(3)}`, 'info');
            
            this.addDebugLog('흰색 이미지:', 'info');
            this.addDebugLog(`  처음 5개: [${arr3[0].slice(0, 5).map(v => v.toFixed(3)).join(', ')}]`, 'info');
            this.addDebugLog(`  통계: min=${stats3.min.toFixed(3)}, max=${stats3.max.toFixed(3)}, std=${stats3.std.toFixed(3)}`, 'info');
            
            // 유사도 계산
            const sim12 = this.calculateCosineSimilarity(arr1[0], arr2[0]);
            const sim13 = this.calculateCosineSimilarity(arr1[0], arr3[0]);
            const sim23 = this.calculateCosineSimilarity(arr2[0], arr3[0]);
            
            this.addDebugLog(`유사도:`, 'critical');
            this.addDebugLog(`  랜덤 vs 검정: ${(sim12 * 100).toFixed(1)}%`, sim12 > 0.95 ? 'error' : 'success');
            this.addDebugLog(`  랜덤 vs 흰색: ${(sim13 * 100).toFixed(1)}%`, sim13 > 0.95 ? 'error' : 'success');
            this.addDebugLog(`  검정 vs 흰색: ${(sim23 * 100).toFixed(1)}%`, sim23 > 0.95 ? 'error' : 'success');
            
            // 표준편차가 너무 작으면 문제
            if (stats1.std < 0.01 || stats2.std < 0.01 || stats3.std < 0.01) {
                this.addDebugLog('⚠️ 벡터 분산이 너무 작음! 모델 문제!', 'error');
            }
            
            // 메모리 정리
            img1.dispose();
            img2.dispose();
            img3.dispose();
            batch1.dispose();
            batch2.dispose();
            batch3.dispose();
            features1.dispose();
            features2.dispose();
            features3.dispose();
            
        } catch (error) {
            this.addDebugLog(`모델 테스트 실패: ${error.message}`, 'error');
        }
    }
    
    getVectorStats(vector) {
        const min = Math.min(...vector);
        const max = Math.max(...vector);
        const avg = vector.reduce((a,b) => a+b, 0) / vector.length;
        
        // 표준편차
        const variance = vector.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / vector.length;
        const std = Math.sqrt(variance);
        
        // 유니크 값 개수
        const unique = new Set(vector.map(v => v.toFixed(3))).size;
        
        return { min, max, avg, std, unique };
    }
    
    async testImageProcessing() {
        this.addDebugLog('=== 이미지 전처리 테스트 ===', 'critical');
        
        // 캔버스로 테스트 이미지 생성
        const canvas = document.createElement('canvas');
        canvas.width = 224;
        canvas.height = 224;
        const ctx = canvas.getContext('2d');
        
        // 빨간 사각형
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 224, 224);
        
        const redImage = tf.browser.fromPixels(canvas);
        
        // 파란 사각형
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, 224, 224);
        
        const blueImage = tf.browser.fromPixels(canvas);
        
        // 정규화 테스트
        const redNorm = redImage.div(255.0);
        const blueNorm = blueImage.div(255.0);
        
        const redBatch = redNorm.expandDims(0);
        const blueBatch = blueNorm.expandDims(0);
        
        // 특징 추출
        const redFeatures = await this.model.infer(redBatch, true);
        const blueFeatures = await this.model.infer(blueBatch, true);
        
        const redArr = await redFeatures.arraySync();
        const blueArr = await blueFeatures.arraySync();
        
        this.addDebugLog('빨간 이미지 벡터:', 'info');
        this.addDebugLog(`  [${redArr[0].slice(0, 5).map(v => v.toFixed(3)).join(', ')}...]`, 'info');
        
        this.addDebugLog('파란 이미지 벡터:', 'info');
        this.addDebugLog(`  [${blueArr[0].slice(0, 5).map(v => v.toFixed(3)).join(', ')}...]`, 'info');
        
        const similarity = this.calculateCosineSimilarity(redArr[0], blueArr[0]);
        this.addDebugLog(`빨강 vs 파랑 유사도: ${(similarity * 100).toFixed(1)}%`, similarity > 0.95 ? 'error' : 'success');
        
        // 정리
        redImage.dispose();
        blueImage.dispose();
        redNorm.dispose();
        blueNorm.dispose();
        redBatch.dispose();
        blueBatch.dispose();
        redFeatures.dispose();
        blueFeatures.dispose();
    }
    
    async switchBackend() {
        const currentBackend = tf.getBackend();
        const newBackend = currentBackend === 'webgl' ? 'cpu' : 'webgl';
        
        this.addDebugLog(`백엔드 전환: ${currentBackend} → ${newBackend}`, 'warning');
        
        await tf.setBackend(newBackend);
        await tf.ready();
        
        this.addDebugLog(`✅ 새 백엔드: ${tf.getBackend()}`, 'success');
        
        // 모델 재로드
        await this.reloadModel();
    }
    
    async reloadModel() {
        this.addDebugLog('모델 재로드 시작...', 'warning');
        
        // 기존 모델 정리
        if (this.model) {
            this.model = null;
        }
        
        // 가비지 컬렉션
        await tf.disposeVariables();
        const memory = tf.memory();
        this.addDebugLog(`메모리 정리: ${memory.numTensors} tensors`, 'info');
        
        // 다시 로드
        await this.loadModel();
    }
    
    async completeReset() {
        if (confirm('모든 데이터를 삭제하고 처음부터 시작하시겠습니까?')) {
            this.addDebugLog('완전 초기화 시작...', 'critical');
            
            // DB 삭제
            await this.clearDB();
            
            // 모델 삭제
            this.model = null;
            
            // TensorFlow 정리
            await tf.disposeVariables();
            
            // 페이지 새로고침
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    }
    
    setupEventListeners() {
        // 기본 이벤트 리스너들...
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.switchMode(mode);
            });
        });

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
                        this.addDebugLog(`파일: ${selected}`, 'info');
                        await this.handleFileUpload(selected);
                    }
                } catch (error) {
                    this.addDebugLog(`파일 선택 실패: ${error.message}`, 'error');
                }
            });
        }

        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', async () => {
                if (this.uploadedImage) {
                    await this.searchSimilarImages();
                }
            });
        }

        const selectFolderBtn = document.getElementById('select-folder-btn');
        if (selectFolderBtn) {
            selectFolderBtn.addEventListener('click', async () => {
                await this.selectFolder();
            });
        }

        const clearDbBtn = document.getElementById('clear-db-btn');
        if (clearDbBtn) {
            clearDbBtn.addEventListener('click', async () => {
                if (confirm('DB를 초기화하시겠습니까?')) {
                    await this.clearDB();
                    this.addDebugLog('DB 초기화 완료', 'success');
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
            // 이미지를 텐서로 변환
            const tensor = tf.browser.fromPixels(imgElement);
            
            // 크기 조정
            const resized = tf.image.resizeBilinear(tensor, [224, 224]);
            
            // 정규화 - MobileNet은 -1 ~ 1 범위를 기대할 수도 있음
            // const normalized = resized.sub(127.5).div(127.5);
            
            // 또는 0 ~ 1 범위
            const normalized = resized.div(255.0);
            
            // 배치 차원 추가
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
        
        // -1 ~ 1을 0 ~ 1로 변환
        return (similarity + 1) / 2;
    }

    async searchSimilarImages() {
        if (!this.uploadedImage || !this.modelLoaded) {
            return;
        }

        this.addDebugLog('검색 시작...', 'info');
        this.showLoading('검색 중...');

        try {
            // 특징 추출
            const queryFeatures = await this.model.infer(this.uploadedImage.tensor, true);
            const queryArray = await queryFeatures.arraySync();
            const queryVector = queryArray[0];
            
            this.addDebugLog(`쿼리 벡터: ${queryVector.length}차원`, 'info');
            
            const stats = this.getVectorStats(queryVector);
            this.addDebugLog(`쿼리 통계: std=${stats.std.toFixed(3)}, unique=${stats.unique}`, 'info');
            
            queryFeatures.dispose();
            
            // 유사도 계산
            const results = [];
            
            for (const img of this.imageDatabase) {
                const similarity = this.calculateCosineSimilarity(queryVector, img.features);
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
                const range = max - min;
                
                this.addDebugLog(`유사도 범위: ${(range * 100).toFixed(1)}%`, range < 0.01 ? 'error' : 'success');
                
                if (range < 0.01) {
                    this.addDebugLog('⚠️ 모델 문제! 백엔드 전환 시도', 'error');
                }
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
                    
                    // 특징 추출 - arraySync 사용
                    const features = await this.model.infer(tensor, true);
                    const featuresArray = await features.arraySync();
                    const featureVector = featuresArray[0];
                    
                    // 처음 3개 상세 디버그
                    if (processed < 3) {
                        this.addDebugLog(`이미지 ${processed + 1}: ${imageInfo.name}`, 'info');
                        const stats = this.getVectorStats(featureVector);
                        this.addDebugLog(`  통계: std=${stats.std.toFixed(3)}, unique=${stats.unique}`, 'info');
                        this.addDebugLog(`  샘플: [${featureVector.slice(0, 5).map(v => v.toFixed(3)).join(', ')}]`, 'info');
                        testVectors.push(featureVector);
                    }
                    
                    // 저장
                    this.imageDatabase.push({
                        name: imageInfo.name,
                        path: imageInfo.path,
                        features: [...featureVector]  // 스프레드 연산자로 복사
                    });
                    
                    // 메모리 정리
                    tensor.dispose();
                    features.dispose();
                    URL.revokeObjectURL(url);
                    
                    processed++;
                    
                    if (processed % 10 === 0) {
                        const progress = Math.round((processed / images.length) * 100);
                        this.updateLoadingMessage(`인덱싱... ${processed}/${images.length} (${progress}%)`);
                        await tf.nextFrame();
                    }
                    
                } catch (error) {
                    this.addDebugLog(`실패: ${imageInfo.name}`, 'error');
                    processed++;
                }
            }

            // 테스트
            if (testVectors.length >= 2) {
                const testSim = this.calculateCosineSimilarity(testVectors[0], testVectors[1]);
                this.addDebugLog(`테스트 유사도: ${(testSim * 100).toFixed(1)}%`, testSim > 0.95 ? 'error' : 'success');
                
                if (testSim > 0.95) {
                    this.addDebugLog('⚠️ 모델 문제 감지!', 'error');
                    this.addDebugLog('백엔드 전환 또는 모델 재로드 시도', 'warning');
                }
            }

            await this.saveDatabase();
            
            this.addDebugLog(`✅ 인덱싱 완료: ${this.imageDatabase.length}개`, 'success');
            alert(`인덱싱 완료!\n${this.imageDatabase.length}개`);
            
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
            const imageDb = await this.storage.getItem('imageDatabase');
            
            if (imageDb) {
                this.imageDatabase = imageDb;
                this.addDebugLog(`DB 로드: ${this.imageDatabase.length}개`, 'success');
            }
        } catch (error) {
            this.addDebugLog(`DB 로드 실패: ${error.message}`, 'error');
        }
    }

    async clearDB() {
        await this.storage.clear();
        this.imageDatabase = [];
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

// DOM 로드
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Fashion Search v12.0 - Model Fix');
    
    const style = document.createElement('style');
    style.textContent = `
        #upload-area { cursor: pointer; transition: all 0.3s; }
        #upload-area:hover { background-color: #f5f5f5; border-color: #2196F3; }
        .result-item { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; margin: 10px; }
        #loading { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: none; align-items: center; justify-content: center; z-index: 9999; flex-direction: column; }
        .loading-text { color: white; margin-top: 20px; font-size: 18px; }
        .loader { border: 5px solid #f3f3f3; border-top: 5px solid #2196F3; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .mode-content { display: none; }
        .mode-content.active { display: block; }
    `;
    document.head.appendChild(style);
    
    new FashionSearchModelFix();
});
