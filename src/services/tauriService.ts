import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { AIAction, AIProvider, CaptureRegion, OCRResult, AppSettings, StreamChunk } from '../types';

// === Screen Capture Service ===
export async function captureFullScreen(): Promise<string> {
  return invoke<string>('capture_full_screen');
}

export async function captureRegion(region: CaptureRegion): Promise<string> {
  return invoke<string>('capture_region', { region });
}

// === OCR Service ===
export async function performOCR(imagePath: string): Promise<OCRResult> {
  return invoke<OCRResult>('perform_ocr', { imagePath });
}

// === AI Service ===
export async function sendAIRequest(
  action: AIAction,
  text: string,
  provider?: AIProvider,
  imageBase64?: string,
  customPrompt?: string
): Promise<string> {
  return invoke<string>('ai_process', {
    action,
    text,
    provider: provider || null,
    imageBase64: imageBase64 || null,
    customPrompt: customPrompt || null,
  });
}

export async function sendAIRequestStreaming(
  action: AIAction,
  text: string,
  provider?: AIProvider,
  imageBase64?: string,
  customPrompt?: string
): Promise<void> {
  return invoke<void>('ai_process_stream', {
    action,
    text,
    provider: provider || null,
    imageBase64: imageBase64 || null,
    customPrompt: customPrompt || null,
  });
}

// Listen for streaming AI response chunks
export async function onStreamChunk(
  callback: (chunk: StreamChunk) => void
): Promise<() => void> {
  const unlisten = await listen<StreamChunk>('ai-stream-chunk', (event) => {
    callback(event.payload);
  });
  return unlisten;
}

// === Clipboard Service ===
export async function getClipboardContent(): Promise<{ content: string; contentType: string }> {
  return invoke<{ content: string; contentType: string }>('get_clipboard_content');
}

export async function onClipboardChange(
  callback: (data: { content: string; contentType: string }) => void
): Promise<() => void> {
  const unlisten = await listen<{ content: string; contentType: string }>(
    'clipboard-changed',
    (event) => {
      callback(event.payload);
    }
  );
  return unlisten;
}

// === Settings Service ===
export async function getSettings(): Promise<AppSettings> {
  return invoke<AppSettings>('get_settings');
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  return invoke<void>('save_settings', { settings });
}

export async function validateApiKey(
  provider: AIProvider,
  apiKey: string
): Promise<boolean> {
  return invoke<boolean>('validate_api_key', { provider, apiKey });
}

// === System Events ===
export async function onGestureTrigger(
  callback: (gesture: string) => void
): Promise<() => void> {
  const unlisten = await listen<string>('gesture-triggered', (event) => {
    callback(event.payload);
  });
  return unlisten;
}

export async function onShortcutTrigger(
  callback: (shortcut: string) => void
): Promise<() => void> {
  const unlisten = await listen<string>('shortcut-triggered', (event) => {
    callback(event.payload);
  });
  return unlisten;
}

// === Utility ===
export async function readFileAsBase64(filePath: string): Promise<string> {
  return invoke<string>('read_file_base64', { filePath });
}
