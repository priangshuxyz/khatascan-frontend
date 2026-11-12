import React from 'react'

const CATEGORY_CONFIG = {
  Groceries: { color: '#00BFA5', label: 'Groceries' },
  Restaurant: { color: '#0B6B5A', label: 'Restaurant' },
  Utilities: { color: '#5FD3BC', label: 'Utilities' },
  Transport: { color: '#2E8B7A', label: 'Transport' },
  Others: { color: '#9BB5A8', label: 'Others' },
  Other: { color: '#9BB5A8', label: 'Others' },
}


function formatINR(val) {
  if (val === null || val === undefined) return '₹ 0'
  return '₹ ' + Math.round(val).toLocaleString('en-IN')
}

/* Precision SVG Doughnut Chart */
function DoughnutChart({ data, total }) {
  const size = 116
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius

  let accumulatedPct = 0

  return (
    <div style={styles.chartContainer}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        {data.map((item, index) => {
          const pct = (item.percentage || 0) / 100
          const strokeDash = pct * circumference
          const color = (CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.Others).color
          const offset = - accumulatedPct * circumference
          accumulatedPct += pct

          return (
            <circle
              key={item.category || index}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
            />
          )
        })}
      </svg>

      {/* Centered Total Label */}
      <div style={styles.centerBadge}>
        <span style={styles.centerSub}>TOTAL</span>
        <span style={styles.centerTotal} className="tabular-nums">{formatINR(total)}</span>
      </div>
    </div>
  )
}

export default function MoneyGoesCard({ data, loading = false }) {
  const categories = Array.isArray(data) ? data : []
  const totalSpend = categories.reduce((sum, item) => sum + (item.total || 0), 0)

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <h3 style={styles.title}>Where Your Money Goes</h3>
          <p style={styles.subtitle}>Category spending breakdown</p>
        </div>
        <span style={styles.badge}>Monthly</span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px 0' }}>
          <div className="skeleton" style={{ width: '116px', height: '116px', borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton" style={{ width: '100%', height: '14px' }} />
            ))}
          </div>
        </div>
      ) : (
        <div style={styles.contentRow}>
          {/* Doughnut Chart */}
          <div style={styles.chartCol}>
            <DoughnutChart data={categories} total={totalSpend} />
          </div>

          {/* Category List */}
          <div style={styles.legendCol}>
            {categories.map((item) => {
              const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.Others
              return (
                <div key={item.category} style={styles.legendRow}>
                  <div style={styles.catLeft}>
                    <div style={{ ...styles.colorDot, backgroundColor: cfg.color }} />
                    <span style={styles.catName}>{cfg.label}</span>
                  </div>

                  <div style={styles.catRight}>
                    <span style={styles.catAmount} className="tabular-nums">{formatINR(item.total)}</span>
                    <span style={styles.catPercent} className="tabular-nums">{Math.round(item.percentage)}%</span>
                  </div>
                </div>
              )
            })}
          </div>
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
    marginBottom: '16px',
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
  badge: {
    backgroundColor: 'var(--bg-cream)',
    color: 'var(--text-muted-cream)',
    border: '1px solid var(--border-cream)',
    fontSize: '11px',
    fontWeight: '600',
    padding: '3px 10px',
    borderRadius: '9999px',
  },
  contentRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  chartCol: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    position: 'relative',
    width: '116px',
    height: '116px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBadge: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  centerSub: {
    fontSize: '9px',
    fontWeight: '700',
    letterSpacing: '0.06em',
    color: 'var(--text-muted-cream)',
    marginBottom: '1px',
  },
  centerTotal: {
    fontSize: '15px',
    fontWeight: '600',
    fontFamily: 'var(--font-serif)',
    color: 'var(--text-on-cream)',
    letterSpacing: '-0.3px',
  },
  legendCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '9px',
    minWidth: 0,
  },
  legendRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
  },
  colorDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  catName: {
    fontSize: '12.5px',
    fontWeight: '500',
    color: 'var(--text-on-cream)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  catRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  catAmount: {
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'var(--font-serif)',
    color: 'var(--text-on-cream)',
  },
  catPercent: {
    fontSize: '11.5px',
    fontWeight: '500',
    color: 'var(--text-muted-cream)',
    minWidth: '28px',
    textAlign: 'right',
  },
}
