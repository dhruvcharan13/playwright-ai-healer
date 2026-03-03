import { useState } from 'react'
import type { User } from '../types'

interface Props {
  onLogin: (user: User) => void
}

const VALID_EMAIL = 'test@example.com'
const VALID_PASSWORD = 'password123'

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (email === VALID_EMAIL && password === VALID_PASSWORD) {
      setError('')
      onLogin({ email, name: 'Test User' })
    } else {
      setError('Invalid email or password. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign In to FinanceApp</h1>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              data-testid="email-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="email"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              data-testid="password-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p
              data-testid="login-error"
              role="alert"
              className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            data-testid="login-submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
