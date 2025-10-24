import React from 'react';

const Logo: React.FC<{ width?: string; height?: string; className?: string }> = ({ 
  width = '200px', 
  height = '200px', 
  className = 'object-contain' 
}) => {
  return (
    <img 
      src="/logo2.jpeg" 
      alt="Company Logo" 
      style={{ width, height }} 
      className={className} 
    />
  );
};

export default Logo;