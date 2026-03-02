import type { Page } from '../types'

interface Props {
  currentPage: Page
  onNavigate: (page: Page) => void
  onSignOut: () => void
}

export default function NavBar({ currentPage, onNavigate, onSignOut }: Props) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <span className="text-lg font-bold text-blue-600">FinanceApp</span>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`text-sm font-medium px-3 py-1.5 rounded transition-colors ${
            currentPage === 'dashboard'
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onNavigate('settings')}
          className={`text-sm font-medium px-3 py-1.5 rounded transition-colors ${
            currentPage === 'settings'
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Settings
        </button>
        <button
          onClick={onSignOut}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded transition-colors"
        >
          Sign Out
        </button>
      </div>
    </nav>
  )
}
