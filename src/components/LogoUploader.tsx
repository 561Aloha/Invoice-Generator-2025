import { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import AttachFileIcon from '@mui/icons-material/AttachFile';

interface LogoUploaderProps {
  userId: string;
  currentLogoUrl?: string | null;
  onLogoUploaded: (url: string) => void;
}

const LogoUploader = ({ userId, currentLogoUrl, onLogoUploaded }: LogoUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl || '');
  const [error, setError] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;
  const MAX_SIZE = 200;
  const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject('Canvas context not available');
            return;
          }

          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height = (height * MAX_SIZE) / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = (width * MAX_SIZE) / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.9);
          const base64Data = resizedBase64.split(',')[1];
          resolve(base64Data);
        };

        img.onerror = () => {
          reject('Failed to load image');
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = () => {
        reject('Failed to read file');
      };

      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Invalid file type. Please upload JPG, PNG, GIF, or WEBP images.');
        setUploading(false);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('File too large. Please upload an image under 5MB.');
        setUploading(false);
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = async () => {
        URL.revokeObjectURL(objectUrl);

        // CHECK BUT DON'T RETURN - let upload continue
        const isSmallImage = img.width < 100 || img.height < 100;
        if (isSmallImage) {
          // Show warning temporarily but don't block upload
          setError('Image is quite small. Uploading anyway...');
        }

        try {
          const base64Image = await resizeImage(file);
          const formData = new FormData();
          formData.append('image', base64Image);

          const response = await fetch(
            `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
            {
              method: 'POST',
              body: formData,
            }
          );

          const data = await response.json();

          if (data.success) {
            const uploadedUrl = data.data.url;
            setLogoUrl(uploadedUrl);

            await setDoc(doc(db, 'users', userId), {
              logoUrl: uploadedUrl,
            }, { merge: true });

            onLogoUploaded(uploadedUrl);
            
            // ✅ ALWAYS clear error on success, even if image was small
            setError('');
            alert('✅ Logo uploaded successfully!');
          } else {
            setError('Upload failed. Please try again.');
          }
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          setError('Upload error. Please try again.');
        } finally {
          setUploading(false);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setError('Failed to load image. Please try a different file.');
        setUploading(false);
      };

      img.src = objectUrl;

    } catch (error) {
      console.error('Error processing image:', error);
      setError('Error processing image. Please try again.');
      setUploading(false);
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      {/* Upload Area */}
      <label
        htmlFor="logo-upload"
        style={{
          width: '200px',
          height: '200px',
          border: logoUrl && !isHovered ? 'none' : '2px dashed #d1d5db',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          backgroundColor: logoUrl ? 'transparent' : '#f9fafb',
          transition: 'all 0.2s',
          overflow: 'hidden',
          position: 'relative',
        }}
        onMouseEnter={() => {
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
      >
        {logoUrl ? (
          <>
            <img
              src={logoUrl}
              alt="Logo"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
            {/* Hover overlay */}
            {isHovered && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '8px',
                color: 'white',
              }}>
                <AttachFileIcon style={{ fontSize: 40 }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>
                  Change Logo
                </p>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            <AttachFileIcon style={{ fontSize: 48, marginBottom: '8px' }} />
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>
              {uploading ? 'Uploading...' : 'Upload Logo'}
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
              200x200 recommended
            </p>
          </div>
        )}
      </label>

      <input
        id="logo-upload"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleLogoUpload}
        disabled={uploading}
        style={{ display: 'none' }}
      />

      {/* Status Messages */}
      {uploading && (
        <p style={{ margin: 0, fontSize: '14px', color: '#2563eb' }}>
          Processing and uploading...
        </p>
      )}

      {error && (
        <p style={{ 
          margin: 0, 
          fontSize: '13px', 
          color: error.includes('small') ? '#f59e0b' : '#ef4444',
          textAlign: 'center',
          maxWidth: '250px'
        }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default LogoUploader;