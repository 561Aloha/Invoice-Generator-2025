import React from 'react';
import LogoUploader from './LogoUploader';

interface LogoProps {
  logoUrl: string | null;
  onLogoChange: (url: string | null) => void;
  userId: string | null;
}

const Logo: React.FC<LogoProps> = ({ logoUrl, onLogoChange, userId }) => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: '16px'
    }}>

      {/* Logo uploader - only show if user is signed in */}
      {userId && (
        <LogoUploader 
          userId={userId} 
          currentLogoUrl={logoUrl}
          onLogoUploaded={onLogoChange} 
        />
      )}
      
      {/* Show message if not signed in */}
      {!userId && !logoUrl && (
        <div style={{
          width: '200px',
          height: '200px',
          border: '2px dashed #d1d5db',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '20px',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          <p style={{ margin: 0 }}>
            Sign in to upload your company logo
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo;