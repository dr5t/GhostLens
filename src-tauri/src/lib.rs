pub mod commands;
pub mod services;
pub mod models;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().with_handler(|app_handle, _manager, shortcut| {
            use tauri::Emitter;
            use tauri_plugin_global_shortcut::Shortcut;
            
            let g = "CommandOrControl+Shift+G".parse::<Shortcut>().unwrap();
            let s = "CommandOrControl+Shift+S".parse::<Shortcut>().unwrap();
            let c = "CommandOrControl+Shift+C".parse::<Shortcut>().unwrap();
            let p = "CommandOrControl+Shift+P".parse::<Shortcut>().unwrap();

            let triggered = shortcut.id;
            if triggered == g.id() {
                app_handle.emit("shortcut-triggered", "open-popup").ok();
            } else if triggered == s.id() {
                app_handle.emit("shortcut-triggered", "screenshot-analyze").ok();
            } else if triggered == c.id() {
                app_handle.emit("shortcut-triggered", "analyze-clipboard").ok();
            } else if triggered == p.id() {
                app_handle.emit("shortcut-triggered", "open-settings").ok();
            }
        }).build())
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

            // Register global shortcuts
            use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
            let shortcut_g = "CommandOrControl+Shift+G".parse::<Shortcut>().unwrap();
            let shortcut_s = "CommandOrControl+Shift+S".parse::<Shortcut>().unwrap();
            let shortcut_c = "CommandOrControl+Shift+C".parse::<Shortcut>().unwrap();
            let shortcut_p = "CommandOrControl+Shift+P".parse::<Shortcut>().unwrap();

            app.global_shortcut().register(shortcut_g).ok();
            app.global_shortcut().register(shortcut_s).ok();
            app.global_shortcut().register(shortcut_c).ok();
            app.global_shortcut().register(shortcut_p).ok();

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
            commands::screen_capture::capture_interactive,
            commands::clipboard::get_clipboard_content,
            commands::utils::read_file_base64,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
