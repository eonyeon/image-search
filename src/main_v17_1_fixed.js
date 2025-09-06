import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readDir, readBinaryFile } from '@tauri-apps/api/fs';
import localforage from 'localforage';
import * as tf from '@tensorflow/tfjs';

// Fashion Search v17.0 - 하이브리드 방식 (색상 + 엣지 + 패턴)
class FashionSearchHybrid {
    constructor() {
        this.currentMode = 'search';
        this.uploadedImage = null;
        this.imageDatabase = [];
        this.version = '17.0.0';
        this.debugMode = true;
        this.debugLogs = [];
        
        // 새 DB
        this.storage = localforage.createInstance({
            name: 'FashionSearchDB',
            storeName: 'fashionVectorsV17Hybrid'
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
        this.addDebugLog('🚀 Fashion Search v17.0 - 하이브리드 검색', 'critical');
        this.addDebugLog('색상 + 엣지 + 패턴 조합', 'warning');
        
        // 디버그 패널 생성
        this.createDebugPanel();
        
        // TensorFlow 준비
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
                🔍 Debug Console v17.0 - HYBRID
            </div>
            <div id="debug-log-container" style="overflow-y: auto; max-height: 300px;"></div>
        `;
        
        document.body.appendChild(debugPanel);
        
        const controlPanel = document.createElement('div');
        controlPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 5px;
            font-family: Arial;
            font-size: 13px;
            z-index: 9999;
        `;
        
        controlPanel.innerHTML = `
            <h3 style="margin-top: 0;">🔍 v17.0 하이브리드</h3>
            <button onclick="fashionApp.testFeatureExtraction()" style="margin: 3px; padding: 5px 10px;">
                🧪 특징 추출 테스트
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
    
    // 하이브리드 특징 추출 (핵심!)
    async extractHybridFeatures(imageData, canvas) {
        const features = [];
        
        // 1. 색상 히스토그램 (256차원으로 축소)
        const colorFeatures = this.extractColorHistogram(imageData);
        features.push(...colorFeatures);
        
        // 2. 엣지 검출 특징 (128차원)
        const edgeFeatures = this.extractEdgeFeatures(imageData);
        features.push(...edgeFeatures);
        
        // 3. 패턴/텍스처 특징 (128차원)
        const patternFeatures = this.extractPatternFeatures(imageData);
        features.push(...patternFeatures);
        
        // 4. 형태 특징 (32차원)
        const shapeFeatures = await this.extractShapeFeatures(canvas);
        features.push(...shapeFeatures);
        
        return features; // 총 544차원
    }
    
    // 색상 히스토그램 (축소 버전)
    extractColorHistogram(imageData) {
        const bins = 4; // 4x4x4 = 64개 빈
        const histogram = new Array(bins * bins * bins).fill(0);
        const hueHistogram = new Array(12).fill(0); // 12개 색조
        const saturationLevels = [0, 0, 0]; // 저/중/고 채도
        const brightnessLevels = [0, 0, 0]; // 어둠/중간/밝음
        
        const pixelCount = imageData.width * imageData.height;
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
            
            // HSV 변환
            const hsv = this.rgbToHsv(r, g, b);
            
            // Hue 히스토그램
            const hueBin = Math.floor(hsv.h / 30); // 360/30 = 12개
            hueHistogram[hueBin]++;
            
            // 채도 레벨
            if (hsv.s < 0.33) saturationLevels[0]++;
            else if (hsv.s < 0.66) saturationLevels[1]++;
            else saturationLevels[2]++;
            
            // 명도 레벨
            if (hsv.v < 0.33) brightnessLevels[0]++;
            else if (hsv.v < 0.66) brightnessLevels[1]++;
            else brightnessLevels[2]++;
        }
        
        // 정규화
        const features = [];
        features.push(...histogram.map(v => v / pixelCount));
        features.push(...hueHistogram.map(v => v / pixelCount));
        features.push(...saturationLevels.map(v => v / pixelCount));
        features.push(...brightnessLevels.map(v => v / pixelCount));
        
        // 주요 색상 3개
        const colorCounts = {};
        for (let i = 0; i < data.length; i += 4) {
            const r = Math.floor(data[i] / 64) * 64;
            const g = Math.floor(data[i + 1] / 64) * 64;
            const b = Math.floor(data[i + 2] / 64) * 64;
            const key = `${r},${g},${b}`;
            colorCounts[key] = (colorCounts[key] || 0) + 1;
        }
        
        const topColors = Object.entries(colorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([color, count]) => {
                const [r, g, b] = color.split(',').map(Number);
                return [r/255, g/255, b/255, count/pixelCount];
            })
            .flat();
        
        while (topColors.length < 12) topColors.push(0);
        features.push(...topColors);
        
        // 색상 분산도 (검정색 가방들 구분용)
        const colorVariance = this.calculateColorVariance(data);
        features.push(colorVariance);
        
        // 밝기 분포
        const brightnessDistribution = this.calculateBrightnessDistribution(data);
        features.push(...brightnessDistribution);
        
        return features; // 256차원
    }
    
    // 엣지 검출 특징
    extractEdgeFeatures(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        // Sobel 필터
        const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
        const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
        
        const edges = [];
        const angleHistogram = new Array(8).fill(0); // 45도씩 8개 구간
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0, gy = 0;
                
                // Sobel 필터 적용
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const idx = ((y + dy) * width + (x + dx)) * 4;
                        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                        gx += gray * sobelX[dy + 1][dx + 1];
                        gy += gray * sobelY[dy + 1][dx + 1];
                    }
                }
                
                const magnitude = Math.sqrt(gx * gx + gy * gy);
                const angle = Math.atan2(gy, gx);
                
                edges.push(magnitude);
                
                // 엣지 방향 히스토그램
                if (magnitude > 30) { // 임계값
                    const angleBin = Math.floor((angle + Math.PI) / (Math.PI / 4));
                    angleHistogram[Math.min(angleBin, 7)]++;
                }
            }
        }
        
        // 엣지 통계
        const totalEdges = edges.reduce((a, b) => a + b, 0);
        const avgEdge = totalEdges / edges.length;
        const maxEdge = Math.max(...edges);
        
        // 엣지 밀도 그리드 (8x8)
        const gridSize = 8;
        const cellWidth = Math.floor(width / gridSize);
        const cellHeight = Math.floor(height / gridSize);
        const edgeGrid = new Array(gridSize * gridSize).fill(0);
        
        for (let gy = 0; gy < gridSize; gy++) {
            for (let gx = 0; gx < gridSize; gx++) {
                let cellSum = 0;
                let cellCount = 0;
                
                for (let y = gy * cellHeight; y < Math.min((gy + 1) * cellHeight, height - 1); y++) {
                    for (let x = gx * cellWidth; x < Math.min((gx + 1) * cellWidth, width - 1); x++) {
                        const idx = y * (width - 2) + x;
                        if (idx < edges.length) {
                            cellSum += edges[idx];
                            cellCount++;
                        }
                    }
                }
                
                edgeGrid[gy * gridSize + gx] = cellCount > 0 ? cellSum / cellCount : 0;
            }
        }
        
        // 특징 벡터 구성
        const features = [];
        features.push(...edgeGrid.map(v => v / 255)); // 64차원
        features.push(...angleHistogram.map(v => v / Math.max(...angleHistogram))); // 8차원
        features.push(avgEdge / 255);
        features.push(maxEdge / 255);
        
        // 엣지 복잡도
        const edgeComplexity = this.calculateEdgeComplexity(edges, width, height);
        features.push(...edgeComplexity); // 54차원
        
        return features; // 128차원
    }
    
    // 패턴/텍스처 특징
    extractPatternFeatures(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        // LBP (Local Binary Pattern)
        const lbpHistogram = new Array(256).fill(0);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const centerIdx = (y * width + x) * 4;
                const centerGray = (data[centerIdx] + data[centerIdx + 1] + data[centerIdx + 2]) / 3;
                
                let lbpCode = 0;
                const neighbors = [
                    [-1, -1], [-1, 0], [-1, 1],
                    [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]
                ];
                
                neighbors.forEach((offset, i) => {
                    const idx = ((y + offset[0]) * width + (x + offset[1])) * 4;
                    const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                    if (gray >= centerGray) {
                        lbpCode |= (1 << i);
                    }
                });
                
                lbpHistogram[lbpCode]++;
            }
        }
        
        // 정규화
        const totalPixels = (width - 2) * (height - 2);
        const normalizedLBP = lbpHistogram.map(v => v / totalPixels);
        
        // LBP를 16개 빈으로 압축
        const compressedLBP = [];
        for (let i = 0; i < 16; i++) {
            let sum = 0;
            for (let j = 0; j < 16; j++) {
                sum += normalizedLBP[i * 16 + j];
            }
            compressedLBP.push(sum);
        }
        
        // 반복 패턴 검출
        const repeatPattern = this.detectRepetitivePattern(data, width, height);
        
        // GLCM (Gray Level Co-occurrence Matrix) 특징
        const glcmFeatures = this.calculateGLCMFeatures(data, width, height);
        
        // 특징 벡터 구성
        const features = [];
        features.push(...compressedLBP); // 16차원
        features.push(...repeatPattern); // 32차원
        features.push(...glcmFeatures); // 80차원
        
        return features; // 128차원
    }
    
    // 형태 특징
    async extractShapeFeatures(canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // 이미지를 이진화
        const imageData = ctx.getImageData(0, 0, width, height);
        const binary = this.binarizeImage(imageData);
        
        // 컨투어 검출
        const contours = this.findContours(binary, width, height);
        
        // Hu 모멘트 계산 (회전 불변)
        const huMoments = this.calculateHuMoments(contours, width, height);
        
        // 종횡비
        const aspectRatio = width / height;
        
        // 형태 복잡도
        const shapeComplexity = contours.length / 1000; // 정규화
        
        // 중심 위치
        const centerX = 0.5; // 정규화된 중심
        const centerY = 0.5;
        
        // 특징 구성
        const features = [];
        features.push(...huMoments); // 7차원
        features.push(aspectRatio);
        features.push(shapeComplexity);
        features.push(centerX, centerY);
        
        // 대칭성 측정
        const symmetry = this.measureSymmetry(binary, width, height);
        features.push(...symmetry); // 4차원
        
        // 코너 검출
        const corners = this.detectCorners(imageData);
        features.push(...corners); // 17차원
        
        return features; // 32차원
    }
    
    // 보조 함수들
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
    
    calculateColorVariance(data) {
        let sum = 0, sumSq = 0, count = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            sum += gray;
            sumSq += gray * gray;
            count++;
        }
        
        const mean = sum / count;
        const variance = (sumSq / count) - (mean * mean);
        return Math.sqrt(variance) / 255; // 정규화
    }
    
    calculateBrightnessDistribution(data) {
        const bins = 10;
        const histogram = new Array(bins).fill(0);
        
        for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const bin = Math.min(Math.floor(brightness / (256 / bins)), bins - 1);
            histogram[bin]++;
        }
        
        const total = data.length / 4;
        return histogram.map(v => v / total);
    }
    
    calculateEdgeComplexity(edges, width, height) {
        // 엣지 방향 변화율 계산
        const complexity = [];
        const blockSize = 4;
        const blocksX = Math.floor(width / blockSize);
        const blocksY = Math.floor(height / blockSize);
        
        for (let by = 0; by < blocksY; by++) {
            for (let bx = 0; bx < blocksX; bx++) {
                let changes = 0;
                let total = 0;
                
                for (let y = by * blockSize; y < Math.min((by + 1) * blockSize, height - 2); y++) {
                    for (let x = bx * blockSize; x < Math.min((bx + 1) * blockSize, width - 2); x++) {
                        const idx = y * (width - 2) + x;
                        if (idx < edges.length - 1) {
                            const diff = Math.abs(edges[idx] - edges[idx + 1]);
                            if (diff > 20) changes++;
                            total++;
                        }
                    }
                }
                
                complexity.push(total > 0 ? changes / total : 0);
            }
        }
        
        // 54차원으로 패딩
        while (complexity.length < 54) complexity.push(0);
        return complexity.slice(0, 54);
    }
    
    detectRepetitivePattern(data, width, height) {
        // 단순화된 반복 패턴 검출
        const blockSize = 16;
        const patterns = [];
        
        for (let scale = 1; scale <= 2; scale++) {
            const step = blockSize * scale;
            let repeatScore = 0;
            
            for (let y = 0; y < height - step; y += step) {
                for (let x = 0; x < width - step; x += step) {
                    let diff = 0;
                    
                    for (let dy = 0; dy < blockSize && y + dy < height && y + dy + step < height; dy++) {
                        for (let dx = 0; dx < blockSize && x + dx < width && x + dx + step < width; dx++) {
                            const idx1 = ((y + dy) * width + (x + dx)) * 4;
                            const idx2 = ((y + dy + step) * width + (x + dx)) * 4;
                            
                            if (idx1 < data.length && idx2 < data.length) {
                                diff += Math.abs(data[idx1] - data[idx2]);
                                diff += Math.abs(data[idx1 + 1] - data[idx2 + 1]);
                                diff += Math.abs(data[idx1 + 2] - data[idx2 + 2]);
                            }
                        }
                    }
                    
                    repeatScore += diff < 10000 ? 1 : 0;
                }
            }
            
            patterns.push(repeatScore / 100); // 정규화
        }
        
        // 32차원으로 패딩
        while (patterns.length < 32) patterns.push(0);
        return patterns;
    }
    
    calculateGLCMFeatures(data, width, height) {
        // 단순화된 GLCM 특징
        const features = [];
        const levels = 8; // 그레이 레벨 수
        const glcm = new Array(levels * levels).fill(0);
        
        // GLCM 계산
        for (let y = 0; y < height - 1; y++) {
            for (let x = 0; x < width - 1; x++) {
                const idx1 = (y * width + x) * 4;
                const idx2 = (y * width + x + 1) * 4;
                
                const gray1 = Math.floor((data[idx1] + data[idx1 + 1] + data[idx1 + 2]) / 3 / (256 / levels));
                const gray2 = Math.floor((data[idx2] + data[idx2 + 1] + data[idx2 + 2]) / 3 / (256 / levels));
                
                glcm[gray1 * levels + gray2]++;
            }
        }
        
        // 정규화
        const total = (width - 1) * (height - 1);
        const normalizedGLCM = glcm.map(v => v / total);
        
        // 통계적 특징 추출
        let contrast = 0, homogeneity = 0, energy = 0, correlation = 0;
        
        for (let i = 0; i < levels; i++) {
            for (let j = 0; j < levels; j++) {
                const p = normalizedGLCM[i * levels + j];
                contrast += p * (i - j) * (i - j);
                homogeneity += p / (1 + Math.abs(i - j));
                energy += p * p;
                correlation += p * i * j;
            }
        }
        
        features.push(contrast / 100, homogeneity, energy, correlation / 100);
        
        // 80차원으로 패딩
        features.push(...normalizedGLCM.slice(0, 76));
        while (features.length < 80) features.push(0);
        
        return features;
    }
    
    binarizeImage(imageData) {
        const data = imageData.data;
        const binary = [];
        const threshold = 128;
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            binary.push(gray > threshold ? 1 : 0);
        }
        
        return binary;
    }
    
    findContours(binary, width, height) {
        // 단순화된 컨투어 검출
        const contours = [];
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                
                if (binary[idx] === 1) {
                    // 엣지 픽셀인지 확인
                    const neighbors = [
                        binary[(y - 1) * width + x],
                        binary[(y + 1) * width + x],
                        binary[y * width + (x - 1)],
                        binary[y * width + (x + 1)]
                    ];
                    
                    if (neighbors.some(n => n === 0)) {
                        contours.push({ x, y });
                    }
                }
            }
        }
        
        return contours;
    }
    
    calculateHuMoments(contours, width, height) {
        if (contours.length === 0) {
            return [0, 0, 0, 0, 0, 0, 0];
        }
        
        // 중심 계산
        let cx = 0, cy = 0;
        contours.forEach(p => {
            cx += p.x;
            cy += p.y;
        });
        cx /= contours.length;
        cy /= contours.length;
        
        // 모멘트 계산 (단순화)
        const moments = [];
        for (let p = 0; p <= 2; p++) {
            for (let q = 0; q <= 2; q++) {
                if (p + q <= 2) {
                    let m = 0;
                    contours.forEach(point => {
                        m += Math.pow(point.x - cx, p) * Math.pow(point.y - cy, q);
                    });
                    moments.push(m / contours.length / Math.pow(Math.max(width, height), p + q));
                }
            }
        }
        
        // 7개 Hu 모멘트로 변환 (단순화)
        return moments.slice(0, 7);
    }
    
    measureSymmetry(binary, width, height) {
        let horizontalSym = 0, verticalSym = 0;
        let count = 0;
        
        // 수평 대칭
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width / 2; x++) {
                const idx1 = y * width + x;
                const idx2 = y * width + (width - 1 - x);
                
                if (binary[idx1] === binary[idx2]) {
                    horizontalSym++;
                }
                count++;
            }
        }
        
        // 수직 대칭
        for (let y = 0; y < height / 2; y++) {
            for (let x = 0; x < width; x++) {
                const idx1 = y * width + x;
                const idx2 = (height - 1 - y) * width + x;
                
                if (binary[idx1] === binary[idx2]) {
                    verticalSym++;
                }
            }
        }
        
        return [
            horizontalSym / count,
            verticalSym / count,
            (horizontalSym + verticalSym) / (2 * count),
            Math.abs(horizontalSym - verticalSym) / count
        ];
    }
    
    detectCorners(imageData) {
        // Harris 코너 검출 (단순화)
        const corners = [];
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        const gridSize = 4;
        const cellWidth = Math.floor(width / gridSize);
        const cellHeight = Math.floor(height / gridSize);
        
        for (let gy = 0; gy < gridSize; gy++) {
            for (let gx = 0; gx < gridSize; gx++) {
                let cornerScore = 0;
                
                for (let y = gy * cellHeight + 1; y < Math.min((gy + 1) * cellHeight, height - 1); y++) {
                    for (let x = gx * cellWidth + 1; x < Math.min((gx + 1) * cellWidth, width - 1); x++) {
                        const idx = (y * width + x) * 4;
                        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                        
                        // 간단한 코너 검출
                        const neighbors = [
                            ((y - 1) * width + (x - 1)) * 4,
                            ((y - 1) * width + x) * 4,
                            ((y - 1) * width + (x + 1)) * 4,
                            (y * width + (x - 1)) * 4,
                            (y * width + (x + 1)) * 4,
                            ((y + 1) * width + (x - 1)) * 4,
                            ((y + 1) * width + x) * 4,
                            ((y + 1) * width + (x + 1)) * 4
                        ];
                        
                        let diff = 0;
                        neighbors.forEach(nIdx => {
                            if (nIdx >= 0 && nIdx < data.length) {
                                const nGray = (data[nIdx] + data[nIdx + 1] + data[nIdx + 2]) / 3;
                                diff += Math.abs(gray - nGray);
                            }
                        });
                        
                        if (diff > 400) cornerScore++;
                    }
                }
                
                corners.push(cornerScore / 100); // 정규화
            }
        }
        
        // 통계
        const maxCorners = Math.max(...corners);
        const avgCorners = corners.reduce((a, b) => a + b, 0) / corners.length;
        
        corners.push(maxCorners / 10);
        
        // 17차원으로 조정
        while (corners.length < 17) corners.push(0);
        return corners.slice(0, 17);
    }
    
    // 유사도 계산 (가중치 적용)
    calculateWeightedSimilarity(vec1, vec2) {
        if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;
        
        // 특징별 가중치
        const weights = {
            color: 0.3,    // 색상: 30%
            edge: 0.3,     // 엣지: 30%
            pattern: 0.25, // 패턴: 25%
            shape: 0.15    // 형태: 15%
        };
        
        // 각 특징 구간
        const colorEnd = 256;
        const edgeEnd = colorEnd + 128;
        const patternEnd = edgeEnd + 128;
        const shapeEnd = patternEnd + 32;
        
        // 각 특징별 유사도 계산
        const colorSim = this.cosineSimilarity(
            vec1.slice(0, colorEnd),
            vec2.slice(0, colorEnd)
        );
        
        const edgeSim = this.cosineSimilarity(
            vec1.slice(colorEnd, edgeEnd),
            vec2.slice(colorEnd, edgeEnd)
        );
        
        const patternSim = this.cosineSimilarity(
            vec1.slice(edgeEnd, patternEnd),
            vec2.slice(edgeEnd, patternEnd)
        );
        
        const shapeSim = this.cosineSimilarity(
            vec1.slice(patternEnd, shapeEnd),
            vec2.slice(patternEnd, shapeEnd)
        );
        
        // 가중 평균
        const totalSim = 
            colorSim * weights.color +
            edgeSim * weights.edge +
            patternSim * weights.pattern +
            shapeSim * weights.shape;
        
        return totalSim;
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
    
    async testFeatureExtraction() {
        this.addDebugLog('=== 하이브리드 특징 추출 테스트 ===', 'critical');
        
        // 테스트 이미지 생성
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        const testCases = [
            { name: '검정', color: 'black' },
            { name: '검정+패턴', pattern: true },
            { name: '갈색', color: '#8B4513' },
            { name: '베이지', color: '#F5DEB3' }
        ];
        
        const vectors = [];
        
        for (const test of testCases) {
            if (test.pattern) {
                // 체크 패턴 (샤넬 스타일)
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, 100, 100);
                ctx.strokeStyle = 'gray';
                ctx.lineWidth = 2;
                
                for (let i = 0; i < 100; i += 10) {
                    ctx.beginPath();
                    ctx.moveTo(i, 0);
                    ctx.lineTo(100, i);
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(0, i);
                    ctx.lineTo(i, 100);
                    ctx.stroke();
                }
            } else {
                ctx.fillStyle = test.color;
                ctx.fillRect(0, 0, 100, 100);
            }
            
            const imageData = ctx.getImageData(0, 0, 100, 100);
            const features = await this.extractHybridFeatures(imageData, canvas);
            
            vectors.push({ name: test.name || '패턴', features });
            
            this.addDebugLog(`${test.name || '패턴'}: ${features.length}차원`, 'info');
        }
        
        // 유사도 테스트
        this.addDebugLog('하이브리드 유사도:', 'critical');
        for (let i = 0; i < vectors.length; i++) {
            for (let j = i + 1; j < vectors.length; j++) {
                const sim = this.calculateWeightedSimilarity(
                    vectors[i].features,
                    vectors[j].features
                );
                const color = sim > 0.8 ? 'error' : sim > 0.6 ? 'warning' : 'success';
                this.addDebugLog(
                    `  ${vectors[i].name} vs ${vectors[j].name}: ${(sim * 100).toFixed(1)}%`,
                    color
                );
            }
        }
    }
    
    async validateDatabase() {
        if (this.imageDatabase.length < 2) {
            this.addDebugLog('DB가 비어있습니다.', 'warning');
            return;
        }
        
        this.addDebugLog('=== DB 검증 ===', 'critical');
        
        const sampleSize = Math.min(5, this.imageDatabase.length);
        const similarities = [];
        
        for (let i = 0; i < sampleSize; i++) {
            for (let j = i + 1; j < sampleSize; j++) {
                const sim = this.calculateWeightedSimilarity(
                    this.imageDatabase[i].features,
                    this.imageDatabase[j].features
                );
                similarities.push(sim);
                
                this.addDebugLog(
                    `${i+1} vs ${j+1}: ${(sim * 100).toFixed(1)}%`,
                    sim > 0.9 ? 'error' : 'info'
                );
            }
        }
        
        const avgSim = similarities.reduce((a, b) => a + b, 0) / similarities.length;
        const range = Math.max(...similarities) - Math.min(...similarities);
        
        this.addDebugLog(`평균: ${(avgSim * 100).toFixed(1)}%, 범위: ${(range * 100).toFixed(1)}%`, 'critical');
        
        if (range < 0.3) {
            this.addDebugLog('⚠️ 다양성 부족!', 'error');
        } else {
            this.addDebugLog('✅ 특징 다양성 정상', 'success');
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
            // Canvas에서 특징 추출
            const canvas = document.createElement('canvas');
            const maxSize = 200;
            const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // 하이브리드 특징 추출
            const features = await this.extractHybridFeatures(imageData, canvas);
            
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
            
            // 유사도 계산
            const results = [];
            
            for (const img of this.imageDatabase) {
                const similarity = this.calculateWeightedSimilarity(queryVector, img.features);
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
                this.addDebugLog(`  범위: ${(range * 100).toFixed(1)}%`, range < 0.3 ? 'error' : 'success');
                
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
        this.addDebugLog(`=== 하이브리드 인덱싱 시작 ===`, 'critical');
        
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
                    
                    // Canvas에서 특징 추출
                    const canvas = document.createElement('canvas');
                    const maxSize = 200;
                    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const imageDataCanvas = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    // 하이브리드 특징 추출
                    const featureVector = await this.extractHybridFeatures(imageDataCanvas, canvas);
                    
                    // 처음 3개 상세 로그
                    if (processed < 3) {
                        this.addDebugLog(`이미지 ${processed + 1}: ${imageInfo.name}`, 'info');
                        
                        if (testVectors.length > 0) {
                            const sim = this.calculateWeightedSimilarity(
                                featureVector,
                                testVectors[testVectors.length - 1]
                            );
                            this.addDebugLog(`  이전과 유사도: ${(sim * 100).toFixed(1)}%`, 
                                sim > 0.9 ? 'error' : 'success');
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
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                    
                } catch (error) {
                    this.addDebugLog(`실패: ${imageInfo.name} - ${error.message}`, 'error');
                    processed++;
                }
            }
            
            // 최종 검증
            if (testVectors.length >= 2) {
                const finalSim = this.calculateWeightedSimilarity(testVectors[0], testVectors[1]);
                this.addDebugLog(`최종 검증 유사도: ${(finalSim * 100).toFixed(1)}%`, 
                    finalSim > 0.9 ? 'error' : 'success');
            }
            
            // DB 저장
            await this.saveDatabase();
            
            this.addDebugLog(`✅ 하이브리드 인덱싱 완료: ${this.imageDatabase.length}개`, 'success');
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
            
            // 유사도에 따른 스타일
            const hue = 120 * result.similarity;
            resultItem.style.cssText = `
                border: 3px solid hsl(${hue}, 100%, 50%);
                border-radius: 8px;
                overflow: hidden;
                margin: 10px;
                display: inline-block;
                width: 200px;
                vertical-align: top;
                transition: all 0.3s;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            `;
            
            try {
                const imageData = await readBinaryFile(result.path);
                const blob = new Blob([imageData]);
                const imageUrl = URL.createObjectURL(blob);
                
                resultItem.innerHTML = `
                    <img src="${imageUrl}" alt="${result.name}" 
                         style="width: 100%; height: 200px; object-fit: cover;">
                    <div style="padding: 10px; background: white;">
                        <div style="font-size: 12px; overflow: hidden; text-overflow: ellipsis;">
                            ${result.name}
                        </div>
                        <div style="font-size: 24px; font-weight: bold; color: hsl(${hue}, 100%, 40%);">
                            ${(result.similarity * 100).toFixed(1)}%
                        </div>
                    </div>
                `;
                
                resultItem.onmouseover = () => {
                    resultItem.style.transform = 'scale(1.05)';
                    resultItem.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
                };
                
                resultItem.onmouseout = () => {
                    resultItem.style.transform = '';
                    resultItem.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                };
                
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
    console.log('🔍 Fashion Search v17.0 - Hybrid');
    
    const style = document.createElement('style');
    style.textContent = `
        .mode-content { display: none; }
        .mode-content.active { display: block; }
        .mode-btn.active { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
        }
        #upload-area { 
            transition: all 0.3s; 
            cursor: pointer;
            background: white;
            border: 2px dashed #ccc;
        }
        #upload-area:hover { 
            border-color: #667eea; 
            transform: scale(1.02);
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        .result-item:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
    `;
    document.head.appendChild(style);
    
    new FashionSearchHybrid();
});
