# 👻 GhostLens — AI Screen Context Assistant

[![Tauri v2](https://img.shields.io/badge/Tauri-v2.0-blue?logo=tauri)](https://tauri.app)
[![React](https://img.shields.io/badge/React-v19-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5-blue?logo=typescript)](https://www.typescriptlang.org)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red)](/LICENSE)
[![Platform](https://img.shields.io/badge/Platform-macOS-lightgrey?logo=apple)](https://apple.com)

A desktop AI assistant built with **Tauri 2, React, TypeScript, and Rust**. GhostLens understands your on-screen context, monitors your clipboard, and processes region-specific screenshots using Apple's native **Vision Framework** sidecar to provide instant, multimodal AI intelligence—all packaged into a premium glassmorphic interface.

---

## ✨ Features

- **🔍 Smart OCR Region Capture**: Drag-to-select regions interactively on screen using macOS native tooling. Text is instantly extracted with offline Apple Vision.
- **⚡ Streaming AI Actions**: Process captured text with high-quality presets (Explain, Summarize, Translate, Fix Grammar, Study Notes).
- **💻 Programming Intelligence**: Detect code syntax automatically on capture, enabling syntax-highlighted code block rendering and smart actions (Explain Code, Debug, Optimize, Convert).
- **📋 Clipboard Watcher**: Background thread monitoring system-wide clipboard updates. Detects whether content is text, URLs, JSON, or code, and parses it on command.
- **⚙️ Multi-AI Router**: Seamless settings integration for Google Gemini, OpenAI, Anthropic Claude, and local Ollama instances.
- **🎨 Glassmorphic Desktop UI**: Premium floating panel with micro-animations, drag controls, dynamic resizing, and opacity controls.

---

## 🛠️ Architecture

```
                       ┌───────────────────────────────┐
                       │   React + TypeScript UI       │
                       │ ┌───────────────────────────┐ │
                       │ │   Popup Assistant Overlay │ │
                       │ │   Settings Panel Modal    │ │
                       │ └───────────────────────────┘ │
                       └──────────────┬────────────────┘
                                      │ (Tauri Commands)
                                      ▼
                       ┌───────────────────────────────┐
                       │       Tauri Core (Rust)       │
                       │ ┌───────────────────────────┐ │
                       │ │   Command Handlers        │ │
                       │ │   SQLite Memory DB        │ │
                       │ │   Clipboard Watcher Loop  │ │
                       │ │   AI Route Manager        │ │
                       │ └───────────────────────────┘ │
                       └──────┬─────────────────┬──────┘
       (screencapture CLI)    │                 │ (Vision OCR)
                              ▼                 ▼
                       ┌──────────────┐  ┌──────────────┐
                       │    macOS     │  │  Swift CLI   │
                       │ Screenshot   │  │   Sidecar    │
                       └──────────────┘  └──────────────┘
```

- **Frontend**: React 19, TypeScript 5, Tailwind CSS v4, Framer Motion (animations), and Zustand (state).
- **Backend (Rust)**: Tauri 2 handles native system APIs, database persistence (SQLite via `rusqlite`), and background clipboard loops.
- **Sidecar (Swift)**: A lightweight command-line utility compiled natively on macOS to communicate with Apple's Vision API for 100% offline, accurate text recognition.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **macOS** (13.0 or newer)
- **Xcode Command Line Tools** (`xcode-select --install`)
- **Node.js** (v18 or newer) & **npm**
- **Rust** & **Cargo** (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)

---

### Installation & Build

#### 1. Clone the repository
```bash
git clone https://github.com/yourusername/GhostLens.git
cd GhostLens
```

#### 2. Install Frontend Dependencies
```bash
npm install
```

#### 3. Compile the Swift OCR Sidecar
Compile the executable and move it to Tauri's binary directory with your system's target triple:
```bash
cd sidecar
swift build -c release
cd ..
mkdir -p src-tauri/binaries
cp sidecar/.build/arm64-apple-macosx/release/ocr-cli src-tauri/binaries/ocr-cli-aarch64-apple-darwin
chmod +x src-tauri/binaries/ocr-cli-aarch64-apple-darwin
```

#### 4. Run the Application in Dev Mode
This launches the hot-reloading dev server for the frontend and runs the Tauri application:
```bash
npm run tauri dev
```

#### 5. Build the Production Bundle
To create a production-ready `.app` or `.dmg` bundle:
```bash
npm run tauri build
```

---

## ⌨️ Shortcuts & Hotkeys

Configure these hotkeys inside the Settings Panel or trigger them globally:

| Shortcut | Action | Description |
| --- | --- | --- |
| `⌘ + ⇧ + G` | **Open Assistant** | Show/hide the floating AI Popup Assistant window. |
| `⌘ + ⇧ + S` | **Screenshot & Analyze** | Opens selection tool. Select a region to OCR and analyze with AI. |
| `⌘ + ⇧ + C` | **Analyze Clipboard** | Feed current system clipboard contents directly to the AI Assistant. |
| `⌘ + ⇧ + P` | **Settings** | Open the settings panel to configure keys, model, opacity, and shortcuts. |
| `Triple Ctrl` | **Quick Trigger** | Quickly toggle the floating assistant wherever you are on screen. |

---

## 🔒 Security & Data Privacy

- **No Intermediate Servers**: Your queries are sent directly to the official APIs (OpenAI, Gemini, Anthropic, or local Ollama). GhostLens does not route data through any third-party backend.
- **Local SQLite Storage**: Your history, settings, and clipboard cached items are saved on your local machine in `~/Library/Application Support/com.ghostlens.app/ghostlens.db`.
- Check [SECURITY.md](SECURITY.md) for detailed reporting procedures.

---

## 📄 License

This project is proprietary software. All rights are reserved. You may not copy, modify, distribute, or run this software for commercial purposes without explicit permission. See [LICENSE](LICENSE) for details.
