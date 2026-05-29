use rdev::{listen, Event, EventType, Key, Button};
use std::time::{Instant, Duration};
use tauri::{AppHandle, Emitter, Manager};
use std::sync::atomic::{AtomicBool, Ordering};

static GESTURE_WATCHER_RUNNING: AtomicBool = AtomicBool::new(false);

#[derive(PartialEq, Clone, Copy, Debug)]
enum WiggleDirection {
    None,
    Left,
    Right,
}

/// Start monitoring global input events in a background thread
pub fn start_gesture_watcher(app_handle: AppHandle) {
    // Prevent duplicate watcher threads
    if GESTURE_WATCHER_RUNNING.swap(true, Ordering::SeqCst) {
        return;
    }

    let mut last_click_times: Vec<Instant> = Vec::new();
    let mut last_ctrl_times: Vec<Instant> = Vec::new();

    // Mouse wiggle detection state
    let mut last_x = 0.0;
    let mut last_y = 0.0;
    let mut direction_changes: Vec<Instant> = Vec::new();
    let mut last_direction = WiggleDirection::None;

    let app_handle_clone = app_handle.clone();
    let handler = move |event: Event| {
        // Retrieve settings from app state
        let state = app_handle_clone.try_state::<crate::models::types::AppState>();
        if state.is_none() {
            return;
        }
        let state = state.unwrap();
        
        let settings = match state.settings.read() {
            Ok(s) => s.clone(),
            Err(_) => return,
        };

        // If gestures are globally disabled, skip processing
        if !settings.gestures_enabled {
            return;
        }

        match event.event_type {
            // Triple Left Click detection
            EventType::ButtonPress(Button::Left) => {
                if !settings.gestures_enabled {
                    return;
                }
                // Custom click window based on sensitivity (higher sensitivity = wider window, easier to trigger)
                let click_window_ms = 400 + (settings.gesture_sensitivity as u64 * 4);
                let now = Instant::now();
                last_click_times.push(now);

                // Retain only clicks in the computed window
                last_click_times.retain(|&t| now.duration_since(t) < Duration::from_millis(click_window_ms));

                if last_click_times.len() >= 3 {
                    last_click_times.clear();
                    app_handle_clone.emit("gesture-triggered", "triple-click").ok();
                }
            }

            // Triple Control tap detection
            EventType::KeyPress(Key::ControlLeft) | EventType::KeyPress(Key::ControlRight) => {
                if !settings.triple_ctrl_enabled {
                    return;
                }
                // Custom tap window based on sensitivity (higher sensitivity = wider window, easier to trigger)
                let tap_window_ms = 400 + (settings.gesture_sensitivity as u64 * 4);
                let now = Instant::now();
                last_ctrl_times.push(now);

                // Retain only taps in the computed window
                last_ctrl_times.retain(|&t| now.duration_since(t) < Duration::from_millis(tap_window_ms));

                if last_ctrl_times.len() >= 3 {
                    last_ctrl_times.clear();
                    app_handle_clone.emit("gesture-triggered", "triple-ctrl").ok();
                }
            }

            // Mouse wiggle detection
            EventType::MouseMove { x, y } => {
                if !settings.mouse_wiggle_enabled {
                    return;
                }
                let now = Instant::now();
                if last_x != 0.0 || last_y != 0.0 {
                    let dx = x - last_x;

                    // Custom horizontal threshold based on sensitivity (higher sensitivity = smaller distance required)
                    // At sensitivity=100: threshold = 5.0
                    // At sensitivity=50: threshold = 15.0
                    // At sensitivity=0: threshold = 25.0
                    let wiggle_threshold = 25.0 - (settings.gesture_sensitivity as f64 * 0.2);
                    let wiggle_threshold = wiggle_threshold.max(5.0).min(25.0);

                    // Only count significant horizontal movement changes
                    if dx.abs() > wiggle_threshold {
                        let current_direction = if dx < 0.0 {
                            WiggleDirection::Left
                        } else {
                            WiggleDirection::Right
                        };

                        if last_direction != WiggleDirection::None && current_direction != last_direction {
                            direction_changes.push(now);
                        }
                        last_direction = current_direction;
                    }
                }
                last_x = x;
                last_y = y;

                // Retain only direction changes in the last 500ms
                direction_changes.retain(|&t| now.duration_since(t) < Duration::from_millis(500));

                if direction_changes.len() >= 4 {
                    direction_changes.clear();
                    last_direction = WiggleDirection::None;
                    app_handle_clone.emit("gesture-triggered", "mouse-wiggle").ok();
                }
            }
            _ => {}
        }
    };

    if let Err(e) = listen(handler) {
        eprintln!("Failed to start global input listener: {:?}", e);
        GESTURE_WATCHER_RUNNING.store(false, Ordering::SeqCst);
    }
}
