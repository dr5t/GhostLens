import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AI_ACTIONS, type AIAction } from '../../types';
import './ActionGrid.css';

interface ActionGridProps {
  onAction: (action: AIAction) => void;
  capturedText: string;
}

// Utility to detect content type of captured text
function detectContentType(content: string): 'code' | 'url' | 'text' | 'json' {
  const trimmed = content.trim();

  // Check for URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return 'url';
  }

  // Check for JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // ignore
    }
  }

  // Check for code indicators
  const codeIndicators = [
    'fn ', 'pub ', 'let ', 'const ', 'var ', 'function ', 'class ',
    'import ', 'from ', 'def ', 'return ', 'if (', 'for (', 'while (',
    '=>', '->', 'pub fn', '#include', '#define', 'package ', 'interface ',
    'struct ', 'enum ', 'impl ', 'async ', 'await ', 'export ',
  ];

  const codeSymbols = [';', '(){', '};', '});', '==', '!=', '&&', '||'];

  const lines = trimmed.split('\n');
  let codeScore = 0;

  for (const line of lines) {
    const l = line.trim();
    for (const indicator of codeIndicators) {
      if (l.includes(indicator)) {
        codeScore += 2;
      }
    }
    for (const symbol of codeSymbols) {
      if (l.includes(symbol)) {
        codeScore += 1;
      }
    }
  }

  if (codeScore >= 3 || (lines.length > 1 && codeScore >= 2)) {
    return 'code';
  }

  return 'text';
}

export function ActionGrid({ onAction, capturedText }: ActionGridProps) {
  // Determine suggested action IDs based on content type
  const suggestedActionIds = useMemo(() => {
    if (!capturedText) return [];
    const type = detectContentType(capturedText);
    if (type === 'code') return ['explain_code', 'optimize_code', 'debug_error'];
    if (type === 'json') return ['explain_code', 'optimize_code'];
    if (type === 'url') return ['explain', 'summarize'];
    if (capturedText.trim().length > 15) return ['explain', 'summarize', 'fix_grammar'];
    return [];
  }, [capturedText]);

  const suggestedActions = useMemo(() => {
    return AI_ACTIONS.filter((a) => suggestedActionIds.includes(a.id));
  }, [suggestedActionIds]);

  const regularActions = useMemo(() => {
    return AI_ACTIONS.filter((a) => !suggestedActionIds.includes(a.id));
  }, [suggestedActionIds]);

  const renderButton = (action: typeof AI_ACTIONS[0], index: number, isSuggested = false) => (
    <motion.button
      key={action.id}
      className={`action-btn glass glass-hover ${isSuggested ? 'suggested-btn' : ''}`}
      onClick={() => onAction(action.id)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      title={action.description}
    >
      <span className="action-icon">{action.icon}</span>
      <span className="action-label">{action.label}</span>
      {isSuggested && <span className="suggestion-pill">Suggest</span>}
    </motion.button>
  );

  return (
    <div className="action-grid-container">
      {suggestedActions.length > 0 && (
        <div className="action-section suggested-section">
          <div className="action-section-title">✨ Suggested Actions</div>
          <div className="action-grid suggested">
            {suggestedActions.map((action, index) => renderButton(action, index, true))}
          </div>
        </div>
      )}

      <div className="action-section">
        {suggestedActions.length > 0 && (
          <div className="action-section-title">All Actions</div>
        )}
        <div className="action-grid">
          {regularActions.map((action, index) => renderButton(action, index, false))}
        </div>
      </div>
    </div>
  );
}
