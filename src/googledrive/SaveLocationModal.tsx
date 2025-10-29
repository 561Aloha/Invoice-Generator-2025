import React from 'react';
import './SaveLocationModal.css';

interface SaveLocationModalProps {
  open: boolean;
  onClose: () => void;
  onSaveLocal: () => void;
  onSaveToGoogleDrive: (shouldPickFolder?: boolean) => void; // ✅ Added parameter
  isGoogleDriveConnected: boolean;
  onConnectGoogleDrive: () => void;
}

const SaveLocationModal: React.FC<SaveLocationModalProps> = ({
  open,
  onClose,
  onSaveLocal,
  onSaveToGoogleDrive,
  isGoogleDriveConnected,
  onConnectGoogleDrive
}) => {
  if (!open) return null;

  const handleSaveLocal = () => {
    onSaveLocal();
    onClose();
  };

  const handleSaveToGoogleDrive = async () => {
    if (!isGoogleDriveConnected) {
      onConnectGoogleDrive();
    } else {
      const selectFolder = window.confirm(
        'Would you like to choose a specific folder?\n\n' +
        'Click OK to browse folders, or Cancel to save to default "Invoice Proposals" folder'
      );
      
      onSaveToGoogleDrive(selectFolder); // ✅ Pass the boolean
      onClose();
    }
  };

  return (
    <div className="save-modal-overlay" onClick={onClose}>
      <div className="save-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="save-modal-close" onClick={onClose}>✕</button>
        
        <div className="save-modal-header">
          <h2>Where would you like to save your PDF?</h2>
          <p>Choose how you'd like to save your invoice</p>
        </div>

        <div className="save-modal-options">
          {/* Local Save Option */}
          <button 
            className="save-option-btn local"
            onClick={handleSaveLocal}
          >
            <div className="save-option-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div className="save-option-text">
              <h3>Save to Computer</h3>
              <p>Download PDF to your local device</p>
            </div>
          </button>

          {/* Google Drive Option */}
          <button 
            className={`save-option-btn drive ${!isGoogleDriveConnected ? 'disconnected' : ''}`}
            onClick={handleSaveToGoogleDrive}
          >
            <div className="save-option-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.01 1.485c-.205 0-.407.052-.588.152L3.37 6.56c-.36.205-.582.588-.582 1.002v8.876c0 .414.222.797.582 1.002l8.052 4.923c.181.1.383.152.588.152.205 0 .407-.052.588-.152l8.052-4.923c.36-.205.582-.588.582-1.002V7.562c0-.414-.222-.797-.582-1.002L12.598 1.637c-.181-.1-.383-.152-.588-.152z"/>
                <path fill="#fff" d="M8.305 9.123l-1.72 2.983L9.569 15.9h3.44l-1.983-3.794-2.721-2.983z"/>
                <path fill="#fff" d="M15.695 9.123l-1.72 2.983 2.984 3.794h-3.44l1.983-3.794 2.721-2.983z"/>
                <path fill="#fff" d="M12.01 6.14L9.289 9.123h5.442z"/>
              </svg>
            </div>
            <div className="save-option-text">
              <h3>Save to Google Drive</h3>
              {isGoogleDriveConnected ? (
                <p>Upload PDF to your Google Drive</p>
              ) : (
                <p className="connect-prompt">Click to connect your account</p>
              )}
            </div>
            {!isGoogleDriveConnected && (
              <div className="connect-badge">Connect First</div>
            )}
          </button>
          
          {/* Save to Both Option */}
          {isGoogleDriveConnected && (
            <button 
              className="save-option-btn both"
              onClick={() => {
                onSaveLocal();
                setTimeout(() => {
                  onSaveToGoogleDrive(false); // ✅ Use default folder for "Save to Both"
                }, 500);
                onClose();
              }}
            >
              <div className="save-option-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </div>
              <div className="save-option-text">
                <h3>Save to Both</h3>
                <p>Save locally and upload to Google Drive</p>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaveLocationModal;