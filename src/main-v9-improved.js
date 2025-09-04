import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readDir, readBinaryFile } from '@tauri-apps/api/fs';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import localforage from 'localforage';

// 브랜드 가방 특화 검색 시스템 v9.0 - LV/Chanel 구분 강화
class AdvancedBrandBagSearch {
    constructor() {
        this.currentMode = 'search';
        this.uploadedImage = null;
        this.imageDatabase = [];
        this.version = '9.0.0';
        
        // LocalForage 설정
        this.storage = localforage.createInstance({
            name: 'BrandBagDB',
            storeName: 'brandBagVectorsV9'
        });
        
        console.log(`👜 Advanced Brand Bag Search v${this.version} - LV/Chanel 정확도 개선`);
        this.init();
    }

    async init() {
        console.log('✅ 시스템 초기화 중...');
        await this.loadDatabase();
        this.setupEventListeners();
        console.log('✅ 초기화 완료!');
    }

    setupEventListeners() {
        console.log('🔧 이벤트 리스너 설정 중...');
        
        // 모드 전환
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.switchMode(mode);
                console.log(`모드 전환: ${mode}`);
            });
        });

        // 파일 업로드
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');

        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => {
                console.log('업로드 영역 클릭');
                fileInput.click();
            });
            
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0 && files[0].type.startsWith('image/')) {
                    this.handleImageUpload(files[0]);
                }
            });

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    console.log('파일 선택됨:', file.name);
                    this.handleImageUpload(file);
                }
            });
        }

        // 검색 버튼
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                console.log('검색 버튼 클릭');
                this.searchSimilarImages();
            });
        }

        // 폴더 선택 버튼
        const selectFolderBtn = document.getElementById('select-folder-btn');
        if (selectFolderBtn) {
            selectFolderBtn.addEventListener('click', () => {
                console.log('폴더 선택 버튼 클릭');
                this.selectFolder();
            });
        }

        // 데이터베이스 초기화 버튼
        const clearDbBtn = document.getElementById('clear-database-btn');
        if (clearDbBtn) {
            clearDbBtn.addEventListener('click', async () => {
                console.log('DB 초기화 버튼 클릭');
                if (confirm('모든 인덱싱된 데이터가 삭제됩니다. 계속하시겠습니까?')) {
                    this.imageDatabase = [];
                    await this.storage.clear();
                    alert('데이터베이스가 초기화되었습니다.');
                    console.log('🗑️ 데이터베이스 초기화 완료');
                }
            });
        }
        
        console.log('✅ 이벤트 리스너 설정 완료');
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

    async handleImageUpload(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                this.uploadedImage = {
                    file: file,
                    dataUrl: e.target.result,
                    width: img.width,
                    height: img.height
                };

                const previewImage = document.getElementById('preview-image');
                const previewSection = document.getElementById('preview-section');
                const resultsSection = document.getElementById('results-section');
                
                if (previewImage) previewImage.src = e.target.result;
                if (previewSection) previewSection.style.display = 'block';
                if (resultsSection) resultsSection.style.display = 'none';
                
                console.log('✅ 이미지 업로드 완료:', file.name);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // === v9.0 핵심 개선: LV 모노그램 전용 감지 ===
    detectLVMonogram(imageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 240;
        canvas.height = 240;
        ctx.drawImage(imageElement, 0, 0, 240, 240);
        
        const imageData = ctx.getImageData(0, 0, 240, 240);
        const data = imageData.data;
        
        // 1. 색상 분석 - LV 특유의 갈색/베이지
        let brownCount = 0;
        let beigeCount = 0;
        let blackCount = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // HSV 변환
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const diff = max - min;
            const value = max / 255;
            const saturation = max === 0 ? 0 : diff / max;
            let hue = 0;
            
            if (diff !== 0) {
                if (max === r) hue = ((g - b) / diff) % 6;
                else if (max === g) hue = (b - r) / diff + 2;
                else hue = (r - g) / diff + 4;
                hue = hue * 60;
                if (hue < 0) hue += 360;
            }
            
            // LV 갈색: Hue 20-40도, Saturation 0.3-0.7, Value 0.2-0.5
            if (hue >= 20 && hue <= 40 && saturation >= 0.3 && saturation <= 0.7 && value >= 0.2 && value <= 0.5) {
                brownCount++;
            }
            // LV 베이지: Hue 30-50도, Saturation 0.1-0.3, Value 0.6-0.8
            else if (hue >= 30 && hue <= 50 && saturation >= 0.1 && saturation <= 0.3 && value >= 0.6 && value <= 0.8) {
                beigeCount++;
            }
            // 검은색: Value < 0.2
            else if (value < 0.2) {
                blackCount++;
            }
        }
        
        const totalPixels = 240 * 240;
        const brownRatio = brownCount / totalPixels;
        const beigeRatio = beigeCount / totalPixels;
        const blackRatio = blackCount / totalPixels;
        
        // 2. 그리드 기반 반복 패턴 감지
        const gridSize = 30; // LV 모노그램은 약 30픽셀 간격
        const numGrids = Math.floor(240 / gridSize);
        const gridFeatures = [];
        
        for (let gy = 0; gy < numGrids; gy++) {
            for (let gx = 0; gx < numGrids; gx++) {
                const features = this.extractGridFeatures(imageData, gx * gridSize, gy * gridSize, gridSize);
                gridFeatures.push(features);
            }
        }
        
        // 대각선 패턴 유사도 계산
        let diagonalSimilarity = 0;
        for (let i = 0; i < gridFeatures.length - numGrids - 1; i++) {
            if ((i + 1) % numGrids !== 0) { // 오른쪽 끝이 아닌 경우
                const current = gridFeatures[i];
                const diagonal = gridFeatures[i + numGrids + 1]; // 대각선 아래
                const similarity = this.compareGridFeatures(current, diagonal);
                diagonalSimilarity += similarity;
            }
        }
        diagonalSimilarity /= (gridFeatures.length - numGrids);
        
        // 3. 엣지 날카로움 분석 (모노그램은 선명한 엣지)
        const edges = this.detectSharpEdges(imageData);
        
        return {
            isLV: brownRatio > 0.3 && beigeRatio > 0.1 && blackRatio < 0.2,
            confidence: (brownRatio * 0.4 + beigeRatio * 0.2 + diagonalSimilarity * 0.3 + edges * 0.1),
            details: {
                brown: brownRatio,
                beige: beigeRatio,
                black: blackRatio,
                pattern: diagonalSimilarity,
                sharpness: edges
            }
        };
    }
    
    // === v9.0 핵심 개선: Chanel 퀼팅 전용 감지 ===
    detectChanelQuilting(imageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 200;
        ctx.drawImage(imageElement, 0, 0, 200, 200);
        
        const imageData = ctx.getImageData(0, 0, 200, 200);
        const data = imageData.data;
        
        // 1. 색상 분석 - Chanel 특유의 검은색
        let trueBlackCount = 0;
        let darkGrayCount = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const value = max / 255;
            const saturation = max === 0 ? 0 : (max - min) / max;
            
            // 진짜 검은색: Value < 0.3, Saturation < 0.2
            if (value < 0.3 && saturation < 0.2) {
                trueBlackCount++;
            }
            // 어두운 회색
            else if (value < 0.5 && saturation < 0.1) {
                darkGrayCount++;
            }
        }
        
        const totalPixels = 200 * 200;
        const blackRatio = trueBlackCount / totalPixels;
        const grayRatio = darkGrayCount / totalPixels;
        
        // 2. 다이아몬드 패턴 감지
        let diamondPatterns = 0;
        const stepSize = 20; // 다이아몬드 크기
        
        for (let y = stepSize; y < 200 - stepSize; y += stepSize) {
            for (let x = stepSize; x < 200 - stepSize; x += stepSize) {
                // 다이아몬드 중심과 꼭짓점 비교
                const center = this.getPixelBrightness(data, x, y, 200);
                const top = this.getPixelBrightness(data, x, y - stepSize/2, 200);
                const bottom = this.getPixelBrightness(data, x, y + stepSize/2, 200);
                const left = this.getPixelBrightness(data, x - stepSize/2, y, 200);
                const right = this.getPixelBrightness(data, x + stepSize/2, y, 200);
                
                // 쿠션 효과: 중앙이 주변보다 밝음
                if (center > top && center > bottom && center > left && center > right) {
                    diamondPatterns++;
                }
            }
        }
        
        const diamondRatio = diamondPatterns / ((200 / stepSize) * (200 / stepSize));
        
        // 3. 부드러운 그래디언트 감지 (퀼팅의 특징)
        let smoothGradients = 0;
        for (let y = 1; y < 199; y++) {
            for (let x = 1; x < 199; x++) {
                const idx = (y * 200 + x) * 4;
                const center = data[idx];
                
                // 주변 픽셀과의 차이가 작으면 부드러운 그래디언트
                const neighbors = [
                    data[((y-1) * 200 + x) * 4],
                    data[((y+1) * 200 + x) * 4],
                    data[(y * 200 + (x-1)) * 4],
                    data[(y * 200 + (x+1)) * 4]
                ];
                
                const avgDiff = neighbors.reduce((sum, n) => sum + Math.abs(center - n), 0) / 4;
                if (avgDiff < 20 && avgDiff > 5) { // 부드럽지만 완전 평면은 아님
                    smoothGradients++;
                }
            }
        }
        
        const gradientRatio = smoothGradients / (198 * 198);
        
        return {
            isChanel: blackRatio > 0.3 && diamondRatio > 0.1,
            confidence: (blackRatio * 0.4 + diamondRatio * 0.3 + gradientRatio * 0.3),
            details: {
                black: blackRatio,
                gray: grayRatio,
                diamonds: diamondRatio,
                gradient: gradientRatio
            }
        };
    }
    
    // 그리드 특징 추출
    extractGridFeatures(imageData, x, y, size) {
        const features = [];
        const data = imageData.data;
        const width = imageData.width;
        
        for (let dy = 0; dy < size; dy += 5) {
            for (let dx = 0; dx < size; dx += 5) {
                const idx = ((y + dy) * width + (x + dx)) * 4;
                features.push(data[idx], data[idx + 1], data[idx + 2]);
            }
        }
        
        return features;
    }
    
    // 그리드 특징 비교
    compareGridFeatures(feat1, feat2) {
        if (!feat1 || !feat2 || feat1.length !== feat2.length) return 0;
        
        let similarity = 0;
        for (let i = 0; i < feat1.length; i++) {
            const diff = Math.abs(feat1[i] - feat2[i]);
            similarity += 1 - (diff / 255);
        }
        
        return similarity / feat1.length;
    }
    
    // 날카로운 엣지 감지
    detectSharpEdges(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        let sharpEdges = 0;
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const center = data[idx];
                
                // Laplacian 필터
                const laplacian = Math.abs(
                    4 * center -
                    data[((y-1) * width + x) * 4] -
                    data[((y+1) * width + x) * 4] -
                    data[(y * width + (x-1)) * 4] -
                    data[(y * width + (x+1)) * 4]
                );
                
                if (laplacian > 100) { // 날카로운 엣지
                    sharpEdges++;
                }
            }
        }
        
        return sharpEdges / ((width - 2) * (height - 2));
    }
    
    // 픽셀 밝기 가져오기
    getPixelBrightness(data, x, y, width) {
        const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
        return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
    }
    
    // 통합 특징 추출 (v9.0)
    async extractAllFeatures(imageElement) {
        // LV 모노그램 감지
        const lvDetection = this.detectLVMonogram(imageElement);
        
        // Chanel 퀼팅 감지
        const chanelDetection = this.detectChanelQuilting(imageElement);
        
        // 기본 특징
        const aspectRatio = imageElement.width / imageElement.height;
        
        // 브랜드 결정 (개선된 로직)
        let estimatedBrand = 'unknown';
        let confidence = 0;
        
        if (lvDetection.confidence > 0.5 && lvDetection.confidence > chanelDetection.confidence) {
            estimatedBrand = 'louis_vuitton';
            confidence = lvDetection.confidence;
        } else if (chanelDetection.confidence > 0.5) {
            estimatedBrand = 'chanel';
            confidence = chanelDetection.confidence;
        }
        
        // 디버그 로그
        console.log('🔍 LV 감지:', lvDetection);
        console.log('🔍 Chanel 감지:', chanelDetection);
        
        return {
            basic: { aspectRatio },
            lv: lvDetection,
            chanel: chanelDetection,
            brand: {
                name: estimatedBrand,
                confidence: confidence,
                scores: {
                    louis_vuitton: lvDetection.confidence,
                    chanel: chanelDetection.confidence
                }
            }
        };
    }
    
    // 유사도 계산 (v9.0 개선)
    calculateSimilarity(features1, features2) {
        let similarity = 0;
        
        // 1. 브랜드가 다르면 큰 페널티
        if (features1.brand.name !== 'unknown' && features2.brand.name !== 'unknown') {
            if (features1.brand.name !== features2.brand.name) {
                // 다른 브랜드면 최대 30%만 가능
                return Math.random() * 0.3;
            }
        }
        
        // 2. LV끼리 비교
        if (features1.brand.name === 'louis_vuitton' && features2.brand.name === 'louis_vuitton') {
            similarity = 0.5; // 기본 점수
            
            // 갈색 비율 비교
            const brownDiff = Math.abs(features1.lv.details.brown - features2.lv.details.brown);
            similarity += (1 - brownDiff) * 0.2;
            
            // 패턴 유사도
            const patternDiff = Math.abs(features1.lv.details.pattern - features2.lv.details.pattern);
            similarity += (1 - patternDiff) * 0.2;
            
            // 선명도 비교
            const sharpDiff = Math.abs(features1.lv.details.sharpness - features2.lv.details.sharpness);
            similarity += (1 - sharpDiff) * 0.1;
        }
        
        // 3. Chanel끼리 비교
        else if (features1.brand.name === 'chanel' && features2.brand.name === 'chanel') {
            similarity = 0.5; // 기본 점수
            
            // 검은색 비율 비교
            const blackDiff = Math.abs(features1.chanel.details.black - features2.chanel.details.black);
            similarity += (1 - blackDiff) * 0.2;
            
            // 다이아몬드 패턴
            const diamondDiff = Math.abs(features1.chanel.details.diamonds - features2.chanel.details.diamonds);
            similarity += (1 - diamondDiff) * 0.2;
            
            // 그래디언트
            const gradientDiff = Math.abs(features1.chanel.details.gradient - features2.chanel.details.gradient);
            similarity += (1 - gradientDiff) * 0.1;
        }
        
        // 4. Unknown이거나 혼합된 경우
        else {
            // 기본 유사도만 계산
            const aspectDiff = Math.abs(features1.basic.aspectRatio - features2.basic.aspectRatio);
            similarity = 0.3 * (1 / (1 + aspectDiff));
        }
        
        return Math.max(0, Math.min(1, similarity));
    }

    async searchSimilarImages() {
        if (!this.uploadedImage) {
            alert('먼저 이미지를 업로드해주세요.');
            return;
        }

        if (this.imageDatabase.length === 0) {
            alert('인덱싱된 이미지가 없습니다. 먼저 이미지를 인덱싱해주세요.');
            return;
        }

        this.showLoading('브랜드 가방을 정밀 분석 중...');
        console.log('🔍 v9.0 정밀 검색 시작...');

        try {
            const img = document.getElementById('preview-image');
            const queryFeatures = await this.extractAllFeatures(img);
            
            console.log('🎯 감지된 브랜드:', queryFeatures.brand.name, 
                       `(신뢰도: ${(queryFeatures.brand.confidence * 100).toFixed(1)}%)`);

            const results = this.imageDatabase.map((item) => {
                const similarity = this.calculateSimilarity(queryFeatures, item.features);
                return {
                    ...item,
                    similarity: similarity,
                    brandMatch: item.features.brand.name === queryFeatures.brand.name
                };
            });

            // 브랜드 일치 우선, 유사도 순 정렬
            results.sort((a, b) => {
                if (a.brandMatch !== b.brandMatch) {
                    return b.brandMatch - a.brandMatch;
                }
                return b.similarity - a.similarity;
            });

            const filteredResults = results.filter(r => r.similarity < 0.98);
            
            this.displayResults(filteredResults.slice(0, 30));
            
            console.log(`✅ 검색 완료: ${filteredResults.length}개 결과`);
            
            // 상위 5개 결과 상세 로그
            console.log('📊 상위 5개 결과:');
            filteredResults.slice(0, 5).forEach((r, i) => {
                console.log(`  ${i+1}. ${r.name}: ${(r.similarity * 100).toFixed(1)}% (${r.features.brand.name})`);
            });

        } catch (error) {
            console.error('❌ 검색 중 오류:', error);
            alert('검색 중 오류가 발생했습니다.');
        } finally {
            this.hideLoading();
        }
    }

    displayResults(results) {
        const resultsGrid = document.getElementById('results-grid');
        const resultCount = document.getElementById('result-count');
        
        if (resultCount) resultCount.textContent = `(${results.length}개)`;
        if (!resultsGrid) return;
        
        resultsGrid.innerHTML = '';

        results.forEach((result, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            const similarity = Math.round(result.similarity * 100);
            const brand = result.features.brand.name;
            const brandConf = Math.round(result.features.brand.confidence * 100);
            
            const img = document.createElement('img');
            img.className = 'result-image';
            img.alt = result.name;
            img.loading = 'lazy';
            
            this.loadResultImage(img, result.path, result.name);
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'result-info';
            
            const displayName = result.name.length > 30 
                ? result.name.substring(0, 27) + '...' 
                : result.name;
            
            let brandBadge = '';
            if (brand !== 'unknown') {
                const brandColors = {
                    'louis_vuitton': '#8B4513',
                    'chanel': '#000000',
                    'unknown': '#999999'
                };
                brandBadge = `<span style="background: ${brandColors[brand] || '#666'}; 
                                           color: white; 
                                           padding: 2px 6px; 
                                           border-radius: 3px; 
                                           font-size: 10px;">
                                ${brand.replace('_', ' ').toUpperCase()} ${brandConf}%
                              </span>`;
            }
            
            infoDiv.innerHTML = `
                <div class="result-filename" title="${result.name}">${displayName}</div>
                <div class="result-similarity">
                    유사도: <strong>${similarity}%</strong>
                    ${brandBadge}
                </div>
            `;
            
            resultItem.appendChild(img);
            resultItem.appendChild(infoDiv);
            
            resultItem.addEventListener('click', async () => {
                try {
                    await invoke('open_file_location', { path: result.path });
                } catch (error) {
                    console.error('파일 위치 열기 실패:', error);
                }
            });

            resultsGrid.appendChild(resultItem);
        });

        const resultsSection = document.getElementById('results-section');
        if (resultsSection) resultsSection.style.display = 'block';
    }

    async loadResultImage(imgElement, filePath, fileName) {
        try {
            let normalizedPath = filePath.replace(/\\/g, '/');
            const cleanFileName = fileName.trim();
            
            if (cleanFileName.includes(' ')) {
                const dirPath = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
                normalizedPath = `${dirPath}/${cleanFileName}`;
            }
            
            const assetUrl = convertFileSrc(normalizedPath);
            imgElement.src = assetUrl;
            
            imgElement.onerror = async () => {
                try {
                    const imageData = await readBinaryFile(filePath);
                    const ext = fileName.split('.').pop().toLowerCase();
                    const mimeTypes = {
                        'jpg': 'image/jpeg',
                        'jpeg': 'image/jpeg',
                        'png': 'image/png',
                        'gif': 'image/gif',
                        'webp': 'image/webp'
                    };
                    
                    const blob = new Blob([imageData], { type: mimeTypes[ext] || 'image/jpeg' });
                    const url = URL.createObjectURL(blob);
                    
                    imgElement.src = url;
                    
                    imgElement.onload = () => {
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                    };
                } catch (error) {
                    console.error(`이미지 읽기 실패: ${filePath}`, error);
                    imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjEwMCIgeT0iMTAwIiBzdHlsZT0iZmlsbDojYWFhO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjEzcHg7Zm9udC1mYW1pbHk6QXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7ZG9taW5hbnQtYmFzZWxpbmU6Y2VudHJhbCI+로드 실패</text></svg>';
                }
            };
        } catch (error) {
            console.error(`이미지 처리 오류: ${filePath}`, error);
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
                await this.indexFolder(selected);
            }
        } catch (error) {
            console.error('폴더 선택 오류:', error);
        }
    }

    async indexFolder(folderPath) {
        this.showLoading('v9.0 정밀 분석 중...');

        try {
            const entries = await readDir(folderPath, { recursive: true });
            const imageFiles = entries.filter(entry => {
                if (!entry.name) return false;
                const ext = entry.name.toLowerCase().split('.').pop();
                return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
            });

            const folderPathEl = document.getElementById('folder-path');
            const imageCountEl = document.getElementById('image-count');
            const folderInfoEl = document.getElementById('folder-info');
            
            if (folderPathEl) folderPathEl.textContent = folderPath;
            if (imageCountEl) imageCountEl.textContent = imageFiles.length;
            if (folderInfoEl) folderInfoEl.style.display = 'block';

            if (imageFiles.length === 0) {
                alert('선택한 폴더에 이미지가 없습니다.');
                this.hideLoading();
                return;
            }

            const progressEl = document.getElementById('indexing-progress');
            const resultsEl = document.getElementById('index-results');
            
            if (progressEl) progressEl.style.display = 'block';
            if (resultsEl) resultsEl.style.display = 'none';

            const newDatabase = [];
            const totalImages = imageFiles.length;
            let processedCount = 0;
            let errorCount = 0;
            
            // 브랜드별 통계
            const brandStats = {};

            const batchSize = 3;  // 복잡한 특징 추출로 인해 배치 크기 축소
            
            for (let i = 0; i < imageFiles.length; i += batchSize) {
                const batch = imageFiles.slice(i, i + batchSize);
                
                await Promise.all(batch.map(async (file) => {
                    try {
                        const imageData = await readBinaryFile(file.path);
                        const blob = new Blob([imageData]);
                        const imageUrl = URL.createObjectURL(blob);

                        const img = new Image();
                        await new Promise((resolve, reject) => {
                            img.onload = resolve;
                            img.onerror = reject;
                            img.src = imageUrl;
                        });

                        const features = await this.extractAllFeatures(img);
                        
                        // 브랜드 통계 업데이트
                        const brand = features.brand.name;
                        if (!brandStats[brand]) brandStats[brand] = 0;
                        brandStats[brand]++;
                        
                        newDatabase.push({
                            path: file.path,
                            name: file.name || 'Unknown',
                            features: features
                        });

                        URL.revokeObjectURL(imageUrl);
                        processedCount++;

                    } catch (error) {
                        console.error(`이미지 처리 실패: ${file.name}`, error);
                        errorCount++;
                    }
                }));

                const progress = Math.round((Math.min(i + batchSize, totalImages) / totalImages) * 100);
                const fillEl = document.getElementById('progress-fill');
                const textEl = document.getElementById('progress-text');
                
                if (fillEl) fillEl.style.width = `${progress}%`;
                if (textEl) textEl.textContent = `${Math.min(i + batchSize, totalImages)} / ${totalImages}`;

                await new Promise(resolve => setTimeout(resolve, 50));
            }

            this.imageDatabase = newDatabase;
            await this.saveDatabase();

            const fillEl = document.getElementById('progress-fill');
            const textEl = document.getElementById('progress-text');
            
            if (fillEl) fillEl.style.width = '100%';
            if (textEl) textEl.textContent = `${totalImages} / ${totalImages}`;
            
            // 브랜드 통계 출력
            console.log('📊 v9.0 브랜드 분석 결과:');
            for (const [brand, count] of Object.entries(brandStats)) {
                const percentage = ((count / processedCount) * 100).toFixed(1);
                console.log(`  ${brand}: ${count}개 (${percentage}%)`);
            }
            
            setTimeout(() => {
                if (progressEl) progressEl.style.display = 'none';
                if (resultsEl) resultsEl.style.display = 'block';
                
                const countEl = document.getElementById('indexed-count');
                if (countEl) countEl.textContent = processedCount;
                
                if (errorCount > 0) {
                    alert(`✅ 인덱싱 완료!\n성공: ${processedCount}개\n실패: ${errorCount}개`);
                } else {
                    console.log(`✅ v9.0 인덱싱 완료: ${processedCount}개 성공`);
                }
            }, 500);

        } catch (error) {
            console.error('인덱싱 오류:', error);
            alert('인덱싱 중 오류가 발생했습니다.');
        } finally {
            this.hideLoading();
        }
    }

    async saveDatabase() {
        try {
            const dbData = {
                version: 9,
                timestamp: Date.now(),
                appVersion: this.version,
                featureVersion: 'lv_chanel_specialized',
                data: this.imageDatabase
            };
            
            await this.storage.setItem('brandDatabase', dbData);
            console.log(`💾 데이터베이스 저장 완료 (v${dbData.version})`);
        } catch (error) {
            console.error('❌ 데이터베이스 저장 실패:', error);
        }
    }

    async loadDatabase() {
        try {
            const stored = await this.storage.getItem('brandDatabase');
            
            if (stored) {
                if (stored.version === 9 && stored.featureVersion === 'lv_chanel_specialized') {
                    this.imageDatabase = stored.data || [];
                    console.log(`📂 ${this.imageDatabase.length}개의 이미지 로드됨`);
                } else {
                    console.log('⚠️ 이전 버전 데이터베이스. 재인덱싱 필요');
                    this.imageDatabase = [];
                    await this.storage.clear();
                }
            }
        } catch (error) {
            console.error('❌ 데이터베이스 로드 실패:', error);
            this.imageDatabase = [];
        }
    }

    showLoading(text = '처리 중...') {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            const loadingText = overlay.querySelector('.loading-text');
            if (loadingText) loadingText.textContent = text;
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM 로드 완료, 앱 초기화 시작...');
    
    const app = new AdvancedBrandBagSearch();
    
    window.brandApp = {
        version: () => {
            console.log(`버전: v${app.version}`);
            console.log(`DB 크기: ${app.imageDatabase.length} 개`);
            console.log(`특징: LV 모노그램 감지, Chanel 퀼팅 감지`);
        },
        clearDB: async () => {
            app.imageDatabase = [];
            await app.storage.clear();
            console.log('✅ DB 초기화 완료');
        },
        testFeatures: async () => {
            if (app.uploadedImage) {
                const img = document.getElementById('preview-image');
                const features = await app.extractAllFeatures(img);
                console.log('특징 추출 결과:', features);
                console.log(`추정 브랜드: ${features.brand.name} (${(features.brand.confidence * 100).toFixed(1)}%)`);
                console.log('LV 세부:', features.lv);
                console.log('Chanel 세부:', features.chanel);
            } else {
                console.log('먼저 이미지를 업로드하세요');
            }
        },
        getBrandStats: () => {
            const stats = {};
            app.imageDatabase.forEach(item => {
                const brand = item.features.brand.name;
                if (!stats[brand]) stats[brand] = 0;
                stats[brand]++;
            });
            console.log('브랜드 통계:', stats);
            return stats;
        }
    };
    
    console.log('%c👜 Advanced Brand Bag Search v9.0 초기화 완료!', 'color: #ff6b6b; font-size: 16px; font-weight: bold;');
    console.log('%cLV/Chanel 구분 강화 버전', 'color: #666; font-style: italic;');
    console.log('✨ v9.0 핵심 개선사항:');
    console.log('  ✅ LV 모노그램 전용 감지기');
    console.log('  ✅ Chanel 퀼팅 전용 감지기');
    console.log('  ✅ HSV 색공간 기반 정밀 색상 분석');
    console.log('  ✅ 그리드 기반 패턴 반복성 감지');
    console.log('  ✅ 브랜드 간 강력한 페널티');
    console.log('콘솔 명령어:');
    console.log('  brandApp.version() - 버전 정보');
    console.log('  brandApp.clearDB() - DB 초기화');
    console.log('  brandApp.testFeatures() - 특징 추출 테스트');
    console.log('  brandApp.getBrandStats() - 브랜드 통계');
});