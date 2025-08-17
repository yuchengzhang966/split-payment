import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PayHive - Split Expenses with Friends',
  description: 'Seamlessly split expenses among friends using PYUSD',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100" suppressHydrationWarning={true}>
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-blue-600">🐝 PayHive</h1>
            <p className="text-sm text-gray-600">Split expenses seamlessly</p>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}