import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readDir, readBinaryFile } from '@tauri-apps/api/fs';
import localforage from 'localforage';
import * as tf from '@tensorflow/tfjs';

// Fashion Search v16.0 - 색상 히스토그램 기반 (MobileNet 대체)
class FashionSearchColorBased {
    constructor() {
        this.currentMode = 'search';
        this.uploadedImage = null;
        this.imageDatabase = [];
        this.version = '16.0.0';
        this.debugMode = true;
        this.debugLogs = [];
        
        // 새 DB
        this.storage = localforage.createInstance({
            name: 'FashionSearchDB',
            storeName: 'fashionVectorsV16ColorBased'
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
        this.addDebugLog('🚀 Fashion Search v16.0 - 색상 기반 검색', 'critical');
        this.addDebugLog('MobileNet 대신 색상 히스토그램 사용', 'warning');
        
        // 디버그 패널 생성
        this.createDebugPanel();
        
        // TensorFlow는 이미지 처리용으로만 사용
        await tf.ready();
        this.addDebugLog(`✅ TensorFlow 준비 완료`, 'success');
        
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
                🎨 Debug Console v16.0 - COLOR BASED
            </div>
            <div id="debug-log-container" style="overflow-y: auto; max-height: 300px;"></div>
        `;
        
        document.body.appendChild(debugPanel);
        
        const controlPanel = document.createElement('div');
        controlPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
            color: white;
            padding: 15px;
            border-radius: 5px;
            font-family: Arial;
            font-size: 13px;
            z-index: 9999;
        `;
        
        controlPanel.innerHTML = `
            <h3 style="margin-top: 0;">🎨 v16.0 색상 기반</h3>
            <button onclick="fashionApp.testColorExtraction()" style="margin: 3px; padding: 5px 10px;">
                🎨 색상 추출 테스트
            </button>
            <button onclick="fashionApp.validateDatabase()" style="margin: 3px; padding: 5px 10px;">
                📊 DB 검증
            </button>
            <button onclick="fashionApp.clearAndReload()" style="margin: 3px; padding: 5px 10px; background: red;">
                💣 완전 초기화
            </button>
        `;
        
        document.body.appendChild(controlPanel);
    }
    
    // 색상 히스토그램 추출 (핵심!)
    extractColorFeatures(imageData) {
        // RGB 색상 공간을 8x8x8 = 512개 빈으로 나눔
        const bins = 8;
        const histogram = new Array(bins * bins * bins).fill(0);
        const pixelCount = imageData.width * imageData.height;
        
        // HSV 추가 특징
        const hueHistogram = new Array(36).fill(0); // 360도를 36개 구간으로
        const saturationSum = { low: 0, mid: 0, high: 0 };
        const brightnessSum = { dark: 0, mid: 0, bright: 0 };
        
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // RGB 히스토그램
            const rBin = Math.floor(r / (256 / bins));
            const gBin = Math.floor(g / (256 / bins));
            const bBin = Math.floor(b / (256 / bins));
            const binIndex = rBin * bins * bins + gBin * bins + bBin;
            histogram[binIndex]++;
            
            // RGB to HSV
            const hsv = this.rgbToHsv(r, g, b);
            
            // Hue 히스토그램 (색상)
            const hueBin = Math.floor(hsv.h / 10);
            hueHistogram[hueBin]++;
            
            // Saturation 분류 (채도)
            if (hsv.s < 0.33) saturationSum.low++;
            else if (hsv.s < 0.66) saturationSum.mid++;
            else saturationSum.high++;
            
            // Brightness 분류 (명도)
            if (hsv.v < 0.33) brightnessSum.dark++;
            else if (hsv.v < 0.66) brightnessSum.mid++;
            else brightnessSum.bright++;
        }
        
        // 정규화
        const normalizedHistogram = histogram.map(val => val / pixelCount);
        const normalizedHue = hueHistogram.map(val => val / pixelCount);
        
        // 특징 벡터 생성 (총 512 + 36 + 3 + 3 = 554차원)
        const features = [
            ...normalizedHistogram,
            ...normalizedHue,
            saturationSum.low / pixelCount,
            saturationSum.mid / pixelCount,
            saturationSum.high / pixelCount,
            brightnessSum.dark / pixelCount,
            brightnessSum.mid / pixelCount,
            brightnessSum.bright / pixelCount
        ];
        
        // 추가: 주요 색상 추출 (상위 5개)
        const colorCounts = {};
        for (let i = 0; i < data.length; i += 4) {
            const r = Math.floor(data[i] / 32) * 32;
            const g = Math.floor(data[i + 1] / 32) * 32;
            const b = Math.floor(data[i + 2] / 32) * 32;
            const key = `${r},${g},${b}`;
            colorCounts[key] = (colorCounts[key] || 0) + 1;
        }
        
        const topColors = Object.entries(colorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([color, count]) => {
                const [r, g, b] = color.split(',').map(Number);
                return [r/255, g/255, b/255, count/pixelCount];
            })
            .flat();
        
        // 상위 5개 색상 정보 추가 (5 * 4 = 20차원)
        while (topColors.length < 20) {
            topColors.push(0);
        }
        
        features.push(...topColors);
        
        return features; // 총 574차원
    }
    
    rgbToHsv(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        
        let h = 0;
        let s = max === 0 ? 0 : diff / max;
        let v = max;
        
        if (diff !== 0) {
            if (max === r) {
                h = ((g - b) / diff + (g < b ? 6 : 0)) * 60;
            } else if (max === g) {
                h = ((b - r) / diff + 2) * 60;
            } else {
                h = ((r - g) / diff + 4) * 60;
            }
        }
        
        return { h, s, v };
    }
    
    async testColorExtraction() {
        this.addDebugLog('=== 색상 추출 테스트 ===', 'critical');
        
        // 테스트 이미지 생성
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        const testCases = [
            { name: '빨강', color: 'red' },
            { name: '파랑', color: 'blue' },
            { name: '초록', color: 'green' },
            { name: '검정', color: 'black' },
            { name: '흰색', color: 'white' }
        ];
        
        const vectors = [];
        
        for (const test of testCases) {
            ctx.fillStyle = test.color;
            ctx.fillRect(0, 0, 100, 100);
            
            const imageData = ctx.getImageData(0, 0, 100, 100);
            const features = this.extractColorFeatures(imageData);
            
            vectors.push({ name: test.name, features });
            
            // 주요 특징 출력
            const rgbStart = features.slice(0, 10);
            this.addDebugLog(`${test.name}: [${rgbStart.map(v => v.toFixed(3)).join(', ')}...]`, 'info');
        }
        
        // 유사도 테스트
        this.addDebugLog('색상 간 유사도:', 'critical');
        for (let i = 0; i < vectors.length; i++) {
            for (let j = i + 1; j < vectors.length; j++) {
                const sim = this.cosineSimilarity(vectors[i].features, vectors[j].features);
                const color = sim > 0.9 ? 'error' : sim > 0.7 ? 'warning' : 'success';
                this.addDebugLog(`  ${vectors[i].name} vs ${vectors[j].name}: ${(sim * 100).toFixed(1)}%`, color);
            }
        }
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
        
        const avgSim = similarities.reduce((a, b) => a + b, 0) / similarities.length;
        const maxSim = Math.max(...similarities);
        const minSim = Math.min(...similarities);
        const range = maxSim - minSim;
        
        this.addDebugLog(`평균: ${(avgSim * 100).toFixed(1)}%, 범위: ${(range * 100).toFixed(1)}%`, 'critical');
        
        if (range < 0.2) {
            this.addDebugLog('⚠️ 다양성 부족! 색상 차이가 적습니다.', 'error');
        } else {
            this.addDebugLog('✅ 색상 다양성 정상', 'success');
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
            // Canvas에서 이미지 데이터 추출
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            
            // 색상 특징 추출
            const features = this.extractColorFeatures(imageData);
            
            this.uploadedImage = {
                fileName: fileName,
                features: features,
                element: img
            };
            
            const searchBtn = document.getElementById('search-btn');
            if (searchBtn) {
                searchBtn.disabled = false;
                searchBtn.style.opacity = '1';
            }
            
            this.addDebugLog(`✅ 이미지 준비 완료 (${features.length}차원)`, 'success');
        };
        
        img.src = dataUrl;
    }
    
    async searchSimilarImages() {
        if (!this.uploadedImage) {
            alert('이미지를 업로드해주세요.');
            return;
        }
        
        this.addDebugLog('검색 시작...', 'info');
        this.showLoading('유사 이미지 검색 중...');
        
        try {
            const queryVector = this.uploadedImage.features;
            
            this.addDebugLog(`쿼리 벡터: ${queryVector.length}차원`, 'info');
            this.addDebugLog(`색상 특징: [${queryVector.slice(0, 5).map(v => v.toFixed(3)).join(', ')}...]`, 'info');
            
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
                this.addDebugLog(`  범위: ${(range * 100).toFixed(1)}%`, range < 0.2 ? 'error' : 'success');
                
                // 상위 5개 결과
                this.addDebugLog('상위 5개 결과:', 'info');
                results.slice(0, 5).forEach((r, i) => {
                    this.addDebugLog(`  ${i+1}. ${r.name}: ${(r.similarity * 100).toFixed(1)}%`, 'info');
                });
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
        this.addDebugLog(`=== 색상 기반 인덱싱 시작 ===`, 'critical');
        
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
                    
                    // Canvas에서 색상 추출
                    const canvas = document.createElement('canvas');
                    const maxSize = 200; // 성능을 위해 크기 제한
                    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const imageDataCanvas = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    // 색상 특징 추출
                    const featureVector = this.extractColorFeatures(imageDataCanvas);
                    
                    // 처음 3개 상세 로그
                    if (processed < 3) {
                        this.addDebugLog(`이미지 ${processed + 1}: ${imageInfo.name}`, 'info');
                        this.addDebugLog(`  특징: [${featureVector.slice(0, 5).map(v => v.toFixed(3)).join(', ')}...]`, 'info');
                        
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
                    URL.revokeObjectURL(dataUrl);
                    
                    processed++;
                    
                    // 진행상황
                    if (processed % 10 === 0) {
                        const progress = Math.round((processed / images.length) * 100);
                        this.updateLoadingMessage(`인덱싱 중... ${processed}/${images.length} (${progress}%)`);
                        await new Promise(resolve => setTimeout(resolve, 0)); // 프레임 양보
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
            }
            
            // DB 저장
            await this.saveDatabase();
            
            this.addDebugLog(`✅ 색상 인덱싱 완료: ${this.imageDatabase.length}개`, 'success');
            alert(`인덱싱 완료!\n${this.imageDatabase.length}개의 이미지가 색상 기반으로 인덱싱되었습니다.`);
            
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
                border: 3px solid #ddd;
                border-radius: 8px;
                overflow: hidden;
                margin: 10px;
                display: inline-block;
                width: 200px;
                vertical-align: top;
                transition: all 0.3s;
            `;
            
            // 유사도에 따른 그라데이션 테두리
            const hue = 120 * result.similarity; // 0=빨강, 120=초록
            resultItem.style.borderImage = `linear-gradient(45deg, 
                hsl(${hue}, 100%, 50%), 
                hsl(${hue + 30}, 100%, 50%)) 1`;
            
            try {
                const imageData = await readBinaryFile(result.path);
                const blob = new Blob([imageData]);
                const imageUrl = URL.createObjectURL(blob);
                
                resultItem.innerHTML = `
                    <img src="${imageUrl}" alt="${result.name}" 
                         style="width: 100%; height: 200px; object-fit: cover;">
                    <div style="padding: 10px; background: linear-gradient(to bottom, white, #f0f0f0);">
                        <div style="font-size: 12px; overflow: hidden; text-overflow: ellipsis;">
                            ${result.name}
                        </div>
                        <div style="font-size: 24px; font-weight: bold; 
                                    background: linear-gradient(45deg, #667eea, #764ba2);
                                    -webkit-background-clip: text;
                                    -webkit-text-fill-color: transparent;">
                            ${(result.similarity * 100).toFixed(1)}%
                        </div>
                    </div>
                `;
            } catch (error) {
                resultItem.innerHTML = `
                    <div style="padding: 20px; text-align: center;">
                        <div>${result.name}</div>
                        <div style="font-size: 24px; font-weight: bold;">
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
    console.log('🎨 Fashion Search v16.0 - Color Based');
    
    const style = document.createElement('style');
    style.textContent = `
        .mode-content { display: none; }
        .mode-content.active { display: block; }
        .mode-btn.active { 
            background: linear-gradient(45deg, #667eea, #764ba2); 
            color: white; 
        }
        #upload-area { 
            transition: all 0.3s; 
            cursor: pointer;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        #upload-area:hover { 
            border-color: #667eea; 
            transform: scale(1.02);
        }
        .result-item:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
    `;
    document.head.appendChild(style);
    
    new FashionSearchColorBased();
});
