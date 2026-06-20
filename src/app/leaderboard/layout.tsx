import Navbar from '@/components/Navbar'

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#fafafe]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-26 py-8">
        {children}
      </main>
    </div>
  )
}
