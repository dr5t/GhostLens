import { useEffect } from 'react';
import { PopupAssistant } from './components/popup/PopupAssistant';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { usePopupStore, useSettingsStore, useClipboardStore } from './stores/appStore';
import logo from './assets/logo.png';
import {
  onShortcutTrigger,
  onGestureTrigger,
  getSettings,
  captureInteractive,
  performOCR,
  getClipboardContent,
  onClipboardChange,
} from './services/tauriService';
import './App.css';

function App() {
  const { showPopup, isVisible, setCapturedImage } = usePopupStore();
  const { setSettings, openSettings, isSettingsOpen } = useSettingsStore();

  // Load settings on startup
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSettings();
        setSettings(settings);
      } catch {
        // Use defaults on first run
        console.log('Using default settings');
      }
    };
    loadSettings();
  }, [setSettings]);

  // Listen for shortcut & gesture triggers from Rust backend
  useEffect(() => {
    let unlistenShortcut: (() => void) | null = null;
    let unlistenGesture: (() => void) | null = null;

    const setup = async () => {
      unlistenShortcut = await onShortcutTrigger(async (shortcut) => {
        const centerPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        switch (shortcut) {
          case 'open-popup':
            showPopup('', centerPos);
            break;
          case 'open-settings':
            openSettings();
            break;
          case 'screenshot-analyze':
            try {
              const imagePath = await captureInteractive();
              const ocrResult = await performOCR(imagePath);
              showPopup(ocrResult.text, centerPos);
              setCapturedImage(imagePath);
            } catch (err) {
              console.error('Screenshot capture or OCR failed:', err);
            }
            break;
          case 'analyze-clipboard':
            try {
              const clipboard = await getClipboardContent();
              if (clipboard.content) {
                showPopup(clipboard.content, centerPos);
              }
            } catch (err) {
              console.error('Failed to read clipboard:', err);
            }
            break;
        }
      });

      unlistenGesture = await onGestureTrigger((gesture) => {
        if (gesture === 'triple-ctrl' || gesture === 'mouse-wiggle') {
          showPopup('', { x: window.innerWidth / 2, y: window.innerHeight / 2 });
        }
      });
    };

    setup();
    return () => {
      if (unlistenShortcut) unlistenShortcut();
      if (unlistenGesture) unlistenGesture();
    };
  }, [showPopup, openSettings]);

  // Listen for clipboard changes
  useEffect(() => {
    let unlistenClipboard: (() => void) | null = null;

    const setupClipboard = async () => {
      unlistenClipboard = await onClipboardChange((data) => {
        const { setCurrentContent, addToHistory } = useClipboardStore.getState();
        
        setCurrentContent(data.content, data.contentType);
        
        addToHistory({
          id: crypto.randomUUID(),
          content: data.content,
          contentType: data.contentType as any,
          timestamp: Date.now(),
        });
      });
    };

    setupClipboard();
    return () => {
      if (unlistenClipboard) unlistenClipboard();
    };
  }, []);

  return (
    <div className="app-root">
      {/* Background with ambient gradient */}
      <div className="app-background">
        <div className="ambient-orb orb-1" />
        <div className="ambient-orb orb-2" />
        <div className="ambient-orb orb-3" />
      </div>

      {/* Home Screen */}
      {!isVisible && !isSettingsOpen && (
        <div className="home-screen">
          <div className="home-content">
            <div className="home-logo">
              <img src={logo} alt="GhostLens Logo" className="home-logo-img" />
              <h1 className="home-title gradient-text">GhostLens</h1>
              <p className="home-subtitle">AI Screen Context Assistant</p>
            </div>

            <div className="home-shortcuts">
              <div className="shortcut-item">
                <kbd>⌘⇧G</kbd>
                <span>Open Assistant</span>
              </div>
              <div className="shortcut-item">
                <kbd>⌘⇧S</kbd>
                <span>Screenshot & Analyze</span>
              </div>
              <div className="shortcut-item">
                <kbd>⌘⇧C</kbd>
                <span>Analyze Clipboard</span>
              </div>
              <div className="shortcut-item">
                <kbd>Triple Ctrl</kbd>
                <span>Quick Trigger</span>
              </div>
            </div>

            <div className="home-actions">
              <button
                className="home-btn primary"
                onClick={() => showPopup('Hello! I am GhostLens, your AI screen assistant. Select some text on screen or take a screenshot to get started.')}
              >
                <span>✨</span> Try It Now
              </button>
              <button className="home-btn secondary" onClick={openSettings}>
                <span>⚙️</span> Settings
              </button>
            </div>

            <div className="home-status">
              <div className="status-dot active" />
              <span>Ready — Listening for shortcuts</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Popup */}
      <PopupAssistant />

      {/* Settings Panel */}
      <SettingsPanel />
    </div>
  );
}

export default App;
