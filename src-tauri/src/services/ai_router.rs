use crate::models::types::{AIProvider, AIProviderConfig, StreamChunk};
use reqwest::Client;
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter};

/// Send a request to the configured AI provider and stream the response
pub async fn process_ai_request(
    app_handle: &AppHandle,
    provider_config: &AIProviderConfig,
    system_prompt: &str,
    user_text: &str,
    image_base64: Option<&str>,
) -> Result<String, String> {
    let client = Client::new();

    match provider_config.provider {
        AIProvider::Gemini => {
            process_gemini(&client, app_handle, provider_config, system_prompt, user_text, image_base64).await
        }
        AIProvider::OpenAI => {
            process_openai(&client, app_handle, provider_config, system_prompt, user_text, image_base64).await
        }
        AIProvider::Claude => {
            process_claude(&client, app_handle, provider_config, system_prompt, user_text, image_base64).await
        }
        AIProvider::Ollama => {
            process_ollama(&client, app_handle, provider_config, system_prompt, user_text).await
        }
    }
}

/// Process request via Google Gemini API
async fn process_gemini(
    client: &Client,
    app_handle: &AppHandle,
    config: &AIProviderConfig,
    system_prompt: &str,
    user_text: &str,
    image_base64: Option<&str>,
) -> Result<String, String> {
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        config.model, config.api_key
    );

    let mut parts: Vec<Value> = vec![json!({ "text": user_text })];

    if let Some(img) = image_base64 {
        parts.push(json!({
            "inline_data": {
                "mime_type": "image/png",
                "data": img
            }
        }));
    }

    let body = json!({
        "system_instruction": {
            "parts": [{ "text": system_prompt }]
        },
        "contents": [{
            "parts": parts
        }]
    });

    let resp = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Gemini request failed: {}", e))?;

    let resp_json: Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse Gemini response: {}", e))?;

    let text = resp_json["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .unwrap_or("No response generated")
        .to_string();

    // Emit the full response as a stream chunk
    app_handle
        .emit("ai-stream-chunk", StreamChunk { text: text.clone(), done: false })
        .ok();
    app_handle
        .emit("ai-stream-chunk", StreamChunk { text: String::new(), done: true })
        .ok();

    Ok(text)
}

/// Process request via OpenAI API
async fn process_openai(
    client: &Client,
    app_handle: &AppHandle,
    config: &AIProviderConfig,
    system_prompt: &str,
    user_text: &str,
    image_base64: Option<&str>,
) -> Result<String, String> {
    let url = "https://api.openai.com/v1/chat/completions";

    let mut user_content: Vec<Value> = vec![json!({ "type": "text", "text": user_text })];

    if let Some(img) = image_base64 {
        user_content.push(json!({
            "type": "image_url",
            "image_url": {
                "url": format!("data:image/png;base64,{}", img)
            }
        }));
    }

    let body = json!({
        "model": config.model,
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user", "content": user_content }
        ],
        "max_tokens": 2048
    });

    let resp = client
        .post(url)
        .header("Authorization", format!("Bearer {}", config.api_key))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("OpenAI request failed: {}", e))?;

    let resp_json: Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse OpenAI response: {}", e))?;

    if let Some(error) = resp_json.get("error") {
        return Err(format!("OpenAI error: {}", error["message"].as_str().unwrap_or("Unknown error")));
    }

    let text = resp_json["choices"][0]["message"]["content"]
        .as_str()
        .unwrap_or("No response generated")
        .to_string();

    app_handle
        .emit("ai-stream-chunk", StreamChunk { text: text.clone(), done: false })
        .ok();
    app_handle
        .emit("ai-stream-chunk", StreamChunk { text: String::new(), done: true })
        .ok();

    Ok(text)
}

/// Process request via Anthropic Claude API
async fn process_claude(
    client: &Client,
    app_handle: &AppHandle,
    config: &AIProviderConfig,
    system_prompt: &str,
    user_text: &str,
    image_base64: Option<&str>,
) -> Result<String, String> {
    let url = "https://api.anthropic.com/v1/messages";

    let mut user_content: Vec<Value> = vec![];

    if let Some(img) = image_base64 {
        user_content.push(json!({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/png",
                "data": img
            }
        }));
    }

    user_content.push(json!({ "type": "text", "text": user_text }));

    let body = json!({
        "model": config.model,
        "max_tokens": 2048,
        "system": system_prompt,
        "messages": [{
            "role": "user",
            "content": user_content
        }]
    });

    let resp = client
        .post(url)
        .header("x-api-key", &config.api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Claude request failed: {}", e))?;

    let resp_json: Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse Claude response: {}", e))?;

    if let Some(error) = resp_json.get("error") {
        return Err(format!("Claude error: {}", error["message"].as_str().unwrap_or("Unknown error")));
    }

    let text = resp_json["content"][0]["text"]
        .as_str()
        .unwrap_or("No response generated")
        .to_string();

    app_handle
        .emit("ai-stream-chunk", StreamChunk { text: text.clone(), done: false })
        .ok();
    app_handle
        .emit("ai-stream-chunk", StreamChunk { text: String::new(), done: true })
        .ok();

    Ok(text)
}

/// Process request via local Ollama
async fn process_ollama(
    client: &Client,
    app_handle: &AppHandle,
    config: &AIProviderConfig,
    system_prompt: &str,
    user_text: &str,
) -> Result<String, String> {
    let base_url = config
        .base_url
        .as_deref()
        .unwrap_or("http://localhost:11434");
    let url = format!("{}/api/generate", base_url);

    let body = json!({
        "model": config.model,
        "prompt": user_text,
        "system": system_prompt,
        "stream": false
    });

    let resp = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Ollama request failed: {}. Is Ollama running?", e))?;

    let resp_json: Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

    let text = resp_json["response"]
        .as_str()
        .unwrap_or("No response generated")
        .to_string();

    app_handle
        .emit("ai-stream-chunk", StreamChunk { text: text.clone(), done: false })
        .ok();
    app_handle
        .emit("ai-stream-chunk", StreamChunk { text: String::new(), done: true })
        .ok();

    Ok(text)
}

/// Validate an API key by making a minimal test request
pub async fn validate_key(provider: &AIProvider, api_key: &str) -> Result<bool, String> {
    let client = Client::new();

    match provider {
        AIProvider::Gemini => {
            let url = format!(
                "https://generativelanguage.googleapis.com/v1beta/models?key={}",
                api_key
            );
            let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
            Ok(resp.status().is_success())
        }
        AIProvider::OpenAI => {
            let resp = client
                .get("https://api.openai.com/v1/models")
                .header("Authorization", format!("Bearer {}", api_key))
                .send()
                .await
                .map_err(|e| e.to_string())?;
            Ok(resp.status().is_success())
        }
        AIProvider::Claude => {
            // Claude doesn't have a simple validation endpoint, just check key format
            Ok(api_key.starts_with("sk-ant-"))
        }
        AIProvider::Ollama => {
            // Ollama doesn't need a key
            Ok(true)
        }
    }
}
