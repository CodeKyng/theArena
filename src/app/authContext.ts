import { createContext, useContext } from 'react'

export type UserRole = 'member' | 'organization' | 'admin'

export type AuthUser = {
  id: string
  email: string
  name: string
  role: UserRole
  onboardingComplete: boolean
  focus?: string
}

export type AuthContextValue = {
  user: AuthUser | null
  signIn: (email: string, password: string) => Promise<AuthUser>
  signInDemo: (role: UserRole) => AuthUser
  register: (email: string, name: string, password: string, role: Exclude<UserRole, 'admin'>) => Promise<AuthUser>
  completeOnboarding: (name: string, focus: string) => AuthUser
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
