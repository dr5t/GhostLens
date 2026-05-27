use rusqlite::{Connection, Result};
use std::path::Path;

/// Initialize the SQLite database and create tables
pub fn init_db(db_path: &Path) -> Result<()> {
    let conn = Connection::open(db_path)?;

    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS clipboard_history (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            content_type TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ai_history (
            id TEXT PRIMARY KEY,
            action TEXT NOT NULL,
            input_text TEXT NOT NULL,
            response_text TEXT NOT NULL,
            provider TEXT NOT NULL,
            model TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ocr_cache (
            image_hash TEXT PRIMARY KEY,
            result_json TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        );
        ",
    )?;

    Ok(())
}

/// Get a setting value
pub fn get_setting(db_path: &Path, key: &str) -> Result<Option<String>> {
    let conn = Connection::open(db_path)?;
    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
    let result = stmt.query_row([key], |row| row.get(0)).ok();
    Ok(result)
}

/// Set a setting value
pub fn set_setting(db_path: &Path, key: &str, value: &str) -> Result<()> {
    let conn = Connection::open(db_path)?;
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
        [key, value],
    )?;
    Ok(())
}

/// Add clipboard entry
pub fn add_clipboard_entry(
    db_path: &Path,
    id: &str,
    content: &str,
    content_type: &str,
    timestamp: i64,
) -> Result<()> {
    let conn = Connection::open(db_path)?;
    conn.execute(
        "INSERT OR REPLACE INTO clipboard_history (id, content, content_type, timestamp) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![id, content, content_type, timestamp],
    )?;

    // Keep only last 100 entries
    conn.execute(
        "DELETE FROM clipboard_history WHERE id NOT IN (SELECT id FROM clipboard_history ORDER BY timestamp DESC LIMIT 100)",
        [],
    )?;

    Ok(())
}

/// Add AI interaction to history
pub fn add_ai_history(
    db_path: &Path,
    id: &str,
    action: &str,
    input_text: &str,
    response_text: &str,
    provider: &str,
    model: &str,
    timestamp: i64,
) -> Result<()> {
    let conn = Connection::open(db_path)?;
    conn.execute(
        "INSERT INTO ai_history (id, action, input_text, response_text, provider, model, timestamp) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![id, action, input_text, response_text, provider, model, timestamp],
    )?;
    Ok(())
}
