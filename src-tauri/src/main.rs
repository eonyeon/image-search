#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;
use image::{GenericImageView, imageops::FilterType};
use serde::{Deserialize, Serialize};
use base64::{Engine as _, engine::general_purpose};

// 이미지 전처리 결과 구조체
#[derive(Serialize, Deserialize)]
struct PreprocessedImage {
    data: Vec<f32>,
    width: u32,
    height: u32,
}

// 파일 위치 열기 명령
#[tauri::command]
fn open_file_location(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .args(&["/select,", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args(&["-R", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        // Try different file managers
        let file_managers = vec!["nautilus", "dolphin", "thunar", "pcmanfm", "nemo"];
        let mut opened = false;

        for fm in file_managers {
            if let Ok(_) = Command::new(fm)
                .arg(&path)
                .spawn()
            {
                opened = true;
                break;
            }
        }

        if !opened {
            // Fallback: open parent directory
            if let Some(parent) = std::path::Path::new(&path).parent() {
                Command::new("xdg-open")
                    .arg(parent)
                    .spawn()
                    .map_err(|e| e.to_string())?;
            }
        }
    }

    Ok(())
}

// 이미지 전처리 (ML 모델용)
#[tauri::command]
async fn preprocess_image_for_ml(image_path: String) -> Result<PreprocessedImage, String> {
    // 이미지 로드
    let img = image::open(&image_path)
        .map_err(|e| format!("Failed to open image: {}", e))?;
    
    // 224x224로 리사이즈 (MobileNet 입력 크기)
    let resized = img.resize_exact(224, 224, FilterType::Lanczos3);
    
    // RGB로 변환
    let rgb_img = resized.to_rgb8();
    
    // 정규화된 픽셀 데이터 생성 (-1 ~ 1 범위)
    let mut normalized_data = Vec::with_capacity(224 * 224 * 3);
    
    for pixel in rgb_img.pixels() {
        // MobileNet v2는 -1 ~ 1 범위로 정규화
        normalized_data.push((pixel[0] as f32 - 127.5) / 127.5);
        normalized_data.push((pixel[1] as f32 - 127.5) / 127.5);
        normalized_data.push((pixel[2] as f32 - 127.5) / 127.5);
    }
    
    Ok(PreprocessedImage {
        data: normalized_data,
        width: 224,
        height: 224,
    })
}

// 퍼셉추얼 해시 계산 (빠른 유사도 비교용)
#[tauri::command]
fn calculate_perceptual_hash(image_path: String) -> Result<String, String> {
    let img = image::open(&image_path)
        .map_err(|e| format!("Failed to open image: {}", e))?;
    
    // 8x8로 리사이즈
    let small = img.resize_exact(8, 8, FilterType::Nearest);
    let gray = small.to_luma8();
    
    // 평균 계산
    let pixels: Vec<u8> = gray.pixels().map(|p| p[0]).collect();
    let avg: u32 = pixels.iter().map(|&p| p as u32).sum::<u32>() / 64;
    
    // 해시 생성
    let mut hash = String::with_capacity(64);
    for pixel in pixels {
        hash.push(if pixel as u32 > avg { '1' } else { '0' });
    }
    
    Ok(hash)
}

// 이미지 썸네일 생성
#[tauri::command]
async fn create_thumbnail(image_path: String, max_size: u32) -> Result<String, String> {
    let img = image::open(&image_path)
        .map_err(|e| format!("Failed to open image: {}", e))?;
    
    // 종횡비 유지하며 리사이즈
    let thumbnail = img.thumbnail(max_size, max_size);
    
    // JPEG로 인코딩
    let mut buffer = Vec::new();
    let mut cursor = std::io::Cursor::new(&mut buffer);
    
    thumbnail.write_to(&mut cursor, image::ImageOutputFormat::Jpeg(80))
        .map_err(|e| format!("Failed to encode thumbnail: {}", e))?;
    
    // Base64로 인코딩
    let base64_data = general_purpose::STANDARD.encode(&buffer);
    Ok(format!("data:image/jpeg;base64,{}", base64_data))
}

// 이미지 메타데이터 추출
#[tauri::command]
fn get_image_metadata(image_path: String) -> Result<serde_json::Value, String> {
    let img = image::open(&image_path)
        .map_err(|e| format!("Failed to open image: {}", e))?;
    
    let (width, height) = img.dimensions();
    let aspect_ratio = width as f32 / height as f32;
    
    Ok(serde_json::json!({
        "width": width,
        "height": height,
        "aspectRatio": aspect_ratio,
        "format": format!("{:?}", img.color()),
    }))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_file_location,
            preprocess_image_for_ml,
            calculate_perceptual_hash,
            create_thumbnail,
            get_image_metadata
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
