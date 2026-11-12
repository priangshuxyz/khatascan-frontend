import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function ScanReceiptCard({ onScan }) {
  const navigate = useNavigate()

  const handleScanClick = () => {
    if (onScan) {
      onScan()
    } else {
      navigate('/scan')
    }
  }

  return (
    <div style={styles.card}>
      <div style={styles.leftGroup}>
        <div style={styles.iconCircle}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
        <div style={styles.textGroup}>
          <h3 style={styles.title}>Scan &amp; Digitize Receipt</h3>
          <p style={styles.subtitle}>Instant OCR extraction for items and totals</p>
        </div>
      </div>

      <button style={styles.scanButton} onClick={handleScanClick} aria-label="Scan receipt now">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#04100C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Scan</span>
      </button>
    </div>
  )
}

const styles = {
  card: {
    backgroundColor: 'var(--surface-cream)',
    borderRadius: '24px',
    padding: '18px 20px',
    marginBottom: '14px',
    border: '1px solid var(--border-cream)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    boxShadow: 'none',
    boxSizing: 'border-box',
    width: '100%',
  },
  leftGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    minWidth: 0,
    flex: 1,
  },
  iconCircle: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    backgroundColor: 'rgba(15, 179, 157, 0.79)',
    border: '1px solid var(--border-cream)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textGroup: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  title: {
    fontSize: '15px',
    fontWeight: '600',
    fontFamily: 'var(--font-serif)',
    color: 'var(--text-on-cream)',
    letterSpacing: '-0.2px',
    marginBottom: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  subtitle: {
    fontSize: '12px',
    color: 'var(--text-muted-cream)',
    lineHeight: '1.35',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  scanButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'var(--accent)',
    color: '#03885c',
    border: 'none',
    borderRadius: '9999px',
    padding: '9px 18px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background-color 0.15s ease',
  },
}
