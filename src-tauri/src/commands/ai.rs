use tauri::{AppHandle, State};
use crate::models::types::{AppState, AIProvider};
use crate::services::ai_router;

/// System prompts for each action
fn get_system_prompt(action: &str) -> &'static str {
    match action {
        "explain" => "You are a helpful assistant. Explain the following content clearly and concisely. Use simple language and provide examples where helpful.",
        "summarize" => "Summarize the following content concisely. Highlight key points and main ideas. Keep it brief but comprehensive.",
        "translate" => "Translate the following text to English. If the text is already in English, translate it to Spanish. Preserve the original meaning and tone.",
        "fix_grammar" => "Fix any grammar, spelling, and punctuation errors in the following text. Maintain the original meaning and tone. Show the corrected version.",
        "explain_code" => "You are an expert programmer. Explain what the following code does step by step. Mention the programming language, key concepts used, and any potential issues.",
        "debug_error" => "You are an expert debugger. Analyze the following error message or code issue. Explain what went wrong, why it happened, and provide concrete fixes with code examples.",
        "optimize_code" => "You are an expert programmer. Optimize the following code for better performance, readability, and best practices. Show the improved version with explanations.",
        "generate_notes" => "Generate well-organized study notes from the following content. Use bullet points, headers, and highlight key terms. Make it easy to review and memorize.",
        "rewrite" => "Rewrite the following text to improve clarity and readability while maintaining the original meaning.",
        "simplify" => "Simplify the following text to make it easier to understand. Use plain language and short sentences.",
        "convert_code" => "Convert the following code to Python. Maintain the same logic and add comments explaining the conversion.",
        _ => "You are a helpful AI assistant. Help the user with the following content.",
    }
}

#[tauri::command]
pub async fn ai_process(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    action: String,
    text: String,
    provider: Option<String>,
    image_base64: Option<String>,
    custom_prompt: Option<String>,
) -> Result<String, String> {
    let db_path = state.db_path.lock().unwrap().clone();

    // Load settings to get provider config
    let settings_json = crate::services::memory::get_setting(&db_path, "app_settings")
        .map_err(|e| e.to_string())?;

    let settings: crate::models::types::AppSettings = if let Some(json_str) = settings_json {
        serde_json::from_str(&json_str).unwrap_or_default()
    } else {
        Default::default()
    };

    // Find the provider config
    let provider_enum = if let Some(ref p) = provider {
        match p.as_str() {
            "openai" => AIProvider::OpenAI,
            "gemini" => AIProvider::Gemini,
            "claude" => AIProvider::Claude,
            "ollama" => AIProvider::Ollama,
            _ => settings.default_provider.clone(),
        }
    } else {
        settings.default_provider.clone()
    };

    let provider_config = settings
        .providers
        .iter()
        .find(|p| p.provider == provider_enum)
        .ok_or_else(|| "Provider not configured".to_string())?;

    if provider_config.api_key.is_empty() && provider_config.provider != AIProvider::Ollama {
        return Err(format!(
            "No API key configured for {:?}. Please add your API key in Settings.",
            provider_config.provider
        ));
    }

    let system_prompt = if let Some(ref custom) = custom_prompt {
        custom.as_str()
    } else {
        get_system_prompt(&action)
    };

    let result = ai_router::process_ai_request(
        &app_handle,
        provider_config,
        system_prompt,
        &text,
        image_base64.as_deref(),
    )
    .await?;

    // Save to history
    let id = uuid::Uuid::new_v4().to_string();
    let timestamp = chrono::Utc::now().timestamp();
    crate::services::memory::add_ai_history(
        &db_path,
        &id,
        &action,
        &text,
        &result,
        &format!("{:?}", provider_config.provider),
        &provider_config.model,
        timestamp,
    )
    .ok();

    Ok(result)
}

#[tauri::command]
pub async fn ai_process_stream(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    action: String,
    text: String,
    provider: Option<String>,
    image_base64: Option<String>,
    custom_prompt: Option<String>,
) -> Result<(), String> {
    // Reuse ai_process - it already emits stream chunks
    ai_process(app_handle, state, action, text, provider, image_base64, custom_prompt).await?;
    Ok(())
}
