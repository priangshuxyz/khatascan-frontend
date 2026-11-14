import React, { useState, useEffect } from 'react'
import { getMonthlySummary, getCategories } from '../api/analytics.js'
import { categoryTheme } from '../constants/categories.js'

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
  const now = new Date()
  const thisMonth = now.getMonth() + 1
  const thisYear = now.getFullYear()

  // The month being viewed (starts on the current one)
  const [month, setMonth] = useState(thisMonth)
  const [year, setYear] = useState(thisYear)

  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const monthLabel = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })
  const isCurrentMonth = month === thisMonth && year === thisYear
  const atLatest = year > thisYear || (year === thisYear && month >= thisMonth)
  const atEarliest = year <= 2020 && month <= 1 // the server only keeps stats from 2020

  // Days to divide by for "per day": the days so far this month, or the whole month for past ones
  const daysCounted = isCurrentMonth ? now.getDate() || 1 : new Date(year, month, 0).getDate()

  const years = Array.from({ length: thisYear - 2019 }, (_, i) => thisYear - i)
  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i, 1).toLocaleString('en-US', { month: 'long' })
  )

  function shiftMonth(delta) {
    let m = month + delta
    let y = year
    if (m < 1) { m = 12; y -= 1 }
    if (m > 12) { m = 1; y += 1 }
    setMonth(m)
    setYear(y)
  }

  function chooseYear(y) {
    setYear(y)
    if (y === thisYear && month > thisMonth) setMonth(thisMonth) // no future months
  }

  useEffect(() => {
    let cancelled = false // ignore a slow answer if the user already moved to another month
    setLoading(true)
    setError(null)

    Promise.allSettled([getMonthlySummary(month, year), getCategories(month, year)]).then(
      ([sumRes, catRes]) => {
        if (cancelled) return
        if (sumRes.status === 'rejected' && catRes.status === 'rejected') {
          setError('Could not load analytics. Please check your connection and try again.')
          setSummary(null)
          setCategories([])
        } else {
          setSummary(sumRes.status === 'fulfilled' ? sumRes.value : null)
          setCategories(
            catRes.status === 'fulfilled' && Array.isArray(catRes.value) ? catRes.value : []
          )
        }
        setLoading(false)
      }
    )
    return () => {
      cancelled = true
    }
  }, [month, year, reloadKey])

  const totalSpent = Number(summary?.total_spent ?? 0)
  const receiptCount = Number(summary?.receipt_count ?? 0)
  const avgPerReceipt = Number(
    summary?.avg_per_receipt ?? (receiptCount ? totalSpent / receiptCount : 0)
  )
  const previousTotal = Number(summary?.previous_month_total ?? 0)
  const dailyAverage = Math.round(totalSpent / daysCounted)

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
        <span style={styles.monthBadge}>{monthLabel}</span>
      </div>

      {/* Month picker: arrows step one month, the dropdowns jump anywhere */}
      <div style={styles.picker}>
        <button style={{ ...styles.arrowBtn, opacity: atEarliest ? 0.35 : 1 }} onClick={() => shiftMonth(-1)} disabled={atEarliest} aria-label="Previous month">
          ‹
        </button>
        <select className="form-input" style={styles.select} value={month} onChange={(e) => setMonth(Number(e.target.value))} aria-label="Month">
          {monthNames.map((name, i) => (
            <option key={name} value={i + 1} disabled={year === thisYear && i + 1 > thisMonth}>
              {name}
            </option>
          ))}
        </select>
        <select className="form-input" style={{ ...styles.select, flex: '0 0 92px' }} value={year} onChange={(e) => chooseYear(Number(e.target.value))} aria-label="Year">
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button style={{ ...styles.arrowBtn, opacity: atLatest ? 0.35 : 1 }} onClick={() => shiftMonth(1)} disabled={atLatest} aria-label="Next month">
          ›
        </button>
      </div>
      {!isCurrentMonth && (
        <button style={styles.todayBtn} onClick={() => { setMonth(thisMonth); setYear(thisYear) }}>
          Back to this month
        </button>
      )}

      {error && (
        <div style={styles.errorBox}>
          {error}{' '}
          <button style={styles.retryBtn} onClick={() => setReloadKey((k) => k + 1)}>Retry</button>
        </div>
      )}

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
              <span style={styles.statSub}>{previousTotal > 0 ? `Last month ${formatINR(previousTotal)}` : isCurrentMonth ? 'This month so far' : 'Whole month'}</span>
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

            {categories.length === 0 && (
              <p style={styles.emptyText}>No spending recorded for {monthLabel}.</p>
            )}
            <div style={styles.categoryList}>
              {categories.map((c) => {
                const color = categoryTheme(c.category).color
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
  picker: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' },
  arrowBtn: {
    width: '40px', height: '40px', flex: '0 0 40px', borderRadius: '9999px',
    border: '1px solid var(--border-cream)', backgroundColor: 'var(--surface-cream)',
    color: 'var(--text-on-cream)', fontSize: '22px', lineHeight: 1, cursor: 'pointer',
  },
  select: { flex: 1, minWidth: 0, height: '40px', padding: '0 14px' },
  todayBtn: {
    background: 'none', border: 'none', color: 'var(--accent-dark)', fontWeight: '600',
    fontSize: '12.5px', cursor: 'pointer', padding: '0 0 12px 4px',
  },
  errorBox: {
    backgroundColor: 'rgba(229,115,106,0.14)', border: '1px solid rgba(229,115,106,0.4)',
    borderRadius: '14px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#9C2F26',
  },
  retryBtn: { background: 'none', border: 'none', color: 'var(--accent-dark)', fontWeight: '700', cursor: 'pointer', padding: 0 },
  emptyText: { fontSize: '13px', color: 'var(--text-muted-cream)', padding: '4px 0 8px' },
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
