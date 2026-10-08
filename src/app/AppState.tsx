import { useMemo, useState, type ReactNode } from 'react'
import { AppStateContext } from './appStateContext'

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const flash = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  const value = useMemo(() => ({ search, setSearch, flash }), [search])
  return (
    <AppStateContext.Provider value={value}>
      {children}
      {toast && <div className="toast"><span aria-hidden="true">✓</span>{toast}</div>}
    </AppStateContext.Provider>
  )
}
