import type { Page, User } from '../types'
import NavBar from '../components/NavBar'

interface Props {
  user: User
  onNavigate: (page: Page) => void
  onSignOut: () => void
}

interface Transaction {
  date: string
  description: string
  amount: string
  amountValue: number
  status: string
}

const TRANSACTIONS: Transaction[] = [
  { date: '2024-01-15', description: 'Coffee Shop',   amount: '$4.50',     amountValue: 4.50,    status: 'Completed' },
  { date: '2024-01-16', description: 'Grocery Store', amount: '$89.20',    amountValue: 89.20,   status: 'Completed' },
  { date: '2024-01-17', description: 'Netflix',        amount: '$15.99',    amountValue: 15.99,   status: 'Completed' },
  { date: '2024-01-18', description: 'Gas Station',   amount: '$52.31',    amountValue: 52.31,   status: 'Completed' },
  { date: '2024-01-19', description: 'Amazon',        amount: '$1,088.00', amountValue: 1088.00, status: 'Pending'   },
]

function formatTotal(transactions: Transaction[]): string {
  const total = transactions.reduce((sum, t) => sum + t.amountValue, 0)
  return '$' + total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function DashboardPage({ user, onNavigate, onSignOut }: Props) {
  const total = formatTotal(TRANSACTIONS)

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar currentPage="dashboard" onNavigate={onNavigate} onSignOut={onSignOut} />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Welcome back, {user.name}
        </h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Recent Transactions</h2>
          </div>

          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Date</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Description</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Amount</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {TRANSACTIONS.map((tx, i) => (
                <tr key={i} data-testid="transaction-row" className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">{tx.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{tx.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right font-mono">{tx.amount}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      tx.status === 'Completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr data-testid="transaction-total" className="bg-gray-50 font-semibold">
                <td className="px-6 py-4 text-sm text-gray-900" colSpan={2}>Total</td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right font-mono">{total}</td>
                <td className="px-6 py-4"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
