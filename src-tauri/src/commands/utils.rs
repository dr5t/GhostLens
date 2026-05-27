use base64::Engine;
use std::fs;

#[tauri::command]
pub async fn read_file_base64(file_path: String) -> Result<String, String> {
    let bytes = fs::read(&file_path)
        .map_err(|e| format!("Failed to read file {}: {}", file_path, e))?;
    
    let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);
    Ok(encoded)
}
