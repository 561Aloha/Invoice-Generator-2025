import React from 'react';
import HistoryIcon from '@mui/icons-material/History';
import UserProfileMenu from '../User/UserProfileMenu';

interface TopNavBarProps {
  currentUser: any;
  onHistoryClick: () => void;
  onSignOut: () => void;
  onSignInClick: () => void;
}

const TopNavBar: React.FC<TopNavBarProps> = ({ 
  currentUser, 
  onHistoryClick, 
  onSignOut, 
  onSignInClick 
}) => {
  return (
    <div style={{ 
      position: 'absolute', 
      top: 20, 
      right: 20, 
      display: 'flex', 
      gap: '15px', 
      alignItems: 'center' 
    }}>
      <HistoryIcon 
        onClick={onHistoryClick}
        style={{ 
          fontSize: 40, 
          color: '#2563eb', 
          cursor: 'pointer',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      />
      
      <UserProfileMenu 
        currentUser={currentUser}
        onSignOut={onSignOut}
        onSignInClick={onSignInClick}
      />
    </div>
  );
};

export default TopNavBar;