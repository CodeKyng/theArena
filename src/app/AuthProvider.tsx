import { useState, type ReactNode } from 'react'
import { AuthContext, type AuthUser, type UserRole } from './authContext'

type Account = {
  email: string
  name: string
  role: Exclude<UserRole, 'admin'>
  salt: string
  passwordHash: string
}

const SESSION_KEY = 'arena.session.v1'
const ACCOUNTS_KEY = 'arena.accounts.v1'
const DEMO_USERS: Record<UserRole, AuthUser> = {
  member: { id: 'demo-member', email: 'builder@thearena.demo', name: 'Jordan Davis', role: 'member', onboardingComplete: true },
  organization: { id: 'demo-organization', email: 'studio@thearena.demo', name: 'Arena Studio', role: 'organization', onboardingComplete: true },
  admin: { id: 'demo-admin', email: 'admin@thearena.demo', name: 'Arena Admin', role: 'admin', onboardingComplete: true },
}

function readJson<T>(key: string, validate: (value: unknown) => value is T, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    const value: unknown = JSON.parse(raw)
    if (validate(value)) return value
    throw new Error(`Invalid ${key} data`)
  } catch (error) {
    console.error(`Could not restore ${key}; the stored value will be cleared.`, error)
    localStorage.removeItem(key)
    return fallback
  }
}

function isRole(value: unknown): value is UserRole {
  return value === 'member' || value === 'organization' || value === 'admin'
}

function isUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') return false
  const user = value as Partial<AuthUser>
  return typeof user.id === 'string' && typeof user.email === 'string' &&
    typeof user.name === 'string' && isRole(user.role) &&
    typeof user.onboardingComplete === 'boolean'
}

function isAccounts(value: unknown): value is Account[] {
  return Array.isArray(value) && value.every((item) => {
    if (!item || typeof item !== 'object') return false
    const account = item as Partial<Account>
    return typeof account.email === 'string' && typeof account.name === 'string' &&
      (account.role === 'member' || account.role === 'organization') &&
      typeof account.salt === 'string' && typeof account.passwordHash === 'string'
  })
}

function hashPassword(password: string, salt: string) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`))
    .then((hash) => Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join(''))
}

function getAccounts() {
  return readJson<Account[]>(ACCOUNTS_KEY, isAccounts, [])
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(() => readJson<AuthUser | null>(SESSION_KEY, (value): value is AuthUser | null => value === null || isUser(value), null))

  const saveUser = (nextUser: AuthUser) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
    return nextUser
  }

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    const account = getAccounts().find((candidate) => candidate.email === normalizedEmail)
    if (!account || await hashPassword(password, account.salt) !== account.passwordHash) {
      throw new Error('Email or password is incorrect.')
    }
    return saveUser({
      id: `user-${normalizedEmail}`,
      email: account.email,
      name: account.name,
      role: account.role,
      onboardingComplete: true,
    })
  }

  const signInDemo = (role: UserRole) => saveUser(DEMO_USERS[role])

  const register = async (email: string, name: string, password: string, role: Exclude<UserRole, 'admin'>) => {
    const normalizedEmail = email.trim().toLowerCase()
    const accounts = getAccounts()
    if (accounts.some((account) => account.email === normalizedEmail)) {
      throw new Error('An account with that email already exists. Sign in instead.')
    }
    const salt = crypto.randomUUID()
    const passwordHash = await hashPassword(password, salt)
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, { email: normalizedEmail, name: name.trim(), role, salt, passwordHash }]))
    return saveUser({
      id: `user-${normalizedEmail}`,
      email: normalizedEmail,
      name: name.trim(),
      role,
      onboardingComplete: false,
    })
  }

  const completeOnboarding = (name: string, focus: string) => {
    if (!user) throw new Error('Sign in before completing onboarding.')
    return saveUser({ ...user, name: name.trim() || user.name, focus, onboardingComplete: true })
  }

  const signOut = () => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  const value = { user, signIn, signInDemo, register, completeOnboarding, signOut }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
