import React from 'react'
import { useNavigate } from 'react-router-dom'
import ReceiptRow from './ReceiptRow.jsx'

const MOCK_RECEIPTS = [
  {
    id: 'mock-1',
    vendor_name: 'Super Mart',
    date: '12 Sep 2026',
    total: 320.0,
    category: 'Groceries',
    items: [
      { name: 'Rice', total_price: 160.0 },
      { name: 'Oil', total_price: 120.0 },
      { name: 'Biscuits', total_price: 40.0 },
    ],
  },
  {
    id: 'mock-2',
    vendor_name: 'Spice Hub Restaurant',
    date: '11 Sep 2026',
    total: 450.0,
    category: 'Restaurant',
    items: [
      { name: 'Chicken Biryani', total_price: 320.0 },
      { name: 'Cold Drink', total_price: 130.0 },
    ],
  },
  {
    id: 'mock-3',
    vendor_name: 'HP Petrol Pump',
    date: '10 Sep 2026',
    total: 2000.0,
    category: 'Transport',
    items: [
      { name: 'Petrol Unleaded', total_price: 2000.0 },
    ],
  },
]

export default function RecentReceipts({ receipts = [], loading = false }) {
  const navigate = useNavigate()

  const displayReceipts = Array.isArray(receipts) ? receipts : []
  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <h3 style={styles.title}>Recent Transactions</h3>
          <p style={styles.subtitle}>Latest scanned receipts</p>
        </div>
        <button style={styles.seeAllBtn} onClick={() => navigate('/receipts')}>
          View all
        </button>
      </div>

      {/* Receipts List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 0' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="skeleton" style={{ width: '50%', height: '14px' }} />
                <div className="skeleton" style={{ width: '30%', height: '11px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                <div className="skeleton" style={{ width: '60px', height: '14px' }} />
                <div className="skeleton" style={{ width: '50px', height: '16px', borderRadius: '9999px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.list}>
          {displayReceipts.slice(0, 5).map((r) => (
            <ReceiptRow
              key={r.id}
              receipt={r}
              onClick={() => {
                if (r.id.startsWith('mock')) {
                  navigate('/receipts')
                } else {
                  navigate(`/receipts/${r.id}`)
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  card: {
    backgroundColor: 'var(--surface-cream)',
    borderRadius: '24px',
    padding: '22px 20px',
    marginBottom: '14px',
    border: '1px solid var(--border-cream)',
    boxShadow: 'none',
    boxSizing: 'border-box',
    width: '100%',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    fontFamily: 'var(--font-serif)',
    color: 'var(--text-on-cream)',
    letterSpacing: '-0.2px',
    marginBottom: '2px',
  },
  subtitle: {
    fontSize: '12px',
    color: 'var(--text-muted-cream)',
  },
  seeAllBtn: {
    backgroundColor: 'rgba(11, 107, 90, 0.12)',
    border: '1px solid var(--border-cream)',
    color: 'var(--accent-dark)',
    borderRadius: '9999px',
    padding: '5px 14px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
  },
}
