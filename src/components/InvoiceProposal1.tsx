import React, { useRef, useState, useEffect } from "react";
import type { InvoiceData } from "../types";
import EditableField from "./EditableField";
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Logo from "./Logo";
import { auth, db } from '../firebase'; 
import { GoogleDriveService } from '../googledrive/googledrive';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';  
import CloudQueueIcon from '@mui/icons-material/Cloud';
import '../css/invoice.css'
import SaveLocationModal from '../googledrive/SaveLocationModal';

const INITIAL_DATA: InvoiceData = {
  company: {
    name: "Armada Property Solutions, LLC",
    address1: "164 Sims Creek Lane",
    address2: "Jupiter, FL 33458",
    phone: "(561) 401-6771",
    emails: "Info@ArmadaPros.com | mcastro@ArmadaPros.com",
  },
  client: {
    proposalNum: "CVMS0008",
    date: "October 1, 2025",
    name: "Name of Client",
    email: "Client Email Address",
    address: "Client Mailing Address",
  },
  scopeOfWork: "Armada Property Solutions will remove and dispose of the existing mailbox post and mailboxes...",
  lumpSumTotal: "500.00",
  notes: [
    "Labor only. Materials will be purchased, picked up, and delivered by Armada Property Solutions on behalf of the client.",
    "Receipts for all material purchases will be provided to client for reimbursement.",
    "Old mailbox/post will be removed and disposed of.",
    "Client to ensure mailbox placement complies with USPS requirements.",
    "Armada Property Solutions will complete the installation professionally and efficiently."
  ],
  disclaimer: "This proposal is for the scope of work described above only. Armada Property Solutions is not responsible for unforeseen conditions or additional work requested beyond this scope, which may require a separate agreement and cost."
};

interface InvoiceProposal1Props {
  isGoogleDriveConnected?: boolean;
  onShowSignInModal?: () => void;
  initialData?: InvoiceData | null;     
  initialLogoUrl?: string | null;        
}

const InvoiceProposal1: React.FC<InvoiceProposal1Props> = ({ 
  isGoogleDriveConnected = false,
  onShowSignInModal,
  initialData = null,
  initialLogoUrl = null
}) => {
  const [data, setData] = useState<InvoiceData>(initialData ||INITIAL_DATA);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

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

  // Save invoice to Firestore
  const saveInvoiceToFirestore = async (
    status: 'saved' | 'downloaded',
    googleDriveUrl?: string | null
  ) => {
    if (!currentUser) {
      alert('Please sign in to save invoices');
      onShowSignInModal?.();
      return null;
    }

    try {
      const invoiceDoc = {
        userId: currentUser.uid,
        data: data,
        status: status,
        templateType: 'type1', // ← HARDCODED since this is InvoiceProposal1
        createdAt: new Date().toISOString(),
        logoUrl: logoUrl,
        ...(googleDriveUrl && { googleDriveUrl })
      };

      const docRef = await addDoc(collection(db, 'invoices'), invoiceDoc);
      return docRef.id;
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice');
      return null;
    }
  };

// Handle PDF download
const handleDownloadPdf = async (shouldPickFolder: boolean = false) => {
  const { jsPDF } = (window as any).jspdf; // ✅ Fixed: lowercase 'jspdf'
  const html2canvas = (window as any).html2canvas;
  
  const invoiceElement = invoiceRef.current;
  if (!invoiceElement) return;

  setIsGenerating(true);
  invoiceElement.classList.add('shadow-none');

  try {
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true, 
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    
    const fileName = `Proposal-${data.client.proposalNum}.pdf`;
    
    // Always download locally
    pdf.save(fileName);

    // Also upload to Google Drive if requested and connected
    let driveFileUrl = null;
    if (shouldPickFolder && isGoogleDriveConnected) {
      try {
        let folderId: string | null = null;
        
        // Let user pick a folder
        folderId = await GoogleDriveService.pickFolder();
        if (folderId === null) {
          // User cancelled folder selection
          console.log('Folder selection cancelled');
          return;
        }
        
        const pdfBlob = pdf.output('blob');
        const driveFile = await GoogleDriveService.uploadPDF(
          pdfBlob, 
          fileName, 
          folderId || undefined
        );
        
        if (driveFile) {
          driveFileUrl = driveFile.webViewLink;
          alert(`✅ PDF saved to Google Drive!\n\nView: ${driveFile.webViewLink}`);
        }
      } catch (driveError) {
        console.error('Google Drive upload error:', driveError);
        alert('⚠️ PDF downloaded locally, but failed to upload to Google Drive.');
      }
    } else if (!shouldPickFolder && isGoogleDriveConnected) {
      // Use default folder
      try {
        const pdfBlob = pdf.output('blob');
        const folderId = await GoogleDriveService.getInvoiceFolder();
        const driveFile = await GoogleDriveService.uploadPDF(
          pdfBlob, 
          fileName, 
          folderId || undefined
        );
        
        if (driveFile) {
          driveFileUrl = driveFile.webViewLink;
          alert(`✅ PDF saved to Google Drive!\n\nView: ${driveFile.webViewLink}`);
        }
      } catch (driveError) {
        console.error('Google Drive upload error:', driveError);
        alert('⚠️ PDF downloaded locally, but failed to upload to Google Drive.');
      }
    }

    // Save to Firestore with 'downloaded' status and optional Drive link
    await saveInvoiceToFirestore('downloaded', driveFileUrl);
  } catch (error) {
    console.error("Failed to generate PDF", error);
    alert('❌ Failed to generate PDF');
  } finally {
    invoiceElement.classList.remove('shadow-none');
    setIsGenerating(false);
  }
};

  // Handle save for later
  const handleSave = async () => {
    const docId = await saveInvoiceToFirestore('saved', null);
    if (docId) {
      alert('✅ Invoice saved successfully!');
    }
  };

  const handleNoteChange = (index: number, value: string) => {
    const newNotes = [...data.notes];
    newNotes[index] = value;
    setData({ ...data, notes: newNotes });
  };
  
  const addNote = () => {
    setData({ ...data, notes: [...data.notes, "New note..."] });
  };

  const removeNote = (index: number) => {
    const newNotes = data.notes.filter((_: string, i: number) => i !== index);
    setData({ ...data, notes: newNotes });
  };
  // Update data when initialData changes (when loading from history)
useEffect(() => {
  if (initialData) {
    setData(initialData);
  }
}, [initialData]);

// Update logo when initialLogoUrl changes
useEffect(() => {
  if (initialLogoUrl !== null) {
    setLogoUrl(initialLogoUrl);
  }
}, [initialLogoUrl]);

  return (
    <div className="app-container">
      <header className="page-header">
        <h1 className="page-title-1"> Type 1</h1>
      </header>
      
      {/* Action Buttons */}
      <div className="download-btn-container" style={{ display: 'flex', gap: '12px', justifyContent:'left', flexWrap: 'wrap' }}>
        <button
          onClick={handleSave}
          className="download-btn"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            
            justifyContent: 'center',
            backgroundColor: '#0a8706ff'
          }}
        >
          <SaveIcon style={{ fontSize: 20 }} />
          Save for Later
        </button>

        <button
          onClick={() => handleDownloadPdf(false)}
          disabled={isGenerating}
          className="download-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
        >
          {isGenerating ? (
            <>
              <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating PDF...
            </>
          ) : (
            <>
              <DownloadIcon style={{ fontSize: 20 }} />
              Download as PDF
            </>
          )}
        </button>

        {isGoogleDriveConnected && (
          <button
            onClick={() => handleDownloadPdf(true)}
            disabled={isGenerating}
            className="download-btn"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              justifyContent: 'center',
              backgroundColor: '#0f9d58'
            }}
          >
            {isGenerating ? (
              <>
                <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving to Drive...
              </>
            ) : (
              <>
                <CloudQueueIcon style={{ fontSize: 20 }} />
                Save to Google Drive
              </>
            )}
          </button>
        )}
              <SaveLocationModal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSaveLocal={() => handleDownloadPdf(false)}
        onSaveToGoogleDrive={(shouldPickFolder) => handleDownloadPdf(shouldPickFolder)}
        isGoogleDriveConnected={isGoogleDriveConnected}
        onConnectGoogleDrive={() => {
          setShowSaveModal(false);
          onShowSignInModal?.();
        }}
      />
      </div>

      {/* Invoice Content */}
      <div id="invoice-container" ref={invoiceRef}>
        <header className="invoice-header">
          <div className="company-info">
            <EditableField 
              value={data.company.name} 
              onChange={val => setData((d: InvoiceData) => ({ ...d, company: { ...d.company, name: val } }))} 
              className="company-name" 
            />
            <EditableField 
              value={data.company.address1} 
              onChange={val => setData((d: InvoiceData) => ({ ...d, company: { ...d.company, address1: val } }))} 
            />
            <EditableField 
              value={data.company.address2} 
              onChange={val => setData((d: InvoiceData) => ({ ...d, company: { ...d.company, address2: val } }))} 
            />
            <EditableField 
              value={data.company.phone} 
              onChange={val => setData((d: InvoiceData) => ({ ...d, company: { ...d.company, phone: val } }))} 
            />
            <EditableField 
              value={data.company.emails} 
              onChange={val => setData((d: InvoiceData) => ({ ...d, company: { ...d.company, emails: val } }))} 
            />
          </div>
          <div className="logo-container">
            <Logo 
              logoUrl={logoUrl} 
              onLogoChange={setLogoUrl} 
              userId={currentUser?.uid || null} 
            />
          </div>
        </header>

        <section className="client-details">
          <div className="details-grid">
            <strong className="details-label">Proposal #:</strong>
            <div><EditableField value={data.client.proposalNum} onChange={val => setData((d: InvoiceData) => ({ ...d, client: { ...d.client, proposalNum: val } }))} /></div>
            
            <strong className="details-label">Date:</strong>
            <div><EditableField value={data.client.date} onChange={val => setData((d: InvoiceData) => ({ ...d, client: { ...d.client, date: val } }))} /></div>
            
            <strong className="details-label">Client:</strong>
            <div><EditableField value={data.client.name} onChange={val => setData((d: InvoiceData) => ({ ...d, client: { ...d.client, name: val } }))} /></div>
            
            <strong className="details-label">Email:</strong>
            <div><EditableField value={data.client.email} onChange={val => setData((d: InvoiceData) => ({ ...d, client: { ...d.client, email: val } }))} /></div>
            
            <strong className="details-label">Property Address:</strong>
            <div><EditableField value={data.client.address} onChange={val => setData((d: InvoiceData) => ({ ...d, client: { ...d.client, address: val } }))} /></div>
          </div>
        </section>

        <main className="invoice-main">
          <section className="section">
            <h2 className="section-title">Scope of Work</h2>
            <EditableField 
              value={data.scopeOfWork} 
              onChange={val => setData((d: InvoiceData) => ({ ...d, scopeOfWork: val }))} 
              multiline 
              className="section-content" 
            />
          </section>

          <section className="section">
            <h2 className="section-title">Lump Sum Total</h2>
            <div className="lump-sum-amount">
              <span>$</span>
              <EditableField 
                value={data.lumpSumTotal} 
                onChange={val => setData((d: InvoiceData) => ({ ...d, lumpSumTotal: val }))} 
                className="ml-1" 
              />
            </div>
          </section>

          <section className="section">
            <div className="notes-header">
              <h2 className="section-title" style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>Notes</h2>
              <button onClick={addNote} className="add-note-btn">+</button>
            </div>
            <ul className="notes-list">
              {data.notes.map((note: string, index: number) => (
                <li key={index} className="note-item">
                  <span className="note-bullet">•</span>
                  <div className="note-content">
                    <EditableField value={note} onChange={val => handleNoteChange(index, val)} multiline />
                  </div>
                  <button onClick={() => removeNote(index)} className="remove-note-btn">✕</button>
                </li>
              ))}
            </ul>
          </section>

          <section className="section">
            <h2 className="section-title">Disclaimer</h2>
            <EditableField 
              value={data.disclaimer} 
              onChange={val => setData((d: InvoiceData) => ({ ...d, disclaimer: val }))} 
              multiline 
              className="disclaimer-text" 
            />
          </section>
        </main>
        
        <footer className="invoice-footer">
          <h2 className="footer-title">Client Acceptance</h2>
          <div className="signature-section">
            <div className="signature-field">
              <div className="signature-line">Client Signature:</div>
            </div>
            <div className="date-field">
              <div className="signature-line">Date:</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default InvoiceProposal1;