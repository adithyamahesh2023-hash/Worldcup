'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Team = { id: string; name: string; code: string; flagUrl: string | null }
type ProfileData = {
  name: string
  email: string
  championTeamId: string | null
  championTeam: Team | null
}

export default function ProfilePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [championTeam, setChampionTeam] = useState<Team | null>(null)
  const [championLocked, setChampionLocked] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [championMsg, setChampionMsg] = useState('')
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then((r) => r.json()),
      fetch('/api/admin/teams').then((r) => r.json()),
    ]).then(([profile, allTeams]) => {
      const data = profile as ProfileData
      setName(data.name || '')
      setEmail(data.email || '')
      setChampionTeam(data.championTeam)
      setChampionLocked(!!data.championTeamId)
      setTeams(allTeams || [])
    })
  }, [])

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setMessage('')
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    setSaving(false)
    if (!res.ok) { setMessage('Failed to save'); return }
    setMessage('Saved!')
    router.refresh()
  }

  async function confirmChampion() {
    if (!selectedTeamId) return
    setChampionMsg('')
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ championTeamId: selectedTeamId }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json()
      setChampionMsg(data.error || 'Failed')
      return
    }
    const data = await res.json()
    setChampionTeam(data.championTeam)
    setChampionLocked(true)
    setConfirming(false)
    setChampionMsg(`Locked in! You picked ${data.championTeam.name}`)
    router.refresh()
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      {/* Name section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-bg rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-sm text-gray-400">{email}</p>
          </div>
        </div>

        <form onSubmit={handleSaveName} className="card p-6">
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Display Name</label>
          <p className="text-xs text-gray-400 mb-3">Shows on the leaderboard.</p>
          <input
            type="text"
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="Your nickname"
            required
          />
          <div className="mt-4 flex items-center gap-3">
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? 'Saving...' : 'Save'}
            </button>
            {message && <span className="text-sm text-green-600">{message}</span>}
          </div>
        </form>
      </div>

      {/* Champion pick section */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🏆</span>
          <h2 className="text-lg font-bold text-gray-900">Champion Pick</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4">Who will win the World Cup? This pick is permanent once confirmed.</p>

        {championLocked && championTeam ? (
          <div className="flex items-center gap-4 p-4 bg-primary-bg rounded-xl">
            {championTeam.flagUrl && (
              <img src={championTeam.flagUrl} alt="" className="w-14 h-10 rounded-md object-cover border border-gray-100" />
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900">{championTeam.name}</p>
              <p className="text-xs text-primary font-medium">Your champion pick — locked</p>
            </div>
          </div>
        ) : confirming ? (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Select your champion</label>
            <p className="text-xs text-gray-400 mb-3">This cannot be changed later.</p>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="input-field mb-3"
            >
              <option value="">Choose a team...</option>
              {teams
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={confirmChampion}
                disabled={saving || !selectedTeamId}
                className="btn-primary text-sm"
              >
                {saving ? 'Confirming...' : 'Confirm — This is final'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="btn-ghost text-gray-500 hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
            </div>
            {championMsg && <p className="text-sm text-green-600 mt-2">{championMsg}</p>}
          </div>
        ) : (
          <div>
            <button
              onClick={() => setConfirming(true)}
              className="btn-primary text-sm"
            >
              Pick Your Champion
            </button>
          </div>
        )}

        {championLocked && !confirming && (
          <p className="text-xs text-gray-400 mt-3 italic">You cannot change your champion pick after confirming.</p>
        )}
      </div>
    </div>
  )
}
