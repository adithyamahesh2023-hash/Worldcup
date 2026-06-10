'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

export default function Navbar({ role }: { role?: string }) {
  const pathname = usePathname()
  const isAdmin = role === 'ADMIN'

  const navItems = [
    { href: '/dashboard', label: 'Predictions' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/profile', label: 'Profile' },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-sm font-bold">WC</span>
              <span className="text-lg font-bold text-primary hidden sm:inline">World Cup Predictor</span>
            </Link>
            <div className="flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith(item.href) || (item.href === '/admin' && pathname.startsWith('/admin/'))
                      ? 'bg-primary-bg text-primary'
                      : 'text-gray-500 hover:text-primary hover:bg-primary-bg'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="px-3 py-2 text-sm text-gray-500 hover:text-primary hover:bg-primary-bg rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
}