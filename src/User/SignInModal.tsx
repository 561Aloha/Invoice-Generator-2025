import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import React, { useState, useEffect } from 'react';
import GoogleIcon from '@mui/icons-material/Google';
import '../css/auth.css'; // Make sure you have the CSS file

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
}

const SignInModal: React.FC<SignInModalProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const auth = getAuth();

  useEffect(() => {
    handleEmailLinkSignIn();
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const actionCodeSettings = {
    url: window.location.origin, // Use current origin
    handleCodeInApp: true,
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onClose();
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setMessage(error.message);
    }
  };

  const handlePasswordlessSignIn = async () => {
    setMessage('');
    
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setMessage('✅ Check your email! We sent you a sign-in link.');
    } catch (error: any) {
      console.error('Error sending email:', error);
      setMessage(error.message);
    }
  };

  const handleEmailLinkSignIn = async () => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }

      try {
        await signInWithEmailLink(auth, email!, window.location.href);
        window.localStorage.removeItem('emailForSignIn');
        onClose();
      } catch (error: any) {
        console.error('Error signing in with email link:', error);
        setMessage(error.message);
      }
    }
  };

  if (!open) return null;

  return (
    <div className="zeno-modal-backdrop" onClick={onClose}>
      <div className="zeno-modal" onClick={(e) => e.stopPropagation()}>
        <div className="zeno-header">
          <h1 className="zeno-logo">Invoia</h1>
          <p className="zeno-tagline">
            AI-powered invoice generation made simple
          </p>
        </div>

        <button 
          className="zeno-btn white" 
          onClick={handleGoogleSignIn}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}
        >
          <GoogleIcon style={{ fontSize: 20 }} />
          Sign in with Google
        </button>

        <div className="zeno-divider">OR</div>

        <input
          type="email"
          placeholder="Enter your email"
          className="zeno-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        <button 
          className="zeno-btn primary" 
          onClick={handlePasswordlessSignIn}
        >
          Send Sign-In Link
        </button>

        {message && (
          <div className={message.includes('✅') ? 'zeno-success' : 'zeno-error'}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignInModal;