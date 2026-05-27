import { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { usePopupStore, useSettingsStore } from '../../stores/appStore';
import { ActionGrid } from './ActionGrid.tsx';
import { ResponseView } from './ResponseView.tsx';
import { ContextBar } from './ContextBar.tsx';
import type { AIAction } from '../../types';
import { sendAIRequestStreaming, onStreamChunk } from '../../services/tauriService';
import './PopupAssistant.css';

export function PopupAssistant() {
  const {
    isVisible,
    view,
    capturedText,
    capturedImagePath,
    currentAction,
    responseText,
    isStreaming,
    error,
    setView,
    setAction,
    setResponseText,
    appendResponseText,
    setIsStreaming,
    setError,
    hidePopup,
  } = usePopupStore();

  const { settings } = useSettingsStore();
  const dragControls = useDragControls();
  const popupRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (view === 'response') {
          setView('actions');
          setResponseText('');
          setAction(null);
        } else {
          hidePopup();
        }
      }
    };

    if (isVisible) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, view, hidePopup, setView, setResponseText, setAction]);

  // Handle streaming events
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setupListener = async () => {
      unlisten = await onStreamChunk((chunk) => {
        if (chunk.done) {
          setIsStreaming(false);
        } else {
          appendResponseText(chunk.text);
        }
      });
    };

    setupListener();
    return () => {
      if (unlisten) unlisten();
    };
  }, [appendResponseText, setIsStreaming]);

  const handleAction = useCallback(
    async (action: AIAction) => {
      if (!capturedText && !capturedImagePath) return;

      setAction(action);
      setView('response');
      setResponseText('');
      setIsStreaming(true);
      setError(null);

      try {
        await sendAIRequestStreaming(
          action,
          capturedText,
          settings.defaultProvider,
          capturedImagePath || undefined
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setIsStreaming(false);
      }
    },
    [capturedText, capturedImagePath, settings.defaultProvider, setAction, setView, setResponseText, setIsStreaming, setError]
  );

  const handleBack = useCallback(() => {
    setView('actions');
    setResponseText('');
    setAction(null);
    setError(null);
  }, [setView, setResponseText, setAction, setError]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={popupRef}
          className="popup-container glass-heavy"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          drag
          dragControls={dragControls}
          dragMomentum={false}
          dragElastic={0}
          style={{
            width: settings.popupWidth,
            maxHeight: settings.popupHeight,
          }}
        >
          {/* Header / Drag Handle */}
          <div
            className="popup-header drag-handle"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <div className="popup-header-left">
              <div className="popup-logo">
                <span className="popup-logo-icon">👻</span>
                <span className="popup-logo-text gradient-text">GhostLens</span>
              </div>
            </div>
            <div className="popup-header-right no-drag">
              {view === 'response' && (
                <button
                  className="popup-nav-btn"
                  onClick={handleBack}
                  title="Back to actions"
                >
                  ←
                </button>
              )}
              <button
                className="popup-close-btn"
                onClick={hidePopup}
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Context Bar */}
          {capturedText && <ContextBar text={capturedText} />}

          {/* Content */}
          <div className="popup-content">
            <AnimatePresence mode="wait">
              {view === 'actions' && (
                <motion.div
                  key="actions"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ActionGrid onAction={handleAction} />
                </motion.div>
              )}

              {view === 'response' && (
                <motion.div
                  key="response"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ResponseView
                    action={currentAction}
                    responseText={responseText}
                    isStreaming={isStreaming}
                    error={error}
                    onRetry={() => currentAction && handleAction(currentAction)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="popup-footer">
            <span className="popup-footer-hint">
              {view === 'actions' ? 'Select an action • Esc to close' : 'Esc to go back'}
            </span>
            <span className="popup-footer-provider">
              {settings.defaultProvider.charAt(0).toUpperCase() + settings.defaultProvider.slice(1)}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
