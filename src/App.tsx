import React, { useState, useRef } from 'react';
import type { InvoiceData } from './types';
import EditableField from './components/EditableField';
import Logo from './components/Logo';
import './invoice.css';
import InvoiceProposal2 from './components/InvoiceProposal2';

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
    name: "KEELER NANCY A & GISRIEL JOHN & GISRIEL SHARON",
    email: "Sharon@palmbeaches.net",
    address: "1780 Service Rd, North Palm Beach, FL 33408",
  },
  scopeOfWork: "Armada Property Solutions will remove and dispose of the existing mailbox post and mailboxes. A new double mailbox post will be installed, set securely in concrete for long-lasting stability. Two new white standard mailboxes will be assembled and mounted on the post. Additionally, Armada will reset the front yard pavers around the mailbox, re-leveling the base and reinstalling decorative rocks neatly for a stable and finished appearance.",
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

const App: React.FC = () => {
  const [invoiceType, setInvoiceType] = useState<'type1' | 'type2'>('type1');
  const [data, setData] = useState<InvoiceData>(INITIAL_DATA);
  const [isGenerating, setIsGenerating] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // If showing type 2, render that component
  if (invoiceType === 'type2') {
    return (
      <div>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <button 
            onClick={() => setInvoiceType('type1')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Switch to Invoice Type 1
          </button>
        </div>
        <InvoiceProposal2 />
      </div>
    );
  }

  const handleDownloadPdf = async () => {
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
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Proposal-${data.client.proposalNum}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF", error);
    } finally {
      invoiceElement.classList.remove('shadow-none');
      setIsGenerating(false);
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

  return (
    <div className="app-container">
      <header className="page-header">
        <h1 className="page-title">Invoice Generator</h1>
        <p className="page-subtitle">Click on any field to edit the content. Download your invoice when you're done.</p>
        <button 
          onClick={() => setInvoiceType('type2')}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Switch to Invoice Type 2
        </button>
      </header>
      
      <div className="download-btn-container">
        <button
          onClick={handleDownloadPdf}
          disabled={isGenerating}
          className="download-btn"
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
            'Download as PDF'
          )}
        </button>
      </div>

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
            <Logo  />
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

export default App;