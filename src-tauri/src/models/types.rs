use std::path::PathBuf;
use std::sync::Mutex;
use serde::{Deserialize, Serialize};

/// Global app state managed by Tauri
pub struct AppState {
    pub db_path: Mutex<PathBuf>,
    pub settings: std::sync::RwLock<AppSettings>,
}

/// AI Provider enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AIProvider {
    OpenAI,
    Gemini,
    Claude,
    Ollama,
}

/// AI Provider configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIProviderConfig {
    pub provider: AIProvider,
    pub api_key: String,
    pub model: String,
    pub base_url: Option<String>,
    pub enabled: bool,
}

/// Shortcut configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShortcutConfig {
    pub open_popup: String,
    pub screenshot_analyze: String,
    pub analyze_clipboard: String,
    pub command_palette: String,
}

/// App settings
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub providers: Vec<AIProviderConfig>,
    pub default_provider: AIProvider,
    pub shortcuts: ShortcutConfig,
    pub gestures_enabled: bool,
    pub triple_ctrl_enabled: bool,
    pub mouse_wiggle_enabled: bool,
    pub gesture_sensitivity: u32,
    pub popup_opacity: u32,
    pub popup_width: u32,
    pub popup_height: u32,
    pub launch_at_startup: bool,
    pub show_in_dock: bool,
    pub show_tray_icon: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            providers: vec![
                AIProviderConfig {
                    provider: AIProvider::Gemini,
                    api_key: String::new(),
                    model: "gemini-2.0-flash".to_string(),
                    base_url: None,
                    enabled: true,
                },
                AIProviderConfig {
                    provider: AIProvider::OpenAI,
                    api_key: String::new(),
                    model: "gpt-4o".to_string(),
                    base_url: None,
                    enabled: false,
                },
                AIProviderConfig {
                    provider: AIProvider::Claude,
                    api_key: String::new(),
                    model: "claude-sonnet-4-20250514".to_string(),
                    base_url: None,
                    enabled: false,
                },
                AIProviderConfig {
                    provider: AIProvider::Ollama,
                    api_key: String::new(),
                    model: "llama3.1".to_string(),
                    base_url: Some("http://localhost:11434".to_string()),
                    enabled: false,
                },
            ],
            default_provider: AIProvider::Gemini,
            shortcuts: ShortcutConfig {
                open_popup: "CommandOrControl+Shift+G".to_string(),
                screenshot_analyze: "CommandOrControl+Shift+S".to_string(),
                analyze_clipboard: "CommandOrControl+Shift+C".to_string(),
                command_palette: "CommandOrControl+Shift+P".to_string(),
            },
            gestures_enabled: true,
            triple_ctrl_enabled: true,
            mouse_wiggle_enabled: false,
            gesture_sensitivity: 50,
            popup_opacity: 95,
            popup_width: 480,
            popup_height: 600,
            launch_at_startup: false,
            show_in_dock: true,
            show_tray_icon: true,
        }
    }
}

/// Capture region
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureRegion {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

/// OCR result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OCRResult {
    pub text: String,
    pub blocks: Vec<OCRBlock>,
    pub confidence: f64,
    pub language: Option<String>,
    pub code_language: Option<String>,
}

/// OCR block
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OCRBlock {
    pub text: String,
    pub confidence: f64,
}

/// Stream chunk sent to frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamChunk {
    pub text: String,
    pub done: bool,
}

/// Clipboard content
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipboardContent {
    pub content: String,
    pub content_type: String,
}
