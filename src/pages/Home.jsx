import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ScanReceiptCard from '../components/ScanReceiptCard.jsx'
import TotalExpensesCard from '../components/TotalExpensesCard.jsx'
import MoneyGoesCard from '../components/MoneyGoesCard.jsx'
import RecentReceipts from '../components/RecentReceipts.jsx'
import { getMonthlySummary, getCategories } from '../api/analytics.js'
import { listReceipts } from '../api/receipts.js'
import { useAuth, getInitials } from '../context/AuthContext.jsx'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)

  const displayName = user?.name || user?.username || ''
  const initials = getInitials(displayName)

  useEffect(() => {
    const today = new Date()
    const month = today.getMonth() + 1
    const year = today.getFullYear()

    Promise.allSettled([
      getMonthlySummary(month, year),
      getCategories(month, year),
      listReceipts({ page: 1, per_page: 5, sort_by: 'created_at', order: 'desc' }),
    ])
      .then(([summaryRes, catRes, receiptsRes]) => {
        if (summaryRes.status === 'fulfilled' && summaryRes.value) {
          setSummary(summaryRes.value)
        }
        if (catRes.status === 'fulfilled') {
          const categoryData = catRes.value

          const categoryList = Array.isArray(categoryData)
            ? categoryData
            : categoryData?.categories || []

          setCategories(categoryList)
        }
        if (receiptsRes.status === 'fulfilled' && receiptsRes.value?.items) {
          setReceipts(receiptsRes.value.items)
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // If backend summary total is 0, use the reference ₹12,450
  const totalSpent = Number(summary?.total_spent ?? 0)

  return (
    <div className="page-inner" style={styles.container}>
      {/* App Header */}
      <header style={styles.header}>
        <div style={styles.headerBrand}>
          <div style={styles.brandIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-dark)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3.5h12v17l-2.2-1.5-1.8 1.5-2-1.5-2 1.5-1.8-1.5L6 20.5v-17z" />
              <path d="M9 8h6M9 12h6M9 16h4" />
            </svg>
          </div>
          <div style={styles.headerTitles}>
            <h1 style={styles.brandTitle}>Home</h1>
          </div>
        </div>

        {/* Profile Avatar "PC" */}
        <div
          style={styles.avatarWrapper}
          onClick={() => navigate('/settings')}
          role="button"
          tabIndex={0}
          title="Account Settings"
        >
          <div style={styles.avatarCircle}>
            <span style={styles.avatarInitials}>{initials || 'U'}</span>
          </div>
        </div>
      </header>

      {/* Main Dashboard Cards */}
      <TotalExpensesCard total={totalSpent} loading={loading} />
      <ScanReceiptCard />
      <MoneyGoesCard data={categories} loading={loading} />
      <RecentReceipts receipts={receipts} loading={loading} />
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
  headerBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  brandIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    backgroundColor: 'var(--surface-cream)',
    border: '1px solid var(--border-cream)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitles: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandTitle: {
    fontSize: '22px',
    fontWeight: '600',
    fontFamily: 'var(--font-serif)',
    color: 'var(--text-on-cream)',
    letterSpacing: '-0.3px',
    lineHeight: '1.2',
  },
  brandSubtitle: {
    fontSize: '12px',
    color: 'var(--text-muted-cream)',
    fontWeight: '400',
    marginTop: '1px',
  },
  avatarWrapper: {
    position: 'relative',
    display: 'inline-block',
    cursor: 'pointer',
  },
  avatarCircle: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: 'var(--surface-cream)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border-cream)',
    transition: 'border-color 0.15s ease',
  },
  avatarInitials: {
    color: 'var(--accent-dark)',
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '0.02em',
  },
}
