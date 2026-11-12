import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getReceipt } from '../api/receipts.js'
import { apiBase } from '../api/client.js'

const CATEGORY_THEMES = {
  Groceries: { bg: 'rgba(0, 191, 165, 0.18)', color: '#0B6B5A' },
  Restaurant: { bg: 'rgba(11, 107, 90, 0.18)', color: '#0B6B5A' },
  Utilities: { bg: 'rgba(95, 211, 188, 0.25)', color: '#0B6B5A' },
  Transport: { bg: 'rgba(46, 139, 122, 0.2)', color: '#0B6B5A' },
  Others: { bg: 'rgba(155, 181, 168, 0.25)', color: '#4A6055' },
}

function formatINR(val) {
  if (val === undefined || val === null) return '₹ 0.00'
  return (
    '₹ ' +
    Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default function ReceiptDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showRawOcr, setShowRawOcr] = useState(false)

  useEffect(() => {
    getReceipt(id)
      .then(setReceipt)
      .catch((err) => {
        console.error(err)
        setError('Unable to load receipt details.')
      })
      .finally(() => setLoading(false))
  }, [id])

  const categoryKey = receipt?.category || 'Others'
  const theme = CATEGORY_THEMES[categoryKey] || CATEGORY_THEMES.Others

  return (
    <div className="page-inner" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate(-1)} aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-on-cream)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span style={styles.backText}>Back</span>
        </button>
        <h2 style={styles.headerTitle}>Receipt Details</h2>
        <div style={{ width: '48px' }} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="spinner" />
        </div>
      ) : error ? (
        <div style={styles.errorBox}>
          <p style={{ color: 'var(--danger)', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      ) : receipt ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Main Transaction Overview Card */}
          <div style={styles.card}>
            <div style={styles.topRow}>
              <div>
                <span style={styles.metaLabel}>MERCHANT</span>
                <h3 style={styles.merchantName}>{receipt.vendor_name || 'Unknown Vendor'}</h3>
              </div>
              <span style={{ ...styles.categoryBadge, backgroundColor: theme.bg, color: theme.color }}>
                {categoryKey}
              </span>
            </div>

            <div style={styles.amountBlock}>
              <span style={styles.amountLabel}>Total Amount</span>
              <div style={styles.totalAmount} className="tabular-nums">
                {formatINR(receipt.total)}
              </div>
            </div>

            <div style={styles.divider} />

            <div style={styles.detailRow}>
              <span style={styles.rowLabel}>Transaction Date</span>
              <span style={styles.rowValue}>{formatDate(receipt.date || receipt.created_at)}</span>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.rowLabel}>Receipt ID</span>
              <span style={{ ...styles.rowValue, fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted-cream)' }}>
                {receipt.id}
              </span>
            </div>
          </div>

          {/* Line Items Breakdown Table */}
          {receipt.items && receipt.items.length > 0 && (
            <div style={styles.card}>
              <div style={styles.sectionHeaderRow}>
                <h4 style={styles.sectionHeading}>Itemized Breakdown</h4>
                <span style={styles.itemCountBadge}>{receipt.items.length} items</span>
              </div>

              <div style={styles.tableHeader}>
                <span style={{ flex: 1 }}>Item</span>
                <span style={{ width: '50px', textAlign: 'center' }}>Qty</span>
                <span style={{ width: '80px', textAlign: 'right' }}>Price</span>
              </div>

              <div style={styles.itemsList}>
                {receipt.items.map((item, idx) => (
                  <div key={item.id || idx} style={styles.itemRow}>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                      <span style={styles.itemName}>{item.name}</span>
                    </div>
                    <span style={{ width: '50px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted-cream)' }} className="tabular-nums">
                      {item.quantity || 1}
                    </span>
                    <span style={{ width: '80px', textAlign: 'right', fontSize: '13.5px', fontWeight: '600', fontFamily: 'var(--font-serif)', color: 'var(--text-on-cream)' }} className="tabular-nums">
                      {formatINR(item.total_price || item.unit_price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : null}
    </div>
  )
}

const styles = {
  container: {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: 'var(--bg-cream)',
    color: 'var(--text-on-cream)',
    minHeight: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '18px',
    paddingTop: '4px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px 0',
  },
  backText: {
    fontSize: '13.5px',
    fontWeight: '600',
    color: 'var(--text-on-cream)',
    fontFamily: 'var(--font-sans)',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '600',
    fontFamily: 'var(--font-serif)',
    color: 'var(--text-on-cream)',
  },
  card: {
    backgroundColor: 'var(--surface-cream)',
    borderRadius: '24px',
    padding: '22px 20px',
    border: '1px solid var(--border-cream)',
    boxShadow: 'none',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  metaLabel: {
    fontSize: '10.5px',
    fontWeight: '600',
    color: 'var(--text-muted-cream)',
    letterSpacing: '0.06em',
  },
  merchantName: {
    fontSize: '20px',
    fontWeight: '600',
    fontFamily: 'var(--font-serif)',
    color: 'var(--text-on-cream)',
    marginTop: '2px',
  },
  categoryBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '3px 10px',
    borderRadius: '9999px',
    border: '1px solid var(--border-cream)',
  },
  amountBlock: {
    margin: '12px 0 16px',
  },
  amountLabel: {
    fontSize: '11.5px',
    color: 'var(--text-muted-cream)',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: '30px',
    fontWeight: '600',
    fontFamily: 'var(--font-serif)',
    color: 'var(--text-on-cream)',
    marginTop: '2px',
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border-cream)',
    margin: '14px 0',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  rowLabel: {
    fontSize: '13px',
    color: 'var(--text-muted-cream)',
  },
  rowValue: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-on-cream)',
  },
  sectionHeading: {
    fontSize: '15px',
    fontWeight: '600',
    fontFamily: 'var(--font-serif)',
    color: 'var(--text-on-cream)',
  },
  sectionHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  itemCountBadge: {
    fontSize: '11.5px',
    color: 'var(--text-muted-cream)',
    backgroundColor: 'var(--bg-cream)',
    border: '1px solid var(--border-cream)',
    padding: '2px 10px',
    borderRadius: '9999px',
    fontWeight: '600',
  },
  tableHeader: {
    display: 'flex',
    paddingBottom: '8px',
    borderBottom: '1px solid var(--border-cream)',
    fontSize: '11.5px',
    fontWeight: '600',
    color: 'var(--text-muted-cream)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid var(--border-cream)',
  },
  itemName: {
    fontSize: '13.5px',
    fontWeight: '500',
    color: 'var(--text-on-cream)',
  },
  imageWrapper: {
    marginTop: '12px',
    borderRadius: '16px',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-cream)',
    border: '1px solid var(--border-cream)',
    maxHeight: '300px',
    display: 'flex',
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'contain',
  },
  collapsibleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
  },
  toggleLink: {
    fontSize: '12.5px',
    color: 'var(--accent-dark)',
    fontWeight: '600',
  },
  rawText: {
    marginTop: '12px',
    backgroundColor: 'var(--bg-cream)',
    borderRadius: '16px',
    padding: '12px',
    fontSize: '11.5px',
    color: 'var(--text-on-cream)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    fontFamily: 'monospace',
    maxHeight: '180px',
    overflowY: 'auto',
    border: '1px solid var(--border-cream)',
  },
  errorBox: {
    backgroundColor: 'var(--surface-cream)',
    borderRadius: '24px',
    padding: '32px 20px',
    textAlign: 'center',
    border: '1px solid var(--border-cream)',
  },
}
