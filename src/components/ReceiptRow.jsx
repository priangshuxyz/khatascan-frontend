import React, { useState } from 'react'
import { apiBase } from '../api/client.js'
import { categoryTheme, normalizeCategory } from '../constants/categories.js'
import { formatDay, receiptDay } from '../utils/format.js'

const stroke = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

const ICONS = {
  Groceries: (
    <svg {...stroke}>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  'Food & Dining': (
    <svg {...stroke}>
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  ),
  'Bills & Utilities': (
    <svg {...stroke}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Transport: (
    <svg {...stroke}>
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
}

const DEFAULT_ICON = (
  <svg {...stroke}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)

function formatAmount(amount) {
  if (amount === undefined || amount === null) return '₹ 0.00'
  return (
    '₹ ' +
    Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}

export default function ReceiptRow({ receipt, onClick }) {
  const categoryKey = normalizeCategory(receipt.category)
  const theme = categoryTheme(categoryKey)
  const [imgFailed, setImgFailed] = useState(false)

  const imgUrl = receipt.thumbnail_url || receipt.image_url

  return (
    <div style={styles.row} onClick={onClick} role="button" tabIndex={0}>
      {/* Left Icon / Thumbnail */}
      <div style={styles.iconContainer}>
        {imgUrl && !imgFailed ? (
          <img
            src={`${apiBase}${imgUrl}`}
            alt={receipt.vendor_name || 'Receipt'}
            style={styles.thumbnailImg}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div style={{ ...styles.iconBox, backgroundColor: theme.bg, color: theme.text }}>
            {ICONS[categoryKey] || DEFAULT_ICON}
          </div>
        )}
      </div>

      {/* Middle: Vendor Name & Transaction Date */}
      <div style={styles.middleCol}>
        <span style={styles.vendorName}>{receipt.vendor_name || 'Receipt'}</span>
        <span style={styles.dateText}>{formatDay(receiptDay(receipt))}</span>
      </div>

      {/* Right: Amount & Category Badge */}
      <div style={styles.rightCol}>
        <span style={styles.amountText} className="tabular-nums">
          {formatAmount(receipt.total)}
        </span>
        <span style={{ ...styles.categoryPill, backgroundColor: theme.bg, color: theme.text }}>
          {categoryKey}
        </span>
      </div>
    </div>
  )
}

const styles = {
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 4px',
    borderBottom: '1px solid var(--border-cream)',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background-color 0.15s ease',
  },
  iconContainer: {
    marginRight: '12px',
    flexShrink: 0,
  },
  thumbnailImg: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    objectFit: 'cover',
    border: '1px solid var(--border-cream)',
  },
  iconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border-cream)',
  },
  middleCol: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  vendorName: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-on-cream)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    letterSpacing: '-0.1px',
  },
  dateText: {
    fontSize: '12px',
    fontWeight: '400',
    color: 'var(--text-muted-cream)',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '3px',
    flexShrink: 0,
    marginLeft: '10px',
  },
  amountText: {
    fontSize: '14.5px',
    fontWeight: '600',
    fontFamily: 'var(--font-serif)',
    color: 'var(--text-on-cream)',
    letterSpacing: '-0.2px',
  },
  categoryPill: {
    fontSize: '10.5px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '9999px',
    display: 'inline-block',
  },
}
