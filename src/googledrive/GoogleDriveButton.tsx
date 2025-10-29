import React, { useState, useEffect } from 'react';
import { GoogleDriveService } from './googledrive';
import GoogleDriveIcon from '@mui/icons-material/CloudQueue';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface GoogleDriveButtonProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

const GoogleDriveButton: React.FC<GoogleDriveButtonProps> = ({ onConnectionChange }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already connected on mount
    const checkConnection = async () => {
      try {
        await GoogleDriveService.initialize();
        const connected = GoogleDriveService.isSignedIn();
        setIsConnected(connected);
        onConnectionChange?.(connected);
      } catch (error) {
        console.error('Failed to initialize Google Drive:', error);
      }
    };
    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const success = await GoogleDriveService.signIn();
      setIsConnected(success);
      onConnectionChange?.(success);
      if (success) {
        alert('✅ Connected to Google Drive with new permissions!');
      } else {
        alert('❌ Failed to connect to Google Drive');
      }
    } catch (error) {
      console.error('Google Drive connection error:', error);
      alert('❌ Error connecting to Google Drive');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await GoogleDriveService.signOut();
    setIsConnected(false);
    onConnectionChange?.(false);
    alert('✅ Disconnected from Google Drive');
  };

  return (
    <button
      onClick={isConnected ? handleDisconnect : handleConnect}
      disabled={isLoading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 8px',
        backgroundColor: isConnected ? '#10b981' : '#ffffff',
        color: isConnected ? '#ffffff' : '#374151',
        border: isConnected ? 'none' : '2px solid #e5e7eb',
        borderRadius: '8px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        fontWeight: '600',
        fontSize: '14px',
        transition: 'all 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
      onMouseEnter={(e) => {
        if (!isLoading) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isLoading) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        }
      }}
    >
      {isConnected ? (
        <>
          <CheckCircleIcon style={{ fontSize: 20 }} />
          Connected to Drive
        </>
      ) : (
        <>
          <GoogleDriveIcon style={{ fontSize: 20 }} />
          {isLoading ? 'Connecting...' : 'Connect Google Drive'}
        </>
      )}
    </button>
  );
};

export default GoogleDriveButton;