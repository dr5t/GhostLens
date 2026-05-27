use rdev::{listen, Event, EventType, Key, Button};
use std::time::{Instant, Duration};
use tauri::{AppHandle, Emitter};

#[derive(PartialEq, Clone, Copy, Debug)]
enum WiggleDirection {
    None,
    Left,
    Right,
}

/// Start monitoring global input events in a background thread
pub fn start_gesture_watcher(app_handle: AppHandle) {
    let mut last_click_times: Vec<Instant> = Vec::new();
    let mut last_ctrl_times: Vec<Instant> = Vec::new();

    // Mouse wiggle detection state
    let mut last_x = 0.0;
    let mut last_y = 0.0;
    let mut direction_changes: Vec<Instant> = Vec::new();
    let mut last_direction = WiggleDirection::None;

    let handler = move |event: Event| {
        match event.event_type {
            // Triple Left Click detection
            EventType::ButtonPress(Button::Left) => {
                let now = Instant::now();
                last_click_times.push(now);

                // Retain only clicks in the last 600ms
                last_click_times.retain(|&t| now.duration_since(t) < Duration::from_millis(600));

                if last_click_times.len() >= 3 {
                    last_click_times.clear();
                    app_handle.emit("gesture-triggered", "triple-click").ok();
                }
            }

            // Triple Control tap detection
            EventType::KeyPress(Key::ControlLeft) | EventType::KeyPress(Key::ControlRight) => {
                let now = Instant::now();
                last_ctrl_times.push(now);

                // Retain only taps in the last 600ms
                last_ctrl_times.retain(|&t| now.duration_since(t) < Duration::from_millis(600));

                if last_ctrl_times.len() >= 3 {
                    last_ctrl_times.clear();
                    app_handle.emit("gesture-triggered", "triple-ctrl").ok();
                }
            }

            // Mouse wiggle detection
            EventType::MouseMove { x, y } => {
                let now = Instant::now();
                if last_x != 0.0 || last_y != 0.0 {
                    let dx = x - last_x;

                    // Only count significant horizontal movement changes
                    if dx.abs() > 15.0 {
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
                    app_handle.emit("gesture-triggered", "mouse-wiggle").ok();
                }
            }
            _ => {}
        }
    };

    if let Err(e) = listen(handler) {
        eprintln!("Failed to start global input listener: {:?}", e);
    }
}
