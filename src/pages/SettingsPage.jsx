import React from 'react'
import { useAuth, getInitials } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const backendUrl = import.meta.env.VITE_API_URL || 'https://khatascan-backend-prod.onrender.com'
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const displayName = user?.name || user?.username || 'User'
  const initials = getInitials(displayName)

  function handleLogout() {
    logout()
    navigate('/signin', { replace: true })
  }

  return (
    <div className="page-inner" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Account &amp; Settings</h2>
        <p style={styles.subtitle}>Manage your profile and application preferences</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Profile Card */}
        <div style={styles.card}>
          <div style={styles.profileRow}>
            <div style={styles.avatarWrapper}>
              <div style={styles.avatarCircle}>
                <span style={styles.avatarInitials}>{initials}</span>
              </div>
            </div>
            <div style={styles.profileText}>
              <div style={styles.nameRow}>
                <h3 style={styles.profileName}>{displayName}</h3>
                <span style={styles.verifiedBadge}>Verified</span>
              </div>
              <p style={styles.profileRole}>Personal Expense Account</p>
            </div>
          </div>
        </div>

        {/* Financial Preferences Card */}
        <div style={styles.card}>
          <h3 style={styles.sectionHeading}>Financial Preferences</h3>

          <div style={styles.infoRow}>
            <div style={styles.iconKey}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted-cream)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span style={styles.infoKey}>Currency</span>
            </div>
            <span style={styles.infoValue}>INR (₹)</span>
          </div>

          <div style={styles.infoRow}>
            <div style={styles.iconKey}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted-cream)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span style={styles.infoKey}>Expense Cycle</span>
            </div>
            <span style={styles.infoValue}>Monthly (1st &ndash; End of Month)</span>
          </div>

          <div style={styles.infoRow}>
            <div style={styles.iconKey}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted-cream)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span style={styles.infoKey}>Data Export</span>
            </div>
            <span style={styles.exportLink}>
              CSV / Excel
            </span>
          </div>
        </div>

        {/* System & Connection Information Card */}
        <div style={styles.card}>
          <h3 style={styles.sectionHeading}>System &amp; Connection</h3>

          <div style={styles.infoRow}>
            <span style={styles.infoKey}>Application</span>
            <span style={styles.infoValue}>Khatascan</span>
          </div>

          <div style={styles.infoRow}>
            <span style={styles.infoKey}>Build Version</span>
            <span style={styles.infoValue}>1.0</span>
          </div>

          <div style={styles.infoRow}>
            <span style={styles.infoKey}>Backend API</span>
            <span style={styles.apiValue} title={backendUrl}>
              {backendUrl}
            </span>
          </div>

          <div style={styles.infoRow}>
            <span style={styles.infoKey}>OCR Intelligence</span>
            <span style={styles.infoValue}>Google Gemini Flash / RapidOCR</span>
          </div>

          <div style={{ ...styles.infoRow, borderBottom: 'none' }}>
            <span style={styles.infoKey}>Server Health</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={styles.statusDot} />
              <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--accent-dark)' }}>
                Operational
              </span>
            </div>
          </div>
        </div>
        {/* Log out */}
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Log out
        </button>
      </div>
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
  card: {
    backgroundColor: 'var(--surface-cream)',
    borderRadius: '24px',
    padding: '22px 20px',
    border: '1px solid var(--border-cream)',
    boxShadow: 'none',
  },
  profileRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  avatarWrapper: {
    position: 'relative',
    flexShrink: 0,
  },
  avatarCircle: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: 'var(--surface-cream)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1.5px solid var(--border-cream)',
  },
  avatarInitials: {
    color: 'var(--accent-dark)',
    fontSize: '16px',
    fontWeight: '700',
    letterSpacing: '0.02em',
  },
  profileText: {
    display: 'flex',
    flexDirection: 'column',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  profileName: {
    fontSize: '16px',
    fontWeight: '600',
    fontFamily: 'var(--font-serif)',
    color: 'var(--text-on-cream)',
  },
  verifiedBadge: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#04100C',
    backgroundColor: 'var(--accent)',
    padding: '2px 8px',
    borderRadius: '9999px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  profileRole: {
    fontSize: '12.5px',
    color: 'var(--text-muted-cream)',
    marginTop: '2px',
  },
  sectionHeading: {
    fontSize: '15px',
    fontWeight: '600',
    fontFamily: 'var(--font-serif)',
    color: 'var(--text-on-cream)',
    marginBottom: '8px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid var(--border-cream)',
    fontSize: '13px',
  },
  iconKey: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  infoKey: {
    color: 'var(--text-muted-cream)',
    fontWeight: '500',
  },
  infoValue: {
    fontWeight: '500',
    color: 'var(--text-on-cream)',
    textAlign: 'right',
  },
  exportLink: {
    fontWeight: '600',
    color: 'var(--accent-dark)',
    cursor: 'pointer',
    textAlign: 'right',
  },
  apiValue: {
    fontWeight: '500',
    color: 'var(--accent-dark)',
    maxWidth: '55%',
    textAlign: 'right',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent)',
    boxShadow: '0 0 6px rgba(0, 191, 165, 0.4)',
  },
  logoutBtn: {
    width: '100%',
    padding: '13px',
    borderRadius: '9999px',
    border: '1.5px solid var(--danger)',
    backgroundColor: 'transparent',
    color: 'var(--danger)',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    marginTop: '4px',
  },
}
