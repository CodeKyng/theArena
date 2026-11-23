import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, HelpCircle, LogOut, Settings, Sparkles, User } from 'lucide-react'
import { useArena } from '../app/arenaContext'

export default function AccountMenu({
  variant = 'sidebar',
  onNavigate,
}: {
  variant?: 'sidebar' | 'topbar'
  onNavigate?: () => void
}) {
  const { currentMember, signOut } = useArena()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const openFocusTargetRef = useRef<'first' | 'last'>('first')

  const focusMenuItemAt = (index: number) => {
    const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')
    if (!items || items.length === 0) return
    const clamped = ((index % items.length) + items.length) % items.length
    items[clamped]?.focus()
  }

  useEffect(() => {
    if (!open) return
    focusMenuItemAt(openFocusTargetRef.current === 'last' ? -1 : 0)
    const onPointerDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open])

  if (!currentMember) return null

  const handleTriggerKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      openFocusTargetRef.current = 'first'
      if (!open) {
        setOpen(true)
      } else {
        focusMenuItemAt(0)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      openFocusTargetRef.current = 'last'
      if (!open) {
        setOpen(true)
      } else {
        focusMenuItemAt(-1)
      }
    }
  }

  const handleMenuKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
    if (items.length === 0) return
    const currentIndex = items.indexOf(document.activeElement as HTMLElement)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      focusMenuItemAt(currentIndex >= 0 ? currentIndex + 1 : 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      focusMenuItemAt(currentIndex >= 0 ? currentIndex - 1 : items.length - 1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      focusMenuItemAt(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      focusMenuItemAt(items.length - 1)
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  const closeAndNavigate = () => {
    setOpen(false)
    onNavigate?.()
  }

  return (
    <div
      className={variant === 'topbar' ? 'account-menu-wrap topbar-account-wrap' : 'account-menu-wrap'}
      ref={wrapRef}
    >
      {open && (
        <div
          ref={menuRef}
          className={
            variant === 'topbar'
              ? 'account-menu-popover account-menu-popover-topbar'
              : 'account-menu-popover'
          }
          role="menu"
          aria-label="Account menu"
          onKeyDown={handleMenuKeyDown}
        >
          <Link to="/profile" role="menuitem" className="account-menu-item" onClick={closeAndNavigate}>
            <User size={15} /> Profile
          </Link>
          <Link to="/personalization" role="menuitem" className="account-menu-item" onClick={closeAndNavigate}>
            <Sparkles size={15} /> Personalization
          </Link>
          <Link to="/settings" role="menuitem" className="account-menu-item" onClick={closeAndNavigate}>
            <Settings size={15} /> Settings
          </Link>
          <Link to="/help" role="menuitem" className="account-menu-item" onClick={closeAndNavigate}>
            <HelpCircle size={15} /> Help
          </Link>
          <div className="account-menu-divider" role="separator" />
          <button
            type="button"
            role="menuitem"
            className="account-menu-item account-menu-logout"
            onClick={() => {
              setOpen(false)
              onNavigate?.()
              signOut({ redirectTo: '/' })
            }}
          >
            <LogOut size={15} /> Log out
          </button>
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        className={
          variant === 'topbar'
            ? 'topbar-account-trigger'
            : 'profile-mini profile-mini-trigger'
        }
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        title="Account menu"
        onClick={() => {
          openFocusTargetRef.current = 'first'
          setOpen((prev) => !prev)
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        {variant === 'topbar' ? (
          <>
            <span className="avatar avatar-small" style={{ width: 26, height: 26, fontSize: 10 }}>
              {currentMember.avatarInitials}
            </span>
            <span className="topbar-account-name">{currentMember.displayName.split(' ')[0]}</span>
            <ChevronDown
              size={13}
              style={{
                transform: open ? 'rotate(180deg)' : 'none',
                transition: 'transform .15s ease',
              }}
            />
          </>
        ) : (
          <>
            <span className="avatar avatar-small">{currentMember.avatarInitials}</span>
            <span className="profile-mini-meta">
              <b>{currentMember.displayName}</b>
              <small>{currentMember.ascendancyRank}</small>
            </span>
            <ChevronDown
              size={14}
              style={{
                transform: open ? 'rotate(180deg)' : 'none',
                transition: 'transform .15s ease',
              }}
            />
          </>
        )}
      </button>
    </div>
  )
}
