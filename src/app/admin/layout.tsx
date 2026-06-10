import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/auth/signin')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#fafafe]">
      <Navbar role={session.user.role} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}