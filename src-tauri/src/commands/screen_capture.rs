use crate::models::types::CaptureRegion;
use std::process::Command;

#[tauri::command]
pub async fn capture_full_screen() -> Result<String, String> {
    let temp_dir = std::env::temp_dir();
    let filename = format!("ghostlens_capture_{}.png", chrono::Utc::now().timestamp_millis());
    let filepath = temp_dir.join(&filename);

    // Use macOS screencapture CLI tool (built-in, no permissions prompt for non-interactive)
    let output = Command::new("screencapture")
        .args(["-x", "-C", filepath.to_str().unwrap()])
        .output()
        .map_err(|e| format!("Screen capture failed: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Screen capture failed: {}", stderr));
    }

    Ok(filepath.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn capture_region(region: CaptureRegion) -> Result<String, String> {
    let temp_dir = std::env::temp_dir();
    let filename = format!("ghostlens_region_{}.png", chrono::Utc::now().timestamp_millis());
    let filepath = temp_dir.join(&filename);

    // Use macOS screencapture with region flag
    // -R x,y,w,h captures a specific region
    let region_str = format!(
        "{},{},{},{}",
        region.x as i32,
        region.y as i32,
        region.width as i32,
        region.height as i32
    );

    let output = Command::new("screencapture")
        .args(["-x", "-R", &region_str, filepath.to_str().unwrap()])
        .output()
        .map_err(|e| format!("Region capture failed: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Region capture failed: {}", stderr));
    }

    Ok(filepath.to_string_lossy().to_string())
}
