import React, { useState } from 'react';

interface EditableFieldProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  multiline?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({ value, onChange, className, multiline = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  const handleBlur = () => {
    setIsEditing(false);
    onChange(currentValue);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !multiline) {
      handleBlur();
    }
  };

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`editable-input editable-textarea ${className || ''}`}
          autoFocus
          rows={5}
        />
      );
    }
    return (
      <input
        type="text"
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`editable-input ${className || ''}`}
        autoFocus
      />
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)} 
      className={`editable-display ${className || ''}`}
    >
      {value || (multiline ? 'Click to edit...' : '...')}
    </div>
  );
};

export default EditableField;