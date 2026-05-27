import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../../stores/appStore';
import { saveSettings, validateApiKey } from '../../services/tauriService';
import type { AIProvider, AIProviderConfig } from '../../types';
import './SettingsPanel.css';

type SettingsTab = 'providers' | 'shortcuts' | 'appearance' | 'general';

const PROVIDER_INFO: Record<AIProvider, { name: string; icon: string; placeholder: string }> = {
  gemini: { name: 'Google Gemini', icon: '✨', placeholder: 'AIza...' },
  openai: { name: 'OpenAI', icon: '🤖', placeholder: 'sk-...' },
  claude: { name: 'Anthropic Claude', icon: '🧠', placeholder: 'sk-ant-...' },
  ollama: { name: 'Ollama (Local)', icon: '🦙', placeholder: 'No key needed' },
};

export function SettingsPanel() {
  const { settings, isSettingsOpen, closeSettings, updateProvider, setDefaultProvider, setSettings } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('providers');
  const [validating, setValidating] = useState<AIProvider | null>(null);

  const handleSave = async () => {
    try {
      await saveSettings(settings);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleValidateKey = async (provider: AIProvider, key: string) => {
    if (!key || provider === 'ollama') return;
    setValidating(provider);
    try {
      const valid = await validateApiKey(provider, key);
      if (valid) {
        updateProvider(provider, { enabled: true });
      }
    } catch {
      // Key validation failed
    }
    setValidating(null);
  };

  if (!isSettingsOpen) return null;

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'providers', label: 'AI Providers', icon: '🔑' },
    { id: 'shortcuts', label: 'Shortcuts', icon: '⌨️' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'general', label: 'General', icon: '⚙️' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="settings-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeSettings}
      >
        <motion.div
          className="settings-panel glass-heavy"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="settings-header">
            <h2 className="settings-title gradient-text">Settings</h2>
            <button className="settings-close-btn" onClick={closeSettings}>
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="settings-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="settings-content">
            {activeTab === 'providers' && (
              <div className="settings-section">
                <p className="settings-section-desc">
                  Configure your AI providers. Add API keys to enable each provider.
                </p>

                {settings.providers.map((providerConfig: AIProviderConfig) => {
                  const info = PROVIDER_INFO[providerConfig.provider];
                  return (
                    <div key={providerConfig.provider} className="provider-card glass">
                      <div className="provider-header">
                        <span className="provider-icon">{info.icon}</span>
                        <span className="provider-name">{info.name}</span>
                        {settings.defaultProvider === providerConfig.provider && (
                          <span className="provider-default-badge">Default</span>
                        )}
                        <button
                          className={`provider-toggle ${providerConfig.enabled ? 'enabled' : ''}`}
                          onClick={() =>
                            updateProvider(providerConfig.provider, {
                              enabled: !providerConfig.enabled,
                            })
                          }
                        >
                          {providerConfig.enabled ? 'ON' : 'OFF'}
                        </button>
                      </div>

                      <div className="provider-fields">
                        {providerConfig.provider !== 'ollama' ? (
                          <div className="field-group">
                            <label className="field-label">API Key</label>
                            <div className="field-input-wrapper">
                              <input
                                type="password"
                                className="field-input"
                                placeholder={info.placeholder}
                                value={providerConfig.apiKey}
                                onChange={(e) =>
                                  updateProvider(providerConfig.provider, {
                                    apiKey: e.target.value,
                                  })
                                }
                              />
                              <button
                                className="field-validate-btn"
                                onClick={() =>
                                  handleValidateKey(
                                    providerConfig.provider,
                                    providerConfig.apiKey
                                  )
                                }
                                disabled={
                                  validating === providerConfig.provider || !providerConfig.apiKey
                                }
                              >
                                {validating === providerConfig.provider ? '...' : '✓'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="field-group">
                            <label className="field-label">Server URL</label>
                            <input
                              type="text"
                              className="field-input"
                              placeholder="http://localhost:11434"
                              value={providerConfig.baseUrl || ''}
                              onChange={(e) =>
                                updateProvider(providerConfig.provider, {
                                  baseUrl: e.target.value,
                                })
                              }
                            />
                          </div>
                        )}

                        <div className="field-group">
                          <label className="field-label">Model</label>
                          <input
                            type="text"
                            className="field-input"
                            placeholder={providerConfig.model}
                            value={providerConfig.model}
                            onChange={(e) =>
                              updateProvider(providerConfig.provider, {
                                model: e.target.value,
                              })
                            }
                          />
                        </div>

                        {settings.defaultProvider !== providerConfig.provider && (
                          <button
                            className="set-default-btn"
                            onClick={() => setDefaultProvider(providerConfig.provider)}
                          >
                            Set as Default
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="settings-section">
                <p className="settings-section-desc">
                  Customize keyboard shortcuts for quick access.
                </p>
                {(Object.entries(settings.shortcuts) as [string, string][]).map(([key, value]) => (
                  <div key={key} className="shortcut-row">
                    <span className="shortcut-label">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                    </span>
                    <span className="shortcut-key">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="settings-section">
                <div className="appearance-option">
                  <label className="field-label">Popup Opacity</label>
                  <div className="slider-wrapper">
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={settings.popupOpacity}
                      onChange={(e) =>
                        setSettings({ ...settings, popupOpacity: Number(e.target.value) })
                      }
                      className="slider"
                    />
                    <span className="slider-value">{settings.popupOpacity}%</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div className="settings-section">
                <div className="toggle-option">
                  <span>Launch at startup</span>
                  <button
                    className={`provider-toggle ${settings.launchAtStartup ? 'enabled' : ''}`}
                    onClick={() =>
                      setSettings({ ...settings, launchAtStartup: !settings.launchAtStartup })
                    }
                  >
                    {settings.launchAtStartup ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div className="toggle-option">
                  <span>Show tray icon</span>
                  <button
                    className={`provider-toggle ${settings.showTrayIcon ? 'enabled' : ''}`}
                    onClick={() =>
                      setSettings({ ...settings, showTrayIcon: !settings.showTrayIcon })
                    }
                  >
                    {settings.showTrayIcon ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div className="toggle-option">
                  <span>Enable gestures</span>
                  <button
                    className={`provider-toggle ${settings.gesturesEnabled ? 'enabled' : ''}`}
                    onClick={() =>
                      setSettings({ ...settings, gesturesEnabled: !settings.gesturesEnabled })
                    }
                  >
                    {settings.gesturesEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="settings-footer">
            <button className="settings-save-btn" onClick={handleSave}>
              Save Settings
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
