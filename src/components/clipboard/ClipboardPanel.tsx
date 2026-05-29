import { useState, useMemo } from 'react';
import { useClipboardStore, usePopupStore } from '../../stores/appStore';
import './ClipboardPanel.css';

export function ClipboardPanel() {
  const { history, clearHistory } = useClipboardStore();
  const { showPopup } = usePopupStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return history;
    return history.filter((entry) =>
      entry.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [history, searchTerm]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  const handleExplain = (text: string) => {
    // Fill the captured text and trigger actions view
    showPopup(text);
  };

  return (
    <div className="clipboard-panel">
      <div className="clipboard-search-header">
        <input
          type="text"
          className="clipboard-search-input field-input"
          placeholder="Search clipboard history..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search clipboard history"
        />
        {history.length > 0 && (
          <button className="clipboard-clear-btn" onClick={clearHistory} title="Clear all history">
            Clear All
          </button>
        )}
      </div>

      <div className="clipboard-list-wrapper scrollable">
        {filteredHistory.length === 0 ? (
          <div className="clipboard-empty-state">
            <span className="empty-icon">📋</span>
            <span className="empty-text">
              {searchTerm ? 'No matches found' : 'Clipboard history is empty'}
            </span>
          </div>
        ) : (
          <div className="clipboard-list">
            {filteredHistory.map((entry) => (
              <div key={entry.id} className="clipboard-item glass">
                <div className="clipboard-item-header">
                  <span className={`type-badge badge-${entry.contentType}`}>
                    {entry.contentType.toUpperCase()}
                  </span>
                  <span className="clipboard-item-time">
                    {new Date(entry.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
                <div className="clipboard-item-body selectable">
                  <pre className="clipboard-item-content">{entry.content}</pre>
                </div>
                <div className="clipboard-item-footer">
                  <button
                    className="clipboard-item-action"
                    onClick={() => handleCopy(entry.content)}
                    title="Copy to clipboard"
                  >
                    📋 Copy
                  </button>
                  <button
                    className="clipboard-item-action primary"
                    onClick={() => handleExplain(entry.content)}
                    title="Send to AI Assistant"
                  >
                    ✨ AI Explain
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
