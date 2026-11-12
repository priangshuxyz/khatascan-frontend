import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getReceipt, updateReceipt, deleteReceipt } from '../api/receipts.js'
import { apiBase } from '../api/client.js'
import { categoryTheme, normalizeCategory } from '../constants/categories.js'
import { formatINR, formatDay, receiptDay } from '../utils/format.js'

export default function ReceiptDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [busy, setBusy] = useState(false)
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

  const categoryKey = normalizeCategory(receipt?.category)
  const theme = categoryTheme(categoryKey)

  // Photos: every page of the receipt. The URLs are signed by the server (?sig=...)
  // so a plain <img> works. They expire after about an hour: reload the page to refresh them.
  const photos = receipt?.pages?.length
    ? receipt.pages.map((p) => ({ n: p.page_number, url: p.image_url }))
    : receipt?.image_url
      ? [{ n: 1, url: receipt.image_url }]
      : []

  async function markReviewed() {
    setBusy(true)
    setActionError(null)
    try {
      setReceipt(await updateReceipt(id, { needs_review: false }))
    } catch (err) {
      console.error(err)
      setActionError('Could not update the receipt. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this receipt and its photos? This can’t be undone.')) return
    setBusy(true)
    setActionError(null)
    try {
      await deleteReceipt(id)
      navigate('/receipts', { replace: true })
    } catch (err) {
      console.error(err)
      setActionError('Could not delete the receipt. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="page-inner" style={styles.container}>
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
          <button className="btn btn-primary" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      ) : receipt ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {receipt.needs_review && (
            <div style={styles.banner}>
              <strong>Please double-check this receipt.</strong>
              {receipt.review_reason ? ` ${receipt.review_reason}` : ''}
              <div>
                <button style={styles.bannerBtn} onClick={markReviewed} disabled={busy}>Mark as reviewed</button>
              </div>
            </div>
          )}

          <div style={styles.card}>
            <div style={styles.topRow}>
              <div>
                <span style={styles.metaLabel}>MERCHANT</span>
                <h3 style={styles.merchantName}>{receipt.vendor_name || 'Unknown Vendor'}</h3>
              </div>
              <span style={{ ...styles.categoryBadge, backgroundColor: theme.bg, color: theme.text }}>
                {categoryKey}
              </span>
            </div>

            <div style={styles.amountBlock}>
              <span style={styles.amountLabel}>Total Amount</span>
              <div style={styles.totalAmount} className="tabular-nums">{formatINR(receipt.total)}</div>
            </div>

            <div style={styles.divider} />

            <div style={styles.detailRow}>
              <span style={styles.rowLabel}>Date</span>
              <span style={styles.rowValue}>{formatDay(receiptDay(receipt))}</span>
            </div>
            {receipt.invoice_number && (
              <div style={styles.detailRow}>
                <span style={styles.rowLabel}>Invoice no.</span>
                <span style={styles.rowValue}>{receipt.invoice_number}</span>
              </div>
            )}
            {receipt.vendor_gstin && (
              <div style={styles.detailRow}>
                <span style={styles.rowLabel}>Seller GSTIN</span>
                <span style={{ ...styles.rowValue, fontFamily: 'monospace', fontSize: '12px' }}>{receipt.vendor_gstin}</span>
              </div>
            )}
            {receipt.tax_total > 0 && (
              <div style={styles.detailRow}>
                <span style={styles.rowLabel}>Tax</span>
                <span style={styles.rowValue} className="tabular-nums">{formatINR(receipt.tax_total)}</span>
              </div>
            )}
          </div>

          {photos.length > 0 && (
            <div style={styles.card}>
              <h4 style={styles.sectionHeading}>Receipt {photos.length > 1 ? 'Pages' : 'Photo'}</h4>
              <div style={styles.photoStrip}>
                {photos.map((p) => (
                  <a key={p.n} href={`${apiBase}${p.url}`} target="_blank" rel="noreferrer" style={styles.photoFrame}>
                    <img src={`${apiBase}${p.url}`} alt={`Receipt page ${p.n}`} style={styles.photoImg} />
                    {photos.length > 1 && <span style={styles.photoBadge}>Page {p.n} of {photos.length}</span>}
                  </a>
                ))}
              </div>
              <p style={styles.photoHint}>
                {photos.length > 1 ? 'Swipe for the next page. ' : ''}Tap a photo to open it full size.
              </p>
            </div>
          )}

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
                    <span style={{ width: '80px', textAlign: 'right', fontSize: '13.5px', fontWeight: '600', fontFamily: 'var(--font-serif)' }} className="tabular-nums">
                      {formatINR(item.total_price || item.unit_price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {receipt.raw_ocr_text && (
            <div style={styles.card}>
              <div style={styles.collapsibleHeader} onClick={() => setShowRawOcr(!showRawOcr)} role="button" tabIndex={0}>
                <h4 style={{ ...styles.sectionHeading, marginBottom: 0 }}>Text read from the receipt</h4>
                <span style={styles.toggleLink}>{showRawOcr ? 'Hide' : 'View'}</span>
              </div>
              {showRawOcr && <pre style={styles.rawText}>{receipt.raw_ocr_text}</pre>}
            </div>
          )}

          {actionError && <p style={{ color: 'var(--danger)', fontSize: '13px' }}>{actionError}</p>}
          <button style={styles.deleteBtn} onClick={handleDelete} disabled={busy}>Delete receipt</button>
        </div>
      ) : null}
    </div>
  )
}

const styles = {
  banner: {
    backgroundColor: 'rgba(242,178,27,0.16)',
    border: '1px solid rgba(242,178,27,0.5)',
    borderRadius: '16px',
    padding: '12px 14px',
    fontSize: '12.5px',
    lineHeight: 1.4,
  },
  bannerBtn: {
    marginTop: '8px',
    background: 'none',
    border: '1px solid var(--accent-dark)',
    color: 'var(--accent-dark)',
    borderRadius: '9999px',
    padding: '5px 14px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  photoStrip: {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    marginTop: '12px',
    scrollSnapType: 'x mandatory',
  },
  photoFrame: {
    position: 'relative',
    flex: '0 0 100%',
    scrollSnapAlign: 'start',
    borderRadius: '16px',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-cream)',
    border: '1px solid var(--border-cream)',
  },
  photoImg: { width: '100%', maxHeight: '360px', objectFit: 'contain', display: 'block' },
  photoBadge: {
    position: 'absolute', top: '8px', left: '8px', backgroundColor: 'var(--accent-dark)',
    color: '#fff', fontSize: '10.5px', fontWeight: '700', borderRadius: '9999px', padding: '2px 8px',
  },
  photoHint: { fontSize: '11.5px', color: 'var(--text-muted-cream)', marginTop: '8px' },
  deleteBtn: {
    width: '100%', padding: '13px', borderRadius: '9999px', border: '1.5px solid var(--danger)',
    backgroundColor: 'transparent', color: 'var(--danger)', fontSize: '14px', fontWeight: '600',
    cursor: 'pointer',
  },
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
