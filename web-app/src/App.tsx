import { useState } from 'react'
import type { Page, User } from './types'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  const [page, setPage] = useState<Page>('login')
  const [user, setUser] = useState<User | null>(null)

  function handleLogin(loggedInUser: User) {
    setUser(loggedInUser)
    setPage('dashboard')
  }

  function handleSignOut() {
    setUser(null)
    setPage('login')
  }

  if (page === 'login') {
    return <LoginPage onLogin={handleLogin} />
  }

  if (!user) return null

  if (page === 'dashboard') {
    return (
      <DashboardPage
        user={user}
        onNavigate={setPage}
        onSignOut={handleSignOut}
      />
    )
  }

  return (
    <SettingsPage
      user={user}
      onNavigate={setPage}
      onSignOut={handleSignOut}
    />
  )
}
