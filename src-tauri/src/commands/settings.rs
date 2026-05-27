use tauri::State;
use crate::models::types::{AppSettings, AppState, AIProvider};
use crate::services::{ai_router, memory};

#[tauri::command]
pub async fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    let db_path = state.db_path.lock().unwrap().clone();

    let settings_json = memory::get_setting(&db_path, "app_settings")
        .map_err(|e| e.to_string())?;

    let settings: AppSettings = if let Some(json_str) = settings_json {
        serde_json::from_str(&json_str).unwrap_or_default()
    } else {
        Default::default()
    };

    Ok(settings)
}

#[tauri::command]
pub async fn save_settings(
    state: State<'_, AppState>,
    settings: AppSettings,
) -> Result<(), String> {
    let db_path = state.db_path.lock().unwrap().clone();
    let json_str = serde_json::to_string(&settings).map_err(|e| e.to_string())?;
    memory::set_setting(&db_path, "app_settings", &json_str).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn validate_api_key(
    provider: String,
    api_key: String,
) -> Result<bool, String> {
    let provider_enum = match provider.as_str() {
        "openai" => AIProvider::OpenAI,
        "gemini" => AIProvider::Gemini,
        "claude" => AIProvider::Claude,
        "ollama" => AIProvider::Ollama,
        _ => return Err("Unknown provider".to_string()),
    };

    ai_router::validate_key(&provider_enum, &api_key).await
}
