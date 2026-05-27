use crate::models::types::ClipboardContent;
use crate::services::clipboard_watcher;
use tauri::AppHandle;
use tauri_plugin_clipboard_manager::ClipboardExt;

#[tauri::command]
pub async fn get_clipboard_content(app_handle: AppHandle) -> Result<ClipboardContent, String> {
    let content = app_handle
        .clipboard()
        .read_text()
        .map_err(|e| format!("Failed to read clipboard: {}", e))?;

    let content_type = clipboard_watcher::detect_content_type(&content);

    Ok(ClipboardContent {
        content,
        content_type,
    })
}
