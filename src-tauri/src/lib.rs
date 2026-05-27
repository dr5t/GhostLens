pub mod commands;
pub mod services;
pub mod models;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Initialize the database
            let app_handle = app.handle().clone();
            let db_path = app.path().app_data_dir().unwrap_or_default().join("ghostlens.db");
            
            // Create app data dir if it doesn't exist
            if let Some(parent) = db_path.parent() {
                std::fs::create_dir_all(parent).ok();
            }

            // Initialize database
            services::memory::init_db(&db_path).expect("Failed to initialize database");

            // Store db path in app state
            app.manage(models::types::AppState {
                db_path: std::sync::Mutex::new(db_path),
            });

            // Start clipboard watcher
            let handle = app_handle.clone();
            std::thread::spawn(move || {
                services::clipboard_watcher::start_clipboard_watcher(handle);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::ai::ai_process,
            commands::ai::ai_process_stream,
            commands::settings::get_settings,
            commands::settings::save_settings,
            commands::settings::validate_api_key,
            commands::ocr::perform_ocr,
            commands::screen_capture::capture_full_screen,
            commands::screen_capture::capture_region,
            commands::clipboard::get_clipboard_content,
            commands::utils::read_file_base64,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
