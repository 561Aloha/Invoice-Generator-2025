import React, { useState, useEffect } from 'react';
import type { InvoiceData } from './types';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import './css/invoice.css';
import InvoiceProposal1 from './components/InvoiceProposal1';
import InvoiceProposal2 from './components/InvoiceProposal2';
import GoogleDriveButton from './googledrive/GoogleDriveButton';
import TopNavBar from './components/TopNavBar';
import SignInModal from './User/SignInModal';
import InvoiceHistory from './components/InvoiceHistory';
import type { InvoiceData2 } from './types2';  // ← ADD THIS LINE

interface SavedInvoice {
  id: string;
  data: InvoiceData | InvoiceData2;  // ← Union type to support both
  status: 'saved' | 'downloaded';
  templateType: 'type1' | 'type2';
  createdAt: string;
  logoUrl?: string;
  googleDriveUrl?: string; 
}
const App: React.FC = () => {
  const [invoiceType, setInvoiceType] = useState<'type1' | 'type2'>('type1');
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
const [loadedInvoiceData, setLoadedInvoiceData] = useState<InvoiceData | InvoiceData2 | null>(null);

// Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().logoUrl) {
            setLogoUrl(userDoc.data().logoUrl);
          }
        } catch (error) {
          console.error('Error loading user logo:', error);
        }
      } else {
        setLogoUrl(null);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      alert('✅ Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleLoadInvoice = (invoice: SavedInvoice) => {
    setLoadedInvoiceData(invoice.data);
    setInvoiceType(invoice.templateType);
    if (invoice.logoUrl) {
      setLogoUrl(invoice.logoUrl);
    }
    setShowHistory(false);
    alert('✅ Invoice loaded!');
  };

  const handleDownloadFromHistory = async (invoice: SavedInvoice) => {
    // Load the invoice data
    setLoadedInvoiceData(invoice.data);
    setInvoiceType(invoice.templateType);
    if (invoice.logoUrl) {
      setLogoUrl(invoice.logoUrl);
    }
    
    // Update status to downloaded
    try {
      await updateDoc(doc(db, 'invoices', invoice.id), {
        status: 'downloaded'
      });
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
    
    setShowHistory(false);
    alert('✅ Invoice loaded! Click "Download as PDF" to generate the PDF.');
  };

  const handleTemplateSwitch = (type: 'type1' | 'type2') => {
    setInvoiceType(type);
    // Clear loaded data when switching templates to start fresh
    setLoadedInvoiceData(null);
  };

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <TopNavBar 
        currentUser={currentUser}
        onHistoryClick={() => setShowHistory(true)}
        onSignOut={handleSignOut}
        onSignInClick={() => setShowSignInModal(true)}
      />

      {/* Modals */}
      <SignInModal 
        open={showSignInModal} 
        onClose={() => setShowSignInModal(false)} 
      />
      
      <InvoiceHistory 
        open={showHistory}
        onClose={() => setShowHistory(false)}
        userId={currentUser?.uid || null}
        onLoadInvoice={handleLoadInvoice}
        onDownloadInvoice={handleDownloadFromHistory}
      />

      {/* Page Header */}
      <header className="page-header">
        <h1 className="page-title">Invoice Generator</h1>
        <p className="page-subtitle">
          Click on any field to edit the content. Download your invoice when you're done.
        </p>
        
        {/* Template Switcher */}
        <div style={{ 
          marginTop: '20px', 
          width: '100%',
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={() => handleTemplateSwitch('type1')}
            style={{
              padding: '8px 12px',
              backgroundColor: invoiceType === 'type1' ? '#2563eb' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
          >
            {invoiceType === 'type1' ? '✓ ' : ''}Template 1 (Classic)
          </button>
          
          <button 
            onClick={() => handleTemplateSwitch('type2')}
            style={{
              padding: '10px 20px',
              backgroundColor: invoiceType === 'type2' ? '#2563eb' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
          >
            {invoiceType === 'type2' ? '✓ ' : ''}Template 2 (Modern)
          </button>
          <div >
          <GoogleDriveButton onConnectionChange={setIsGoogleDriveConnected} />
        </div>
        </div>

    

      </header>

      {/* Render Selected Invoice Template */}
      {invoiceType === 'type1' ? (
        <InvoiceProposal1 
          isGoogleDriveConnected={isGoogleDriveConnected}
          onShowSignInModal={() => setShowSignInModal(true)}
          initialData={loadedInvoiceData as InvoiceData | null}  // ← Type assertion
          initialLogoUrl={logoUrl}
        />
      ) : (
        <InvoiceProposal2 
          isGoogleDriveConnected={isGoogleDriveConnected}
          onShowSignInModal={() => setShowSignInModal(true)}
          initialData={loadedInvoiceData as InvoiceData2 | null}  // ← Type assertion
          initialLogoUrl={logoUrl}
        />
      )}
    </div>
  );
};

export default App;