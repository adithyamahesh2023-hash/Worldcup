import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const adminLinks = [
    { href: '/admin/teams', label: 'Teams' },
    { href: '/admin/matches', label: 'Matches' },
    { href: '/admin/users', label: 'Players' },
  ]

  return (
    <div className="min-h-screen bg-[#fafafe]">
      <Navbar />
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-3 text-sm font-medium border-b-2 transition-colors border-transparent hover:border-primary hover:text-primary text-gray-500"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
