import React, { useState, useRef } from 'react';
import type { InvoiceData2 } from '../types2';
import EditableField from './EditableField';
import Logo from './Logo';
import '../invoice2.css';

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
    name: "FANT KYLE B.",
    address1: "154 BERMUDA DR",
    address2: "JUPITER FL 33458 2919",
    pcn: "30424123040000640",
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

const InvoiceProposal2: React.FC = () => {
  const [data, setData] = useState<InvoiceData2>(INITIAL_DATA);
  const [isGenerating, setIsGenerating] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

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
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 100;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Proposal-${data.proposal.number}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF", error);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      invoiceElement.classList.remove('shadow-none');
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-container2">
      <header className="page-header2">
        <h1 className="page-title2">Proposal Generator</h1>
        <p className="page-subtitle2">Click on any field to edit the content. Download your proposal when you're done.</p>
      </header>
      
      <div className="download-btn-container2">
        <button
          onClick={handleDownloadPdf}
          disabled={isGenerating}
          className="download-btn2"
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
            'Download as PDF'
          )}
        </button>
      </div>

      <div id="invoice-container2" ref={invoiceRef}>
        <div className="proposal-header2">
          <div className="logo-section2">
            <Logo width="150px" height="150px" />
          </div>

          <div className="company-section2" >
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