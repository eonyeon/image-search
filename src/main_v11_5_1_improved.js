import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readDir, readBinaryFile } from '@tauri-apps/api/fs';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import localforage from 'localforage';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// Fashion Search v11.5.1 - 진단 개선 버전
class FashionSearchDiagnostic {
    constructor() {
        this.currentMode = 'search';
        this.uploadedImage = null;
        this.imageDatabase = [];
        this.version = '11.5.1';
        this.model = null;
        this.modelLoaded = false;
        this.debugMode = true;
        
        // 새 DB (문제 해결을 위해 완전히 새로운 스토어)
        this.storage = localforage.createInstance({
            name: 'FashionSearchDB',
            storeName: 'fashionVectorsV115'
        });
        
        this.modelStorage = localforage.createInstance({
            name: 'FashionSearchModel',
            storeName: 'modelCache'
        });
        
        console.log(`🚀 Fashion Search v${this.version} - 진단 개선 버전`);
        console.log('💡 진단: 인덱싱 모드 → 진단 콘솔 버튼 클릭');
        console.log('💡 또는 콘솔에서: fashionApp.showDiagnostics()');
        this.init();
    }

    async init() {
        console.log('🔧 시스템 초기화 중...');
        
        try {
            await tf.setBackend('webgl');
            await tf.ready();
            console.log('✅ TensorFlow.js 백엔드:', tf.getBackend());
        } catch (error) {
            console.error('⚠️ WebGL 실패, CPU 모드 전환:', error);
            await tf.setBackend('cpu');
        }
        
        await this.loadModel();
        await this.loadDatabase();
        this.setupEventListeners();
        
        console.log('✅ 초기화 완료!');
        console.log('📋 진단 명령어:');
        console.log('  • fashionApp.showDiagnostics() - 진단 팝업');
        console.log('  • fashionApp.showDiagnosticsInPage() - 페이지에 표시');
        console.log('  • fashionApp.testSimilarity() - 유사도 테스트');
        
        window.fashionApp = this;
    }

    async loadModel() {
        try {
            this.showLoading('딥러닝 모델 로드 중...');
            
            this.model = await mobilenet.load({
                version: 2,
                alpha: 1.0
            });
            
            console.log('🧪 모델 테스트 중...');
            await this.testModel();
            
            this.modelLoaded = true;
            console.log('✅ MobileNet v2 모델 준비 완료!');
            this.hideLoading();
        } catch (error) {
            console.error('❌ 모델 로드 실패:', error);
            alert('모델 로드 실패. 인터넷 연결을 확인해주세요.');
            this.hideLoading();
        }
    }

    async testModel() {
        const img1 = tf.randomNormal([224, 224, 3]);
        const img2 = tf.randomNormal([224, 224, 3]);
        
        const batch1 = img1.expandDims(0);
        const batch2 = img2.expandDims(0);
        
        const features1 = await this.model.infer(batch1, true);
        const features2 = await this.model.infer(batch2, true);
        
        const array1 = await features1.array();
        const array2 = await features2.array();
        
        const similarity = this.calculateCosineSimilarity(array1[0], array2[0]);
        
        console.log('🧪 모델 테스트 결과:');
        console.log('  - 랜덤 이미지 유사도:', (similarity * 100).toFixed(2) + '%');
        
        if (similarity > 0.95) {
            console.warn('⚠️ 경고: 모델이 정상 작동하지 않을 수 있습니다!');
        } else {
            console.log('✅ 모델이 정상 작동합니다.');
        }
        
        img1.dispose();
        img2.dispose();
        batch1.dispose();
        batch2.dispose();
        features1.dispose();
        features2.dispose();
    }

    setupEventListeners() {
        console.log('🔧 이벤트 리스너 설정 중...');
        
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
                            extensions: ['png', 'jpeg', 'jpg', 'gif', 'webp', 'bmp']
                        }],
                        title: '검색할 이미지 선택'
                    });
                    
                    if (selected) {
                        await this.handleTauriFileUpload(selected);
                    }
                } catch (error) {
                    console.error('파일 선택 실패:', error);
                }
            });
            
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
                if (confirm('데이터베이스를 초기화하시겠습니까?')) {
                    await this.clearDB();
                    alert('데이터베이스가 초기화되었습니다.');
                }
            });
        }

        // 진단 콘솔 버튼 (이미 HTML에서 처리)
        const consoleBtn = document.getElementById('console-btn');
        if (consoleBtn) {
            console.log('✅ 진단 콘솔 버튼 활성화됨');
        }
    }

    async handleTauriFileUpload(filePath) {
        console.log('📸 파일 처리:', filePath);
        
        try {
            const fileData = await readBinaryFile(filePath);
            const fileName = filePath.split('\\').pop().split('/').pop();
            const blob = new Blob([fileData], { type: this.getMimeType(fileName) });
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                await this.handleDataUrl(e.target.result, fileName);
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('❌ 파일 읽기 실패:', error);
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
            
            console.log(`✅ 이미지 준비 완료: ${fileName}`);
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
            let tensor = tf.browser.fromPixels(imgElement);
            const resized = tf.image.resizeBilinear(tensor, [224, 224]);
            const normalized = resized.div(255.0);
            const batched = normalized.expandDims(0);
            return batched;
        });
    }

    calculateCosineSimilarity(vec1, vec2) {
        if (!vec1 || !vec2 || vec1.length !== vec2.length) {
            console.error('벡터 크기 불일치');
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
        
        norm1 = Math.sqrt(norm1);
        norm2 = Math.sqrt(norm2);
        
        if (norm1 === 0 || norm2 === 0) {
            console.warn('제로 벡터 감지');
            return 0;
        }
        
        const cosineSim = dotProduct / (norm1 * norm2);
        return (cosineSim + 1) / 2;
    }

    async searchSimilarImages() {
        if (!this.uploadedImage || !this.modelLoaded) {
            alert('이미지를 선택하고 모델이 로드될 때까지 기다려주세요.');
            return;
        }

        console.log('🔍 검색 시작...');
        this.showLoading('유사 이미지 검색 중...');

        try {
            const queryFeatures = await this.model.infer(this.uploadedImage.tensor, true);
            const queryArray = await queryFeatures.array();
            const queryVector = Array.from(queryArray[0]);
            queryFeatures.dispose();
            
            console.log('📊 특징 추출 완료');
            
            const results = [];
            
            for (const img of this.imageDatabase) {
                const similarity = this.calculateCosineSimilarity(queryVector, img.features);
                
                results.push({
                    ...img,
                    similarity: similarity
                });
            }

            results.sort((a, b) => b.similarity - a.similarity);

            console.log(`✅ 검색 완료: ${results.length}개 결과`);
            
            if (results.length > 0) {
                const similarities = results.map(r => r.similarity);
                const max = Math.max(...similarities);
                const min = Math.min(...similarities);
                const avg = similarities.reduce((a,b) => a+b, 0) / similarities.length;
                
                console.log('📈 유사도 분포:');
                console.log(`  - 최대: ${(max * 100).toFixed(1)}%`);
                console.log(`  - 최소: ${(min * 100).toFixed(1)}%`);
                console.log(`  - 평균: ${(avg * 100).toFixed(1)}%`);
                
                if (max - min < 0.01) {
                    console.error('⚠️ 경고: 모든 유사도가 거의 동일합니다!');
                    alert('경고: 유사도 계산에 문제가 있습니다. DB를 재인덱싱해주세요.');
                }
            }

            await this.displayResults(results);
            
        } catch (error) {
            console.error('❌ 검색 실패:', error);
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
            
            if (result.similarity > 0.8) {
                resultItem.style.border = '3px solid #4CAF50';
            } else if (result.similarity > 0.7) {
                resultItem.style.border = '3px solid #FFC107';
            } else if (result.similarity > 0.6) {
                resultItem.style.border = '3px solid #FF9800';
            }
            
            try {
                const imageData = await readBinaryFile(result.path);
                const blob = new Blob([imageData], { 
                    type: this.getMimeType(result.path) 
                });
                const imageUrl = URL.createObjectURL(blob);
                
                resultItem.innerHTML = `
                    <img src="${imageUrl}" alt="${result.name}" style="width: 100%; height: auto;">
                    <div class="result-info" style="padding: 10px;">
                        <div style="font-size: 12px;">${result.name}</div>
                        <div style="font-size: 16px; font-weight: bold; color: #2196F3;">
                            ${(result.similarity * 100).toFixed(1)}%
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error(`이미지 로드 실패: ${result.path}`, error);
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
            'webp': 'image/webp',
            'bmp': 'image/bmp'
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
                console.log(`폴더 선택됨: ${selected}`);
                await this.indexFolder(selected);
            }
        } catch (error) {
            console.error('폴더 선택 실패:', error);
        }
    }

    async indexFolder(folderPath) {
        this.showLoading('이미지 인덱싱 중...');
        console.log(`📁 폴더 인덱싱 시작: ${folderPath}`);

        try {
            const entries = await readDir(folderPath, { recursive: true });
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            const images = [];

            function collectImages(entries, basePath = '') {
                for (const entry of entries) {
                    if (entry.children) {
                        collectImages(entry.children, `${basePath}${entry.name}/`);
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
            console.log(`🖼️ ${images.length}개의 이미지 발견`);

            this.imageDatabase = [];
            
            let processed = 0;
            const featureVectors = [];
            
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

                    const tensor = await this.preprocessImage(img);
                    const features = await this.model.infer(tensor, true);
                    const featuresArray = await features.array();
                    
                    const featureVector = Array.from(featuresArray[0]);
                    
                    if (processed < 3) {
                        console.log(`🔍 이미지 ${processed + 1} (${imageInfo.name}):`);
                        console.log('  - 특징 샘플:', featureVector.slice(0, 5));
                        featureVectors.push(featureVector);
                    }
                    
                    this.imageDatabase.push({
                        name: imageInfo.name,
                        path: imageInfo.path,
                        features: featureVector
                    });
                    
                    tensor.dispose();
                    features.dispose();
                    URL.revokeObjectURL(url);
                    
                    processed++;
                    
                    if (processed % 10 === 0) {
                        const progress = Math.round((processed / images.length) * 100);
                        this.updateLoadingMessage(`인덱싱 중... (${processed}/${images.length}) - ${progress}%`);
                        await tf.nextFrame();
                    }
                    
                } catch (error) {
                    console.error(`이미지 처리 실패: ${imageInfo.name}`, error);
                    processed++;
                }
            }

            if (featureVectors.length >= 2) {
                const sim = this.calculateCosineSimilarity(featureVectors[0], featureVectors[1]);
                console.log(`📊 테스트 유사도 (이미지 1 vs 2): ${(sim * 100).toFixed(1)}%`);
            }

            await this.saveDatabase();
            
            console.log(`✅ 인덱싱 완료: ${this.imageDatabase.length}개`);
            
            alert(`인덱싱 완료!\n${this.imageDatabase.length}개의 이미지가 인덱싱되었습니다.`);
            
        } catch (error) {
            console.error('인덱싱 실패:', error);
            alert('인덱싱 중 오류가 발생했습니다.');
        } finally {
            this.hideLoading();
        }
    }

    async saveDatabase() {
        try {
            await this.storage.setItem('imageDatabase', this.imageDatabase);
            await this.storage.setItem('version', this.version);
            console.log('💾 데이터베이스 저장 완료');
        } catch (error) {
            console.error('데이터베이스 저장 실패:', error);
        }
    }

    async loadDatabase() {
        try {
            const version = await this.storage.getItem('version');
            const imageDb = await this.storage.getItem('imageDatabase');
            
            if (imageDb && version === this.version) {
                this.imageDatabase = imageDb;
                console.log(`📂 ${this.imageDatabase.length}개의 이미지 로드됨`);
                
                if (this.imageDatabase.length > 0) {
                    const sample = this.imageDatabase[0];
                    console.log('📋 DB 검증:');
                    console.log('  - 첫 이미지:', sample.name);
                    console.log('  - 특징 차원:', sample.features ? sample.features.length : 'N/A');
                }
            }
        } catch (error) {
            console.error('데이터베이스 로드 실패:', error);
        }
    }

    async clearDB() {
        await this.storage.clear();
        this.imageDatabase = [];
        console.log('🗑️ DB 초기화 완료');
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

    // === 진단 메서드들 ===
    
    version() {
        return `Fashion Search v${this.version} - 진단 개선 버전`;
    }
    
    // 팝업으로 진단 결과 보여주기 (개선된 버전)
    showDiagnostics() {
        const lines = [];
        lines.push(`=== Fashion Search v${this.version} 진단 결과 ===`);
        lines.push('');
        lines.push(`📊 시스템 상태:`);
        lines.push(`  • TensorFlow: ${tf.getBackend()}`);
        lines.push(`  • 모델 로드: ${this.modelLoaded ? '✅ 완료' : '❌ 실패'}`);
        lines.push(`  • 이미지 DB: ${this.imageDatabase.length}개`);
        lines.push('');
        
        if (this.imageDatabase.length >= 2) {
            const img1 = this.imageDatabase[0];
            const img2 = this.imageDatabase[1];
            const sim = this.calculateCosineSimilarity(img1.features, img2.features);
            
            lines.push(`🧪 유사도 테스트:`);
            lines.push(`  • ${img1.name}`);
            lines.push(`  • ${img2.name}`);
            lines.push(`  • 유사도: ${(sim * 100).toFixed(1)}%`);
            lines.push('');
            
            if (sim > 0.99) {
                lines.push(`⚠️ 문제 발견!`);
                lines.push(`유사도가 비정상적으로 높습니다 (99.9%).`);
                lines.push(`해결 방법:`);
                lines.push(`  1. DB 초기화 클릭`);
                lines.push(`  2. 폴더 재인덱싱`);
            } else if (sim > 0.95) {
                lines.push(`⚠️ 주의: 유사도가 높습니다.`);
                lines.push(`다른 이미지로도 테스트해보세요.`);
            } else {
                lines.push(`✅ 정상 작동 중!`);
                lines.push(`유사도가 정상 범위입니다.`);
            }
        } else {
            lines.push(`ℹ️ 테스트 불가:`);
            lines.push(`이미지를 2개 이상 인덱싱한 후`);
            lines.push(`다시 시도해주세요.`);
        }
        
        lines.push('');
        lines.push(`💡 추가 명령어 (콘솔):`);
        lines.push(`  • fashionApp.testSimilarity()`);
        lines.push(`  • fashionApp.checkFeatures()`);
        lines.push(`  • fashionApp.clearDB()`);
        
        const message = lines.join('\n');
        alert(message);
        console.log(message);
        return message;
    }
    
    // 페이지 내에 진단 결과 표시
    showDiagnosticsInPage() {
        const diagnosticDiv = document.createElement('div');
        diagnosticDiv.id = 'diagnostic-results';
        diagnosticDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #2196F3;
            border-radius: 10px;
            padding: 20px;
            max-width: 500px;
            max-height: 70vh;
            overflow-y: auto;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✖ 닫기';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 5px;
            cursor: pointer;
        `;
        closeBtn.onclick = () => diagnosticDiv.remove();
        
        const content = document.createElement('pre');
        content.style.cssText = `
            font-family: 'Consolas', monospace;
            font-size: 14px;
            white-space: pre-wrap;
            margin-top: 30px;
        `;
        
        const diagnostics = [];
        diagnostics.push(`🔍 Fashion Search v${this.version} 진단\n`);
        diagnostics.push(`시스템 상태:`);
        diagnostics.push(`  TensorFlow: ${tf.getBackend()}`);
        diagnostics.push(`  모델: ${this.modelLoaded ? '✅' : '❌'}`);
        diagnostics.push(`  DB: ${this.imageDatabase.length}개\n`);
        
        if (this.imageDatabase.length >= 2) {
            const sim = this.testSimilarity();
            diagnostics.push(`유사도 테스트: ${sim}`);
            
            if (parseFloat(sim) > 99) {
                diagnostics.push(`\n⚠️ 99.9% 버그 감지!`);
                diagnostics.push(`DB 초기화 후 재인덱싱 필요`);
            } else {
                diagnostics.push(`\n✅ 정상 작동 중`);
            }
        }
        
        content.textContent = diagnostics.join('\n');
        
        diagnosticDiv.appendChild(closeBtn);
        diagnosticDiv.appendChild(content);
        document.body.appendChild(diagnosticDiv);
        
        return 'Diagnostic panel opened';
    }

    testSimilarity() {
        if (this.imageDatabase.length < 2) {
            return '이미지 부족';
        }
        
        const img1 = this.imageDatabase[0];
        const img2 = this.imageDatabase[1];
        const similarity = this.calculateCosineSimilarity(img1.features, img2.features);
        
        return `${(similarity * 100).toFixed(1)}%`;
    }
    
    checkFeatures() {
        if (this.imageDatabase.length === 0) {
            return '이미지 없음';
        }
        
        const sample = this.imageDatabase[0];
        console.log('특징 벡터 체크:');
        console.log('- 이미지:', sample.name);
        console.log('- 차원:', sample.features.length);
        console.log('- 처음 10개:', sample.features.slice(0, 10));
        
        return sample.features;
    }
}

// DOM 로드 완료 후 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM 로드 완료, 앱 초기화 시작...');
    
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
    
    new FashionSearchDiagnostic();
    
    console.log('🎯 Fashion Search v11.5.1 초기화 완료!');
    console.log('💡 진단 방법:');
    console.log('  1. 인덱싱 모드 → 진단 콘솔 버튼');
    console.log('  2. 콘솔에서 fashionApp.showDiagnostics()');
    console.log('  3. 페이지 내 표시: fashionApp.showDiagnosticsInPage()');
});

// 전역 에러 처리
window.addEventListener('error', (event) => {
    console.error('전역 에러:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('처리되지 않은 Promise 거부:', event.reason);
});
