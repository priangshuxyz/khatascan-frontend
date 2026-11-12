import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { listReceipts } from '../api/receipts.js'
import ReceiptRow from '../components/ReceiptRow.jsx'
import { CATEGORIES as ALL_CATEGORIES } from '../constants/categories.js'

const CATEGORIES = ['All', ...ALL_CATEGORIES]

export default function ReceiptsPage() {
  const navigate = useNavigate()
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Search & filter: done by the server, so they cover ALL receipts, not just this page.
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(searchQuery.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const fetchReceipts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listReceipts({
        page,
        per_page: 10,
        q: debouncedQ || undefined,
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        sort_by: 'created_at',
        order: 'desc',
      })
      setReceipts(data.items || [])
      setTotalPages(data.pages || 1)
    } catch (err) {
      console.error(err)
      setError('Could not load receipts. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedQ, selectedCategory])

  useEffect(() => {
    fetchReceipts()
  }, [fetchReceipts])

  return (
    <div className="page-inner" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>All Receipts</h2>
          <p style={styles.subtitle}>View and manage all scanned expenses</p>
        </div>
        <button style={styles.scanBtn} onClick={() => navigate('/scan')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#04100C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Scan</span>
        </button>
      </div>

      {/* Search Bar */}
      <div style={styles.searchContainer}>
        <svg style={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted-cream)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search by merchant or invoice number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
        {searchQuery && (
          <button style={styles.clearBtn} onClick={() => setSearchQuery('')}>
            ×
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div style={styles.filterRow}>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat
          return (
            <button
              key={cat}
              style={{
                ...styles.filterPill,
                backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? '#04100C' : 'var(--text-muted-cream)',
                borderColor: isActive ? 'var(--accent)' : 'var(--border-cream)',
              }}
              onClick={() => {
                setSelectedCategory(cat)
                setPage(1)
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Main Content Area */}
      {error ? (
        <div style={styles.errorBox}>
          <p style={{ color: 'var(--danger)', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => fetchReceipts()}>
            Retry Connection
          </button>
        </div>
      ) : loading ? (
        <div style={styles.listCard}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={styles.skeletonRow}>
              <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <div className="skeleton" style={{ width: '55%', height: '14px' }} />
                <div className="skeleton" style={{ width: '35%', height: '11px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <div className="skeleton" style={{ width: '60px', height: '14px' }} />
                <div className="skeleton" style={{ width: '50px', height: '16px', borderRadius: '9999px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : receipts.length === 0 && !debouncedQ && selectedCategory === 'All' ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIconCircle}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-dark)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3.5h12v17l-2.2-1.5-1.8 1.5-2-1.5-2 1.5-1.8-1.5L6 20.5v-17z" />
              <path d="M9 8h6M9 12h6M9 16h4" />
            </svg>
          </div>
          <h3 style={styles.emptyTitle}>No Receipts Yet</h3>
          <p style={styles.emptySub}>
            Scan a paper or digital receipt to automatically digitize items, totals, and categories.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/scan')} style={{ marginTop: '16px' }}>
            Scan Your First Receipt
          </button>
        </div>
      ) : receipts.length === 0 ? (
        <div style={styles.emptyFilterState}>
          <p style={{ color: 'var(--text-muted-cream)', fontSize: '13.5px' }}>
            No receipts match your search{selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}.
          </p>
          <button
            style={styles.resetFilterBtn}
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('All')
              setPage(1)
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div style={styles.listCard}>
          {receipts.map((r) => (
            <ReceiptRow
              key={r.id}
              receipt={r}
              onClick={() => navigate(`/receipts/${r.id}`)}
            />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.paginationRow}>
              <button
                style={{
                  ...styles.pageBtn,
                  opacity: page <= 1 ? 0.35 : 1,
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                }}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span style={styles.pageIndicator}>
                Page {page} of {totalPages}
              </span>
              <button
                style={{
                  ...styles.pageBtn,
                  opacity: page >= totalPages ? 0.35 : 1,
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                }}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px',
    paddingTop: '4px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '600',
    fontFamily: 'var(--font-serif)',
    color: 'var(--text-on-cream)',
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: '12px',
    color: 'var(--text-muted-cream)',
    marginTop: '2px',
  },
  scanBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'var(--accent)',
    color: '#04100C',
    border: 'none',
    borderRadius: '9999px',
    padding: '9px 18px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  searchContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '14px',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '10px 38px 10px 38px',
    borderRadius: '9999px',
    border: '1px solid var(--border-cream)',
    backgroundColor: 'var(--surface-cream)',
    fontSize: '13.5px',
    color: 'var(--text-on-cream)',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-sans)',
  },
  clearBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: 'var(--text-muted-cream)',
    cursor: 'pointer',
    padding: '0 4px',
  },
  filterRow: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '14px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  filterPill: {
    border: '1px solid',
    borderRadius: '9999px',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  },
  listCard: {
    backgroundColor: 'var(--surface-cream)',
    borderRadius: '24px',
    padding: '10px 18px',
    border: '1px solid var(--border-cream)',
    boxShadow: 'none',
  },
  skeletonRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid var(--border-cream)',
  },
  errorBox: {
    backgroundColor: 'var(--surface-cream)',
    borderRadius: '24px',
    padding: '32px 20px',
    textAlign: 'center',
    border: '1px solid var(--border-cream)',
  },
  emptyState: {
    backgroundColor: 'var(--surface-cream)',
    borderRadius: '24px',
    padding: '44px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    border: '1px solid var(--border-cream)',
  },
  emptyIconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 191, 165, 0.15)',
    border: '1px solid var(--border-cream)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    fontFamily: 'var(--font-serif)',
    color: 'var(--text-on-cream)',
    marginBottom: '6px',
  },
  emptySub: {
    fontSize: '13px',
    color: 'var(--text-muted-cream)',
    maxWidth: '280px',
    lineHeight: '1.45',
  },
  emptyFilterState: {
    backgroundColor: 'var(--surface-cream)',
    borderRadius: '24px',
    padding: '36px 20px',
    textAlign: 'center',
    border: '1px solid var(--border-cream)',
  },
  resetFilterBtn: {
    marginTop: '10px',
    background: 'none',
    border: 'none',
    color: 'var(--accent-dark)',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  paginationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 4px 6px',
  },
  pageBtn: {
    backgroundColor: 'rgba(10, 31, 24, 0.08)',
    color: 'var(--text-on-cream)',
    border: '1px solid var(--border-cream)',
    borderRadius: '9999px',
    padding: '6px 16px',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  pageIndicator: {
    fontSize: '12px',
    color: 'var(--text-muted-cream)',
    fontWeight: '500',
  },
}
