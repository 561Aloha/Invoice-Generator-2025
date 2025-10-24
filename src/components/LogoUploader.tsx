
import React, { useRef } from 'react';

interface LogoUploaderProps {
  logoUrl: string | null;
  onLogoChange: (url: string) => void;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({ logoUrl, onLogoChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onLogoChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center cursor-pointer group" onClick={handleLogoClick}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      {logoUrl ? (
        <img src={logoUrl} alt="Company Logo" className="max-w-full max-h-28 object-contain" />
      ) : (
        <div className="w-48 h-28 bg-gray-200 flex flex-col items-center justify-center text-gray-500 rounded-lg border-2 border-dashed border-gray-300 group-hover:bg-gray-300 group-hover:border-gray-400">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span>Upload Logo</span>
        </div>
      )}
    </div>
  );
};

export default LogoUploader;
