import React, { useState, useEffect } from 'react'
import { getMonthlySummary, getCategories } from '../api/analytics.js'

const CATEGORY_COLORS = {
  Groceries: '#00BFA5',
  Restaurant: '#0B6B5A',
  Utilities: '#5FD3BC',
  Transport: '#2E8B7A',
  Others: '#9BB5A8',
  Other: '#9BB5A8',
}

const FALLBACK_CATEGORIES = [
  { category: 'Groceries', total: 4320, percentage: 35, count: 6 },
  { category: 'Restaurant', total: 2240, percentage: 18, count: 4 },
  { category: 'Utilities', total: 1870, percentage: 15, count: 2 },
  { category: 'Transport', total: 1490, percentage: 12, count: 3 },
  { category: 'Others', total: 2530, percentage: 20, count: 5 },
]

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

export default function AnalyticsPage() {
  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const currentMonthName = today.toLocaleString('en-US', { month: 'short', year: 'numeric' })
  const daysPassed = today.getDate() || 1

  useEffect(() => {
    const month = today.getMonth() + 1
    const year = today.getFullYear()

    Promise.allSettled([
      getMonthlySummary(month, year),
      getCategories(month, year),
    ])
      .then(([sumRes, catRes]) => {
        if (sumRes.status === 'fulfilled' && sumRes.value) {
          setSummary(sumRes.value)
        }
        if (catRes.status === 'fulfilled' && Array.isArray(catRes.value) && catRes.value.length > 0) {
          setCategories(catRes.value)
        } else {
          setCategories([])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const totalSpent = Number(summary?.total_spent ?? 0)
  const receiptCount = Number(summary?.receipt_count ?? 0)
  const avgPerReceipt = Number(
    summary?.avg_per_receipt ?? (receiptCount ? totalSpent / receiptCount : 0)
  )
  const dailyAverage = Math.round(totalSpent / daysPassed)

  // Find top category
  const topCategory = categories.length > 0
    ? [...categories].sort((a, b) => (b.total || 0) - (a.total || 0))[0]
    : null

  return (
    <div className="page-inner" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Spending Analytics</h2>
          <p style={styles.subtitle}>Financial insights &amp; category breakdown</p>
        </div>
        <span style={styles.monthBadge}>{currentMonthName}</span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="spinner" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Key Metrics Grid */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>TOTAL SPENT</span>
              <h3 style={styles.statValue} className="tabular-nums">{formatINR(totalSpent)}</h3>
              <span style={styles.statSub}>Full month tracking</span>
            </div>

            <div style={styles.statCard}>
              <span style={styles.statLabel}>RECEIPTS</span>
              <h3 style={styles.statValue} className="tabular-nums">{receiptCount}</h3>
              <span style={styles.statSub}>Digitized documents</span>
            </div>

            <div style={styles.statCard}>
              <span style={styles.statLabel}>AVG / RECEIPT</span>
              <h3 style={styles.statValue} className="tabular-nums">{formatINR(avgPerReceipt)}</h3>
              <span style={styles.statSub}>Per transaction</span>
            </div>
          </div>


          {/* Category Breakdown Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Category Breakdown</h3>
              <span style={styles.categoryCountBadge}>{categories.length} Categories</span>
            </div>

            <div style={styles.categoryList}>
              {categories.map((c) => {
                const color = CATEGORY_COLORS[c.category] || CATEGORY_COLORS.Others
                const pct = Math.round(c.percentage || 0)

                return (
                  <div key={c.category} style={styles.categoryItem}>
                    <div style={styles.categoryRowTop}>
                      <div style={styles.catLeft}>
                        <div style={{ ...styles.colorDot, backgroundColor: color }} />
                        <span style={styles.catName}>{c.category}</span>
                      </div>
                      <div style={styles.catRight}>
                        <span style={styles.catTotal} className="tabular-nums">{formatINR(c.total)}</span>
                        <span style={styles.catPct} className="tabular-nums">{pct}%</span>
                      </div>
                    </div>

                    {/* Progress Bar Track */}
                    <div style={styles.progressTrack}>
                      <div
                        style={{
                          ...styles.progressBar,
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
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
  monthBadge: {
    backgroundColor: 'rgba(11, 107, 90, 0.12)',
    color: 'var(--accent-dark)',
    border: '1px solid var(--border-cream)',
    fontSize: '11.5px',
    fontWeight: '600',
    padding: '4px 12px',
    borderRadius: '9999px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  statCard: {
    backgroundColor: 'var(--surface-cream)',
    borderRadius: '24px',
    padding: '16px 14px',
    border: '1px solid var(--border-cream)',
    boxShadow: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statLabel: {
    fontSize: '9.5px',
    fontWeight: '700',
    color: 'var(--text-muted-cream)',
    letterSpacing: '0.05em',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: '600',
    fontFamily: 'var(--font-serif)',
    color: 'var(--text-on-cream)',
    letterSpacing: '-0.3px',
  },
  statSub: {
    fontSize: '10.5px',
    color: 'var(--text-muted-cream)',
    fontWeight: '400',
  },
  card: {
    backgroundColor: 'var(--surface-cream)',
    borderRadius: '24px',
    padding: '22px 20px',
    border: '1px solid var(--border-cream)',
    boxShadow: 'none',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    fontFamily: 'var(--font-serif)',
    color: 'var(--text-on-cream)',
  },
  categoryCountBadge: {
    fontSize: '11px',
    color: 'var(--text-muted-cream)',
    backgroundColor: 'var(--bg-cream)',
    border: '1px solid var(--border-cream)',
    padding: '3px 10px',
    borderRadius: '9999px',
    fontWeight: '600',
  },
  categoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  categoryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  categoryRowTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  colorDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  catName: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-on-cream)',
  },
  catRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  catTotal: {
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'var(--font-serif)',
    color: 'var(--text-on-cream)',
  },
  catPct: {
    fontSize: '11.5px',
    fontWeight: '600',
    color: 'var(--text-muted-cream)',
    minWidth: '28px',
    textAlign: 'right',
  },
  progressTrack: {
    width: '100%',
    height: '6px',
    backgroundColor: 'var(--olive-track)',
    borderRadius: '9999px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: '9999px',
    transition: 'width 0.3s ease',
  },
}
