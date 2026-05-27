use crate::models::types::OCRResult;
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;

#[tauri::command]
pub async fn perform_ocr(
    app_handle: AppHandle,
    image_path: String,
) -> Result<OCRResult, String> {
    // Try to use the Swift sidecar first (macOS Vision framework)
    match run_ocr_sidecar(&app_handle, &image_path).await {
        Ok(result) => Ok(result),
        Err(_) => {
            // Fallback: return a helpful error message
            Err("OCR sidecar not available. Please build the Swift OCR binary. See README for instructions.".to_string())
        }
    }
}

async fn run_ocr_sidecar(
    app_handle: &AppHandle,
    image_path: &str,
) -> Result<OCRResult, String> {
    let shell = app_handle.shell();

    let output = shell
        .sidecar("ocr-cli")
        .map_err(|e| format!("Failed to find OCR sidecar: {}", e))?
        .args([image_path])
        .output()
        .await
        .map_err(|e| format!("Failed to run OCR sidecar: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("OCR sidecar failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let result: OCRResult =
        serde_json::from_str(&stdout).map_err(|e| format!("Failed to parse OCR output: {}", e))?;

    Ok(result)
}
