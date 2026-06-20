'use client'

import { useEffect, useState } from 'react'

type UserProfile = {
  id: string
  name: string | null
  championTeamId: string | null
  championTeam: { id: string; name: string; code: string; flagUrl: string | null } | null
}

export default function ProfilePage() {
  const [users, setUsers] = useState<UserProfile[]>([])

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then(setUsers)
  }, [])

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-bg rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Players</h1>
          <p className="text-sm text-gray-400">All players in the league</p>
        </div>
      </div>

      <div className="card p-6">
        {users.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No players yet.</p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">{user.name || 'Unnamed'}</p>
                </div>
                {user.championTeam && (
                  <div className="flex items-center gap-2">
                    {user.championTeam.flagUrl && (
                      <img src={user.championTeam.flagUrl} alt="" className="w-8 h-6 rounded object-cover" />
                    )}
                    <span className="text-sm text-primary font-medium">{user.championTeam.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
