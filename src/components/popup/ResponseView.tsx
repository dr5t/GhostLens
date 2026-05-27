import { useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AI_ACTIONS, type AIAction } from '../../types';
import './ResponseView.css';

interface ResponseViewProps {
  action: AIAction | null;
  responseText: string;
  isStreaming: boolean;
  error: string | null;
  onRetry: () => void;
}

export function ResponseView({
  action,
  responseText,
  isStreaming,
  error,
  onRetry,
}: ResponseViewProps) {
  const actionConfig = AI_ACTIONS.find((a) => a.id === action);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(responseText);
    } catch {
      // Fallback
    }
  }, [responseText]);

  if (error) {
    return (
      <div className="response-error">
        <div className="response-error-icon">⚠️</div>
        <div className="response-error-text">{error}</div>
        <button className="response-retry-btn" onClick={onRetry}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="response-view">
      {/* Action Header */}
      {actionConfig && (
        <div className="response-action-header">
          <span className="response-action-icon">{actionConfig.icon}</span>
          <span className="response-action-label">{actionConfig.label}</span>
          {isStreaming && <span className="response-streaming-dot" />}
        </div>
      )}

      {/* Response Content */}
      <div className="response-content selectable markdown-content">
        {responseText ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !match;
                return isInline ? (
                  <code className={className} {...props}>
                    {children}
                  </code>
                ) : (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-4)',
                      fontSize: 'var(--text-sm)',
                      margin: '0 0 var(--space-4) 0',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                );
              },
            }}
          >
            {responseText}
          </ReactMarkdown>
        ) : isStreaming ? (
          <div className="response-loading">
            <div className="response-loading-dots">
              <span />
              <span />
              <span />
            </div>
            <span className="response-loading-text">Thinking...</span>
          </div>
        ) : null}
        {isStreaming && responseText && <span className="response-cursor">▌</span>}
      </div>

      {/* Actions Bar */}
      {responseText && !isStreaming && (
        <motion.div
          className="response-actions"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button className="response-action-btn" onClick={handleCopy} title="Copy to clipboard">
            <span>📋</span> Copy
          </button>
          <button className="response-action-btn" onClick={onRetry} title="Regenerate response">
            <span>🔄</span> Retry
          </button>
        </motion.div>
      )}
    </div>
  );
}
