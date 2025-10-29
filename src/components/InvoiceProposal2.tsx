import React, { useState, useRef, useEffect } from 'react';
import type { InvoiceData2 } from '../types2';
import EditableField from './EditableField';
import Logo from './Logo';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { GoogleDriveService } from '../googledrive/googledrive';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import CloudQueueIcon from '@mui/icons-material/Cloud';
import '../css/invoice2.css';

const INITIAL_DATA: InvoiceData2 = {
  company: {
    name: "Armada Property Solutions LLC.",
    address: "164 Sims Creek Lane, Jupiter FL, 33458",
    email: "Mcastro@ArmadaPros.com",
    phone: "(561)401-6771",
  },
  proposal: {
    number: "#PKF0001",
    date: "5/14/2025",
  },
  client: {
    name: "Client Name.",
    address1: "Client Mailing Address",
    address2: "Client Mailing Address",
    pcn: "30å424123040000640",
  },
  projectScope: "INTERIOR DEMOLITION OF 1ST FLOOR PLAN AND 2ND FLOOR PLAN.",
  description: `Demolition of 1st Floor Plan and 2nd Floor Plan:
Remove all selected walls, selected doors, selected millwork, tile throughout entire house and all plumbing fixtures per demolition keynotes for first and second floor noted on Sheet Number D1.0 on client provided demolition floor plan.

Demo existing kitchen countertops and cabinets.

Demo all bathrooms; countertops, vanities, mirrors, tubs, toilets, shower enclosures and all tile in all bathrooms throughout.

Remove all selected existing ceiling and insulation throughout in selected areas.

Demo angle in ceiling on 1st floor to accommodate shower drain.

Cut Concrete Slab:
Cutting of existing slab for proposed plumbing is included and will commence after demo. Plumber must properly marked and located areas where slab will need to be cut prior to cutting slab. Please note: Core drilling for new bathroom drain, new toilet and new drain location will be priced separate. Slab repair, fill back and pouring of concrete will be priced separately.

Dumpster:
Dumpster scheduling will be coordinated by Armada to help client. Dumpster estimate will be sent separately and will be ordered once demo permit is issued and upon client approval. Dumpster will be billed to client directly to minimize added cost.`,
  amount: "8,600.00",
  notes: "All construction debris to be thrown away in client provided dumpster onsite.\nThe above price is a lump-sum price based on a good faith budget. Some prices may be subject to change due to any unforeseen or added work scopes.",
};

interface InvoiceProposal2Props {
  isGoogleDriveConnected?: boolean;
  onShowSignInModal?: () => void;
  initialData?: InvoiceData2 | null;
  initialLogoUrl?: string | null;
}

const InvoiceProposal2: React.FC<InvoiceProposal2Props> = ({
  isGoogleDriveConnected = false,
  onShowSignInModal,
  initialData = null,
  initialLogoUrl = null
}) => {
  const [data, setData] = useState<InvoiceData2>(initialData || INITIAL_DATA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

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

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user && !initialLogoUrl) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().logoUrl) {
            setLogoUrl(userDoc.data().logoUrl);
          }
        } catch (error) {
          console.error('Error loading user logo:', error);
        }
      } else if (!user) {
        setLogoUrl(null);
      }
    });

    return () => unsubscribe();
  }, [initialLogoUrl]);

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
        templateType: 'type2', // ← HARDCODED since this is InvoiceProposal2
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
  const handleDownloadPdf = async (saveToGoogleDrive: boolean = false) => {
    const { jsPDF } = (window as any).jspdf;
    const html2canvas = (window as any).html2canvas;

    const invoiceElement = invoiceRef.current;
    if (!invoiceElement) return;

    setIsGenerating(true);
    invoiceElement.classList.add('shadow-none');

    try {
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);

      const fileName = `Proposal-${data.proposal.number}.pdf`;

      // Always download locally
      pdf.save(fileName);

      // Also upload to Google Drive if requested and connected
      let driveFileUrl = null;
      if (saveToGoogleDrive && isGoogleDriveConnected) {
        try {
          const pdfBlob = pdf.output('blob');
          const folderId = await GoogleDriveService.getInvoiceFolder();
          const driveFile = await GoogleDriveService.uploadPDF(pdfBlob, fileName, folderId || undefined);

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
      alert("Failed to generate PDF. Check console for details.");
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

  return (
    <div className="app-container2">
      <header className="page-header2">
        <h1 className="page-title2">Proposal Generator - Type 2</h1>
        <p className="page-subtitle2">Click on any field to edit the content. Download your proposal when you're done.</p>
      </header>

      {/* Action Buttons */}
      <div className="download-btn-container2" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <button
          onClick={handleSave}
          className="download-btn2"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            justifyContent: 'center',
            backgroundColor: '#10b981'
          }}
        >
          <SaveIcon style={{ fontSize: 20 }} />
          Save for Later
        </button>

        <button
          onClick={() => handleDownloadPdf(false)}
          disabled={isGenerating}
          className="download-btn2"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
        >
          {isGenerating ? (
            <>
              <svg className="spinner2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
            className="download-btn2"
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
                <svg className="spinner2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
      </div>

      <div id="invoice-container2" ref={invoiceRef}>
        <div className="proposal-header2">
          <div className="logo-section2">
            <Logo
              logoUrl={logoUrl}
              onLogoChange={setLogoUrl}
              userId={currentUser?.uid || null}
            />
          </div>

          <div className="company-section2">
            <h1 className="proposal-title2">PROPOSAL</h1>
            <EditableField
              value={data.company.name}
              onChange={val => setData((d: InvoiceData2) => ({ ...d, company: { ...d.company, name: val } }))}
              className="company-name2"
            />
            <EditableField
              value={data.company.address}
              onChange={val => setData((d: InvoiceData2) => ({ ...d, company: { ...d.company, address: val } }))}
            />
            <EditableField
              value={data.company.email}
              onChange={val => setData((d: InvoiceData2) => ({ ...d, company: { ...d.company, email: val } }))}
            />
            <EditableField
              value={data.company.phone}
              onChange={val => setData((d: InvoiceData2) => ({ ...d, company: { ...d.company, phone: val } }))}
            />
          </div>
        </div>

        <div className="info-row2">
          <div className="billed-to2">
            <strong>BILLED TO:</strong>
            <EditableField
              value={data.client.name}
              onChange={val => setData((d: InvoiceData2) => ({ ...d, client: { ...d.client, name: val } }))}
            />
            <EditableField
              value={data.client.address1}
              onChange={val => setData((d: InvoiceData2) => ({ ...d, client: { ...d.client, address1: val } }))}
            />
            <EditableField
              value={data.client.address2}
              onChange={val => setData((d: InvoiceData2) => ({ ...d, client: { ...d.client, address2: val } }))}
            />
            <EditableField
              value={data.client.pcn}
              onChange={val => setData((d: InvoiceData2) => ({ ...d, client: { ...d.client, pcn: val } }))}
            />
          </div>
          <div className="proposal-info2">
            <div className="info-line2">
              <span>Date:</span>
              <EditableField
                value={data.proposal.date}
                onChange={val => setData((d: InvoiceData2) => ({ ...d, proposal: { ...d.proposal, date: val } }))}
              />
            </div>
            <div className="info-line2">
              <span>Proposal No:</span>
              <EditableField
                value={data.proposal.number}
                onChange={val => setData((d: InvoiceData2) => ({ ...d, proposal: { ...d.proposal, number: val } }))}
              />
            </div>
          </div>
        </div>

        <div className="project-scope2">
          <strong>PROJECT SCOPE:</strong>
          <EditableField
            value={data.projectScope}
            onChange={val => setData((d: InvoiceData2) => ({ ...d, projectScope: val }))}
            multiline
          />
        </div>

        <div className="description2">
          <EditableField
            value={data.description}
            onChange={val => setData((d: InvoiceData2) => ({ ...d, description: val }))}
            multiline
            className="description-text2"
          />
        </div>

        <div className="amount-section2">
          <div className="amount-label2">DESCRIPTION</div>
          <div className="amount-value2">AMOUNT</div>
        </div>

        <div className="total-section2">
          <div className="total-label2">TOTAL</div>
          <div className="total-amount2">
            <span>$</span>
            <EditableField
              value={data.amount}
              onChange={val => setData((d: InvoiceData2) => ({ ...d, amount: val }))}
            />
          </div>
        </div>

        <div className="subtotal2">
          <span>Sub-Total</span>
          <span>${data.amount}</span>
        </div>

        <div className="notes2">
          <strong>Notes:</strong>
          <EditableField
            value={data.notes}
            onChange={val => setData((d: InvoiceData2) => ({ ...d, notes: val }))}
            multiline
          />
        </div>

        <div className="approval-section2">
          <strong>Approved By</strong>
          <div className="signature-line2">
            <span>Print Client's Name</span>
            <div className="line2"></div>
          </div>
          <div className="signature-line2">
            <span>Client Signature</span>
            <div className="line2"></div>
          </div>
          <div className="signature-line2">
            <span>Date</span>
            <div className="line2"></div>
          </div>
        </div>

        <div className="thank-you2">
          Thank you for your business.
        </div>
      </div>
    </div>
  );
};

export default InvoiceProposal2;