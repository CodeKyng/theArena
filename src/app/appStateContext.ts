import { createContext, useContext } from 'react'

export type AppState = {
  search: string
  setSearch: (value: string) => void
  flash: (message: string) => void
}

export const AppStateContext = createContext<AppState | null>(null)

export function useAppState() {
  const value = useContext(AppStateContext)
  if (!value) throw new Error('useAppState must be used inside AppStateProvider')
  return value
}
