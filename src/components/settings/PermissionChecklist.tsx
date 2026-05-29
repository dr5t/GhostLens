import { useEffect, useState, useRef } from 'react';
import {
  checkAccessibilityPermission,
  openAccessibilitySettings,
  checkScreenRecordingPermission,
  requestScreenRecordingPermission,
  startGestureRecognition,
} from '../../services/tauriService';
import './PermissionChecklist.css';

interface PermissionChecklistProps {
  onAllPermissionsGranted?: () => void;
  showContinueButton?: boolean;
  onContinue?: () => void;
}

export function PermissionChecklist({
  onAllPermissionsGranted,
  showContinueButton = false,
  onContinue,
}: PermissionChecklistProps) {
  const [hasAccessibility, setHasAccessibility] = useState<boolean | null>(null);
  const [hasScreenRecording, setHasScreenRecording] = useState<boolean | null>(null);
  const accessibilityRef = useRef<boolean | null>(null);

  const checkStatus = async () => {
    try {
      const acc = await checkAccessibilityPermission();
      const scr = await checkScreenRecordingPermission();

      // If accessibility was previously false/null and is now true, trigger gesture watcher activation
      if (acc && !accessibilityRef.current) {
        await startGestureRecognition();
      }

      accessibilityRef.current = acc;
      setHasAccessibility(acc);
      setHasScreenRecording(scr);

      if (acc && scr && onAllPermissionsGranted) {
        onAllPermissionsGranted();
      }
    } catch (err) {
      console.error('Failed to check permission status:', err);
    }
  };

  useEffect(() => {
    // Initial check
    checkStatus();

    // Check periodically in background
    const interval = setInterval(checkStatus, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleRequestScreenRecording = async () => {
    try {
      const granted = await requestScreenRecordingPermission();
      if (granted) {
        setHasScreenRecording(true);
      }
      checkStatus();
    } catch (err) {
      console.error('Failed to request screen recording permission:', err);
    }
  };

  return (
    <div className="permission-checklist glass">
      <div className="checklist-header">
        <h3 className="checklist-title">macOS System Permissions</h3>
        <p className="checklist-subtitle">
          GhostLens requires these security privileges to capture gestures and screens.
        </p>
      </div>

      <div className="checklist-items">
        {/* Accessibility Permission */}
        <div className={`checklist-item glass ${hasAccessibility ? 'granted' : 'pending'}`}>
          <div className="item-left">
            <span className="item-icon">🎹</span>
            <div className="item-details">
              <div className="item-name">Accessibility Access</div>
              <div className="item-desc">Required for triple-clicks and triple Control triggers</div>
            </div>
          </div>
          <div className="item-right">
            {hasAccessibility ? (
              <span className="status-badge granted">Active</span>
            ) : (
              <button className="permission-grant-btn" onClick={openAccessibilitySettings}>
                Grant Access
              </button>
            )}
          </div>
        </div>

        {/* Screen Recording Permission */}
        <div className={`checklist-item glass ${hasScreenRecording ? 'granted' : 'pending'}`}>
          <div className="item-left">
            <span className="item-icon">📸</span>
            <div className="item-details">
              <div className="item-name">Screen Recording</div>
              <div className="item-desc">Required to analyze screenshot selection contexts</div>
            </div>
          </div>
          <div className="item-right">
            {hasScreenRecording ? (
              <span className="status-badge granted">Active</span>
            ) : (
              <button className="permission-grant-btn" onClick={handleRequestScreenRecording}>
                Grant Access
              </button>
            )}
          </div>
        </div>
      </div>

      {showContinueButton && (
        <div className="checklist-footer">
          <button className="checklist-continue-btn" onClick={onContinue}>
            {hasAccessibility && hasScreenRecording ? 'Continue to App' : 'Skip / Setup Later'}
          </button>
        </div>
      )}
    </div>
  );
}
