import { useState } from 'react'
import type { Page, User } from '../types'
import NavBar from '../components/NavBar'
import Toast from '../components/Toast'

interface Props {
  user: User
  onNavigate: (page: Page) => void
  onSignOut: () => void
}

export default function SettingsPage({ user, onNavigate, onSignOut }: Props) {
  const [darkMode, setDarkMode] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [displayName, setDisplayName] = useState(user.name)
  const [toast, setToast] = useState('')

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setToast('Settings saved successfully!')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar currentPage="settings" onNavigate={onNavigate} onSignOut={onSignOut} />

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        <form onSubmit={handleSave}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">

            {/* Dark Mode */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <label htmlFor="dark-mode-toggle" className="text-sm font-medium text-gray-900">
                  Dark Mode
                </label>
                <p className="text-xs text-gray-500 mt-0.5">Use a darker color scheme</p>
              </div>
              <input
                id="dark-mode-toggle"
                type="checkbox"
                data-testid="dark-mode-toggle"
                checked={darkMode}
                onChange={e => setDarkMode(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            {/* Email Notifications */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <label htmlFor="email-notifications-toggle" className="text-sm font-medium text-gray-900">
                  Email Notifications
                </label>
                <p className="text-xs text-gray-500 mt-0.5">Receive email updates</p>
              </div>
              <input
                id="email-notifications-toggle"
                type="checkbox"
                data-testid="email-notifications-toggle"
                checked={emailNotifications}
                onChange={e => setEmailNotifications(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            {/* Display Name */}
            <div className="px-6 py-4">
              <label htmlFor="display-name-input" className="block text-sm font-medium text-gray-900 mb-1">
                Display Name
              </label>
              <input
                id="display-name-input"
                type="text"
                data-testid="display-name-input"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              data-testid="save-settings"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </main>

      {toast && <Toast message={toast} onDismiss={() => setToast('')} />}
    </div>
  )
}
