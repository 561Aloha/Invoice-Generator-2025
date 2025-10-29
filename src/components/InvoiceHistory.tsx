import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import type { InvoiceData } from '../types';

interface SavedInvoice {
  id: string;
  data: InvoiceData;
  status: 'saved' | 'downloaded';
  templateType: 'type1' | 'type2';
  createdAt: string;
  logoUrl?: string;
}

interface InvoiceHistoryProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  onLoadInvoice: (invoice: SavedInvoice) => void;
  onDownloadInvoice: (invoice: SavedInvoice) => void;
}

const InvoiceHistory: React.FC<InvoiceHistoryProps> = ({ 
  open, 
  onClose, 
  userId,
  onLoadInvoice,
  onDownloadInvoice
}) => {
  const [savedInvoices, setSavedInvoices] = useState<SavedInvoice[]>([]);
  const [downloadedInvoices, setDownloadedInvoices] = useState<SavedInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && userId) {
      fetchInvoices();
    }
  }, [open, userId]);

  const fetchInvoices = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const invoicesRef = collection(db, 'invoices');
      const q = query(
        invoicesRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const invoices: SavedInvoice[] = [];

      querySnapshot.forEach((doc) => {
        invoices.push({
          id: doc.id,
          ...doc.data()
        } as SavedInvoice);
      });

      // Separate by status
      setSavedInvoices(invoices.filter(inv => inv.status === 'saved'));
      setDownloadedInvoices(invoices.filter(inv => inv.status === 'downloaded'));
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;

    try {
      await deleteDoc(doc(db, 'invoices', invoiceId));
      await fetchInvoices(); // Refresh list
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const InvoiceCard = ({ invoice }: { invoice: SavedInvoice }) => (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      backgroundColor: 'white',
      transition: 'box-shadow 0.2s',
    }}
    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
            {invoice.data.client.proposalNum}
          </h3>
          <p style={{ margin: '4px 0', fontSize: '14px', color: '#6b7280' }}>
            Client: {invoice.data.client.name}
          </p>
          <p style={{ margin: '4px 0', fontSize: '14px', color: '#6b7280' }}>
            Amount: ${invoice.data.lumpSumTotal}
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px', color: '#9ca3af' }}>
            {new Date(invoice.createdAt).toLocaleDateString()} • Template {invoice.templateType === 'type1' ? '1' : '2'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onLoadInvoice(invoice)}
            style={{
              padding: '8px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              background: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Load invoice"
          >
            <VisibilityIcon style={{ fontSize: 18, color: '#2563eb' }} />
          </button>
          
          <button
            onClick={() => onDownloadInvoice(invoice)}
            style={{
              padding: '8px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              background: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Download PDF"
          >
            <DownloadIcon style={{ fontSize: 18, color: '#10b981' }} />
          </button>
          
          <button
            onClick={() => handleDelete(invoice.id)}
            style={{
              padding: '8px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              background: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Delete"
          >
            <DeleteIcon style={{ fontSize: 18, color: '#ef4444' }} />
          </button>
        </div>
      </div>
    </div>
  );

  if (!open) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '32px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Invoice History</h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <CloseIcon style={{ fontSize: 24 }} />
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading invoices...</p>
        ) : (
          <>
            {/* Saved for Later Section */}
            <section style={{ marginBottom: '32px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                marginBottom: '16px',
                color: '#374151',
                borderBottom: '2px solid #2563eb',
                paddingBottom: '8px'
              }}>
                📋 Saved for Later ({savedInvoices.length})
              </h3>
              {savedInvoices.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '14px', fontStyle: 'italic' }}>
                  No saved invoices yet. Click "Save" to save an invoice for later.
                </p>
              ) : (
                savedInvoices.map(invoice => (
                  <InvoiceCard key={invoice.id} invoice={invoice} />
                ))
              )}
            </section>

            {/* Past Downloads Section */}
            <section>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                marginBottom: '16px',
                color: '#374151',
                borderBottom: '2px solid #10b981',
                paddingBottom: '8px'
              }}>
                ✅ Past Downloads ({downloadedInvoices.length})
              </h3>
              {downloadedInvoices.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '14px', fontStyle: 'italic' }}>
                  No downloaded invoices yet. Download an invoice to see it here.
                </p>
              ) : (
                downloadedInvoices.map(invoice => (
                  <InvoiceCard key={invoice.id} invoice={invoice} />
                ))
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default InvoiceHistory;