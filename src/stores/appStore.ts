import { create } from 'zustand';
import type {
  AIProvider,
  AIAction,
  PopupView,
  PopupPosition,
  ClipboardEntry,
  AppSettings,
  AIProviderConfig,
  DEFAULT_MODELS,
} from '../types';

// === Popup Store ===
interface PopupState {
  isVisible: boolean;
  view: PopupView;
  position: PopupPosition;
  capturedText: string;
  capturedImagePath: string | null;
  currentAction: AIAction | null;
  responseText: string;
  isStreaming: boolean;
  error: string | null;

  // Actions
  showPopup: (text: string, position?: PopupPosition) => void;
  hidePopup: () => void;
  setView: (view: PopupView) => void;
  setPosition: (position: PopupPosition) => void;
  setCapturedText: (text: string) => void;
  setCapturedImage: (path: string | null) => void;
  setAction: (action: AIAction | null) => void;
  setResponseText: (text: string) => void;
  appendResponseText: (chunk: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const usePopupStore = create<PopupState>((set) => ({
  isVisible: false,
  view: 'actions',
  position: { x: 100, y: 100 },
  capturedText: '',
  capturedImagePath: null,
  currentAction: null,
  responseText: '',
  isStreaming: false,
  error: null,

  showPopup: (text, position) =>
    set({
      isVisible: true,
      capturedText: text,
      view: 'actions',
      responseText: '',
      error: null,
      currentAction: null,
      ...(position && { position }),
    }),

  hidePopup: () =>
    set({
      isVisible: false,
      view: 'actions',
      capturedText: '',
      capturedImagePath: null,
      responseText: '',
      isStreaming: false,
      error: null,
      currentAction: null,
    }),

  setView: (view) => set({ view }),
  setPosition: (position) => set({ position }),
  setCapturedText: (capturedText) => set({ capturedText }),
  setCapturedImage: (capturedImagePath) => set({ capturedImagePath }),
  setAction: (currentAction) => set({ currentAction }),
  setResponseText: (responseText) => set({ responseText }),
  appendResponseText: (chunk) =>
    set((state) => ({ responseText: state.responseText + chunk })),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      view: 'actions',
      capturedText: '',
      capturedImagePath: null,
      responseText: '',
      isStreaming: false,
      error: null,
      currentAction: null,
    }),
}));

// === Settings Store ===
interface SettingsState {
  settings: AppSettings;
  isLoaded: boolean;
  isSettingsOpen: boolean;

  setSettings: (settings: AppSettings) => void;
  updateProvider: (provider: AIProvider, config: Partial<AIProviderConfig>) => void;
  setDefaultProvider: (provider: AIProvider) => void;
  setIsLoaded: (loaded: boolean) => void;
  toggleSettings: () => void;
  openSettings: () => void;
  closeSettings: () => void;
}

const defaultSettings: AppSettings = {
  providers: [
    { provider: 'gemini', apiKey: '', model: 'gemini-2.0-flash', enabled: true },
    { provider: 'openai', apiKey: '', model: 'gpt-4o', enabled: false },
    { provider: 'claude', apiKey: '', model: 'claude-sonnet-4-20250514', enabled: false },
    { provider: 'ollama', apiKey: '', model: 'llama3.1', baseUrl: 'http://localhost:11434', enabled: false },
  ],
  defaultProvider: 'gemini',
  shortcuts: {
    openPopup: 'CommandOrControl+Shift+G',
    screenshotAnalyze: 'CommandOrControl+Shift+S',
    analyzeClipboard: 'CommandOrControl+Shift+C',
    commandPalette: 'CommandOrControl+Shift+P',
  },
  gesturesEnabled: true,
  tripleCtrlEnabled: true,
  mouseWiggleEnabled: false,
  gestureSensitivity: 50,
  popupOpacity: 95,
  popupWidth: 480,
  popupHeight: 600,
  launchAtStartup: false,
  showInDock: true,
  showTrayIcon: true,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  isLoaded: false,
  isSettingsOpen: false,

  setSettings: (settings) => set({ settings, isLoaded: true }),
  updateProvider: (provider, config) =>
    set((state) => ({
      settings: {
        ...state.settings,
        providers: state.settings.providers.map((p) =>
          p.provider === provider ? { ...p, ...config } : p
        ),
      },
    })),
  setDefaultProvider: (provider) =>
    set((state) => ({
      settings: { ...state.settings, defaultProvider: provider },
    })),
  setIsLoaded: (isLoaded) => set({ isLoaded }),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
}));

// === Clipboard Store ===
interface ClipboardState {
  currentContent: string;
  currentType: string;
  history: ClipboardEntry[];
  isMonitoring: boolean;

  setCurrentContent: (content: string, type: string) => void;
  addToHistory: (entry: ClipboardEntry) => void;
  clearHistory: () => void;
  setIsMonitoring: (monitoring: boolean) => void;
}

export const useClipboardStore = create<ClipboardState>((set) => ({
  currentContent: '',
  currentType: 'text',
  history: [],
  isMonitoring: false,

  setCurrentContent: (content, type) => set({ currentContent: content, currentType: type }),
  addToHistory: (entry) =>
    set((state) => ({
      history: [entry, ...state.history].slice(0, 100),
    })),
  clearHistory: () => set({ history: [] }),
  setIsMonitoring: (isMonitoring) => set({ isMonitoring }),
}));

// === Capture Store ===
interface CaptureState {
  isCapturing: boolean;
  selectionRegion: { x: number; y: number; width: number; height: number } | null;
  lastCapturePath: string | null;

  setIsCapturing: (capturing: boolean) => void;
  setSelectionRegion: (region: { x: number; y: number; width: number; height: number } | null) => void;
  setLastCapturePath: (path: string | null) => void;
}

export const useCaptureStore = create<CaptureState>((set) => ({
  isCapturing: false,
  selectionRegion: null,
  lastCapturePath: null,

  setIsCapturing: (isCapturing) => set({ isCapturing }),
  setSelectionRegion: (selectionRegion) => set({ selectionRegion }),
  setLastCapturePath: (lastCapturePath) => set({ lastCapturePath }),
}));
