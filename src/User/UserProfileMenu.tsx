import React, { useState, useEffect, useRef } from 'react';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';


interface UserProfileMenuProps {
  currentUser: any;
  onSignOut: () => void;
  onSignInClick: () => void;
}

const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ 
  currentUser, 
  onSignOut, 
  onSignInClick 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  if (!currentUser) {
    return (
      <AccountCircleIcon 
        onClick={onSignInClick}
        style={{ 
          fontSize: 40, 
          cursor: 'pointer',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      />
    );
  }

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <div onClick={() => setShowMenu(!showMenu)} style={{ cursor: 'pointer' }}>
        {currentUser.photoURL ? (
          <img 
            src={currentUser.photoURL} 
            alt="Profile"
            style={{ 
              width: 48, 
              height: 48, 
              borderRadius: '50%',
              border: '2px solid #2563eb'
            }}
          />
        ) : (
          <AccountCircleIcon style={{ fontSize: 40, color: '#2563eb' }} />
        )}
      </div>

      {showMenu && (
        <div style={{
          position: 'absolute',
          top: '50px',
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          padding: '12px',
          minWidth: '200px',
          zIndex: 1000
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', marginBottom: '8px' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
              {currentUser.displayName || currentUser.email}
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
              {currentUser.email}
            </p>
          </div>
          <button 
            onClick={() => {
              onSignOut();
              setShowMenu(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151',
              borderRadius: '4px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <LogoutIcon style={{ fontSize: 18 }} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileMenu;