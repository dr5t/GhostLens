use tauri::{AppHandle, Emitter};
use tauri_plugin_clipboard_manager::ClipboardExt;
use std::thread;
use std::time::Duration;

use crate::models::types::ClipboardContent;

/// Start monitoring clipboard for changes in a background thread
pub fn start_clipboard_watcher(app_handle: AppHandle) {
    let mut last_content = String::new();

    loop {
        thread::sleep(Duration::from_millis(800));

        if let Ok(content) = app_handle.clipboard().read_text() {
            if !content.is_empty() && content != last_content {
                last_content = content.clone();
                let content_type = detect_content_type(&content);

                let payload = ClipboardContent {
                    content: content.clone(),
                    content_type,
                };

                app_handle.emit("clipboard-changed", payload).ok();
            }
        }
    }
}

/// Detect the type of clipboard content
pub fn detect_content_type(content: &str) -> String {
    let trimmed = content.trim();

    // Check for URL
    if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        return "url".to_string();
    }

    // Check for JSON
    if (trimmed.starts_with('{') && trimmed.ends_with('}'))
        || (trimmed.starts_with('[') && trimmed.ends_with(']'))
    {
        if serde_json::from_str::<serde_json::Value>(trimmed).is_ok() {
            return "json".to_string();
        }
    }

    // Check for code patterns
    let code_indicators = [
        "fn ", "pub ", "let ", "const ", "var ", "function ", "class ",
        "import ", "from ", "def ", "return ", "if (", "for (", "while (",
        "=>", "->", "pub fn", "#include", "#define", "package ", "interface ",
        "struct ", "enum ", "impl ", "async ", "await ", "export ",
    ];

    let code_symbols = [";", "(){", "};", "});", "==", "!=", "&&", "||"];

    let lines: Vec<&str> = trimmed.lines().collect();
    let mut code_score = 0;

    for line in &lines {
        let l = line.trim();
        for indicator in &code_indicators {
            if l.contains(indicator) {
                code_score += 2;
            }
        }
        for symbol in &code_symbols {
            if l.contains(symbol) {
                code_score += 1;
            }
        }
    }

    if code_score >= 3 || (lines.len() > 1 && code_score >= 2) {
        return "code".to_string();
    }

    "text".to_string()
}
