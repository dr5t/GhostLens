// === AI Provider Types ===
export type AIProvider = 'openai' | 'gemini' | 'claude' | 'ollama';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
  enabled: boolean;
}

export interface AIRequest {
  provider: AIProvider;
  model: string;
  prompt: string;
  context?: string;
  imageBase64?: string;
  stream?: boolean;
}

export interface AIResponse {
  text: string;
  tokensUsed?: number;
  model: string;
  provider: AIProvider;
}

// === AI Action Types ===
export type AIAction =
  | 'explain'
  | 'summarize'
  | 'translate'
  | 'fix_grammar'
  | 'generate_notes'
  | 'search_web'
  | 'explain_code'
  | 'debug_error'
  | 'optimize_code'
  | 'convert_code'
  | 'rewrite'
  | 'simplify'
  | 'custom';

export interface AIActionConfig {
  id: AIAction;
  label: string;
  icon: string;
  description: string;
  systemPrompt: string;
  supportsImage?: boolean;
}

// === OCR Types ===
export interface OCRResult {
  text: string;
  blocks: OCRBlock[];
  confidence: number;
  language?: string;
  codeLanguage?: string;
}

export interface OCRBlock {
  text: string;
  boundingBox: BoundingBox;
  confidence: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// === Screen Capture Types ===
export interface CaptureRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScreenCaptureResult {
  imagePath: string;
  width: number;
  height: number;
}

// === Clipboard Types ===
export type ClipboardContentType = 'code' | 'url' | 'text' | 'json' | 'unknown';

export interface ClipboardEntry {
  id: string;
  content: string;
  contentType: ClipboardContentType;
  timestamp: number;
  language?: string;
}

// === Settings Types ===
export interface AppSettings {
  // AI Providers
  providers: AIProviderConfig[];
  defaultProvider: AIProvider;

  // Shortcuts
  shortcuts: ShortcutConfig;

  // Gestures
  gesturesEnabled: boolean;
  tripleCtrlEnabled: boolean;
  mouseWiggleEnabled: boolean;
  gestureSensitivity: number;

  // Appearance
  popupOpacity: number;
  popupWidth: number;
  popupHeight: number;
  
  // General
  launchAtStartup: boolean;
  showInDock: boolean;
  showTrayIcon: boolean;
}

export interface ShortcutConfig {
  openPopup: string;
  screenshotAnalyze: string;
  analyzeClipboard: string;
  commandPalette: string;
}

// === Popup State ===
export type PopupView = 'actions' | 'response' | 'settings' | 'clipboard' | 'loading';

export interface PopupPosition {
  x: number;
  y: number;
}

// === Streaming Event ===
export interface StreamChunk {
  text: string;
  done: boolean;
}

// === Default AI Models ===
export const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-4o',
  gemini: 'gemini-2.0-flash',
  claude: 'claude-sonnet-4-20250514',
  ollama: 'llama3.1',
};

// === AI Action Definitions ===
export const AI_ACTIONS: AIActionConfig[] = [
  {
    id: 'explain',
    label: 'Explain',
    icon: '💡',
    description: 'Explain this content in simple terms',
    systemPrompt: 'You are a helpful assistant. Explain the following content clearly and concisely. Use simple language and provide examples where helpful.',
  },
  {
    id: 'summarize',
    label: 'Summarize',
    icon: '📝',
    description: 'Create a concise summary',
    systemPrompt: 'Summarize the following content concisely. Highlight key points and main ideas. Keep it brief but comprehensive.',
  },
  {
    id: 'translate',
    label: 'Translate',
    icon: '🌐',
    description: 'Translate to another language',
    systemPrompt: 'Translate the following text to English. If the text is already in English, translate it to Spanish. Preserve the original meaning and tone.',
  },
  {
    id: 'fix_grammar',
    label: 'Fix Grammar',
    icon: '✏️',
    description: 'Fix grammar and spelling',
    systemPrompt: 'Fix any grammar, spelling, and punctuation errors in the following text. Maintain the original meaning and tone. Show the corrected version.',
  },
  {
    id: 'explain_code',
    label: 'Explain Code',
    icon: '🔍',
    description: 'Explain what this code does',
    systemPrompt: 'You are an expert programmer. Explain what the following code does step by step. Mention the programming language, key concepts used, and any potential issues.',
  },
  {
    id: 'debug_error',
    label: 'Debug',
    icon: '🐛',
    description: 'Debug this error message',
    systemPrompt: 'You are an expert debugger. Analyze the following error message or code issue. Explain what went wrong, why it happened, and provide concrete fixes with code examples.',
  },
  {
    id: 'optimize_code',
    label: 'Optimize',
    icon: '⚡',
    description: 'Optimize this code',
    systemPrompt: 'You are an expert programmer. Optimize the following code for better performance, readability, and best practices. Show the improved version with explanations.',
  },
  {
    id: 'generate_notes',
    label: 'Notes',
    icon: '📋',
    description: 'Generate study notes',
    systemPrompt: 'Generate well-organized study notes from the following content. Use bullet points, headers, and highlight key terms. Make it easy to review and memorize.',
  },
];
