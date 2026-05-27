import { useState } from 'react';
import './ContextBar.css';

interface ContextBarProps {
  text: string;
}

export function ContextBar({ text }: ContextBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const truncated = text.length > 120;
  const displayText = truncated && !isExpanded ? text.slice(0, 120) + '...' : text;

  return (
    <div className="context-bar">
      <div className="context-bar-label">
        <span className="context-bar-icon">📋</span>
        <span>Captured Text</span>
        <span className="context-bar-count">{text.length} chars</span>
      </div>
      <div className={`context-bar-text selectable ${isExpanded ? 'expanded' : ''}`}>
        {displayText}
      </div>
      {truncated && (
        <button
          className="context-bar-toggle no-drag"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}
