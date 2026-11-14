import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const ACTIVE_COLOR = 'var(--accent-dark)'    // deep teal, same as badges and links
const INACTIVE_COLOR = '#8E8E93'  // grey

function HomeIcon({ active }) {
  const color = active ? ACTIVE_COLOR : INACTIVE_COLOR
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9.5z" />
      <path d="M9 22v-6a3 3 0 0 1 6 0v6" />
    </svg>
  )
}

function ReceiptsIcon({ active }) {
  const color = active ? ACTIVE_COLOR : INACTIVE_COLOR
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3.5h12v17l-2.2-1.5-1.8 1.5-2-1.5-2 1.5-1.8-1.5L6 20.5v-17z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </svg>
  )
}

function ScanCameraIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#04100C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function AnalyticsIcon({ active }) {
  const color = active ? ACTIVE_COLOR : INACTIVE_COLOR
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="3" y1="20" x2="21" y2="20" />
    </svg>
  )
}

function ProfileIcon({ active }) {
  const color = active ? ACTIVE_COLOR : INACTIVE_COLOR
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20c0-3.5 3.5-5.5 7-5.5s7 2 7 5.5" />
    </svg>
  )
}

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const regularTabs = [
    {
      id: 'home',
      label: 'Home',
      path: '/',
      isActive: pathname === '/',
      Icon: HomeIcon,
    },
    {
      id: 'receipts',
      label: 'Receipts',
      path: '/receipts',
      isActive: pathname.startsWith('/receipts'),
      Icon: ReceiptsIcon,
    },
  ]

  const scanTab = {
    id: 'scan',
    label: 'Scan',
    path: '/scan',
    isActive: pathname === '/scan',
  }

  const rightTabs = [
    {
      id: 'analytics',
      label: 'Analytics',
      path: '/analytics',
      isActive: pathname === '/analytics',
      Icon: AnalyticsIcon,
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/settings',
      isActive: pathname === '/settings',
      Icon: ProfileIcon,
    },
  ]

  const allTabs = [
    ...regularTabs,
    scanTab,
    ...rightTabs,
  ]

  return (
    <nav
      aria-label="Main Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '393px',
        backgroundColor: 'rgba(228, 228, 195, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-cream)',
        zIndex: 100,
        boxSizing: 'border-box',
      }}
    >
      {/* Tab Row */}
      <div
        style={{
          height: '63px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          padding: '0 4px 10px',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        {allTabs.map((tab) => {
          const isScan = tab.id === 'scan'

          if (isScan) {
            return (
              <button
                key="scan"
                onClick={() => navigate(scanTab.path)}
                aria-label="Scan receipt"
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0',
                  gap: '3px',
                  position: 'relative',
                }}
              >
                {/* Raised circle — lifted above the bar */}
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: scanTab.isActive ? 'var(--accent-strong)' : 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(0, 191, 165, 0.45)',
                    marginBottom: '2px',
                    marginTop: '-14px',
                    flexShrink: 0,
                    transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  <ScanCameraIcon />
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: scanTab.isActive ? '600' : '500',
                    color: scanTab.isActive ? ACTIVE_COLOR : INACTIVE_COLOR,
                    letterSpacing: '-0.1px',
                    lineHeight: '1.2',
                    fontFamily: 'inherit',
                  }}
                >
                  Scan
                </span>
              </button>
            )
          }

          const { Icon, isActive, label, path, id } = tab
          return (
            <button
              key={id}
              onClick={() => navigate(path)}
              aria-label={label}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
                gap: '3px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '28px',
                }}
              >
                <Icon active={isActive} />
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: isActive ? '600' : '500',
                  color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR,
                  letterSpacing: '-0.1px',
                  lineHeight: '1.2',
                  fontFamily: 'inherit',
                }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
