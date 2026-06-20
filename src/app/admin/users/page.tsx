'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Team = { id: string; name: string; code: string; flagUrl: string | null }
type Match = {
  id: string; team1: Team; team2: Team; team1Score: number | null; team2Score: number | null
  team1Penalties: number | null; team2Penalties: number | null
  matchDate: string; stage: string; group: string | null; status: string; visible: boolean
}
type User = {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  championTeamId: string | null
  championTeam: Team | null
}

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Group Stage', ROUND_OF_32: 'Round of 32', ROUND_OF_16: 'Round of 16',
  QUARTER_FINALS: 'Quarter-finals', SEMI_FINALS: 'Semi-finals', FINAL: 'Final', THIRD_PLACE: '3rd Place',
}

function isKnockout(stage: string) { return stage !== 'GROUP_STAGE' }

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [message, setMessage] = useState('')
  const [savingChamp, setSavingChamp] = useState<string | null>(null)
  const [pickingChamp, setPickingChamp] = useState<string | null>(null)

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [userPredicted, setUserPredicted] = useState<Set<string>>(new Set())
  const [predForm, setPredForm] = useState<Record<string, { t1: string; t2: string; penaltyWinner: string }>>({})
  const [savingPreds, setSavingPreds] = useState(false)

  useEffect(() => { Promise.all([fetchUsers(), fetchTeams()]) }, [])

  async function fetchUsers() {
    const res = await fetch('/api/admin/users')
    setUsers(await res.json())
    setLoading(false)
  }
  async function fetchTeams() {
    const res = await fetch('/api/admin/teams')
    setTeams(await res.json())
  }

  async function addUser() {
    if (!newName.trim()) return
    setMessage('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    if (!res.ok) { setMessage('Failed to add user'); return }
    setNewName('')
    setMessage('User added!')
    fetchUsers()
    router.refresh()
  }

  async function deleteUser(id: string) {
    const user = users.find(u => u.id === id)
    if (!confirm(`Delete "${user?.name}" and all their predictions?`)) return
    const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { setMessage('Failed to delete'); return }
    fetchUsers()
    router.refresh()
  }

  async function setChampion(userId: string, championTeamId: string) {
    setSavingChamp(userId)
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, championTeamId: championTeamId || null }),
    })
    setSavingChamp(null)
    if (!res.ok) { setMessage('Failed to set champion'); return }
    fetchUsers()
    router.refresh()
  }

  async function openPredictions(user: User) {
    setSelectedUser(user)
    setPredForm({})
    const [matchRes, predRes] = await Promise.all([
      fetch('/api/admin/matches'),
      fetch(`/api/predictions?userId=${user.id}`),
    ])
    const allMatches: Match[] = await matchRes.json()
    const userPreds: { matchId: string }[] = await predRes.json()
    const predicted = new Set(userPreds.map(p => p.matchId))
    setUserPredicted(predicted)
    const upcoming = allMatches.filter(m => m.status !== 'FINISHED')
    setMatches(upcoming.sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()))
  }

  async function savePrediction(matchId: string) {
    const p = predForm[matchId]
    if (!p?.t1 || !p?.t2) return
    const s1 = Number(p.t1), s2 = Number(p.t2)
    const body: Record<string, string | number | null> = { matchId, userId: selectedUser!.id, team1Score: s1, team2Score: s2 }
    if (isKnockout(matches.find(m => m.id === matchId)!.stage) && s1 === s2 && p.penaltyWinner) {
      body.penaltyWinnerTeamId = p.penaltyWinner
    }
    await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setUserPredicted(prev => new Set(prev).add(matchId))
    setPredForm(prev => { const next = { ...prev }; delete next[matchId]; return next })
  }

  async function saveAllPredictions() {
    setSavingPreds(true)
    for (const m of matches) {
      if (userPredicted.has(m.id)) continue
      const p = predForm[m.id]
      if (!p?.t1 || !p?.t2) continue
      const s1 = Number(p.t1), s2 = Number(p.t2)
      const body: Record<string, string | number | null> = { matchId: m.id, userId: selectedUser!.id, team1Score: s1, team2Score: s2 }
      if (isKnockout(m.stage) && s1 === s2 && p.penaltyWinner) {
        body.penaltyWinnerTeamId = p.penaltyWinner
      }
      await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setUserPredicted(prev => new Set(prev).add(m.id))
    }
    setSavingPreds(false)
    setPredForm({})
  }

  function closeModal() {
    setSelectedUser(null)
    setMatches([])
    setUserPredicted(new Set())
    setPredForm({})
  }

  const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary-bg rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Players</h1>
          <p className="text-sm text-gray-400">Add players and set their champion pick</p>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100">
          {message}
        </div>
      )}

      <div className="card p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Add Player</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input-field"
              placeholder="Player name"
              maxLength={30}
              onKeyDown={(e) => e.key === 'Enter' && addUser()}
            />
          </div>
          <button onClick={addUser} disabled={!newName.trim()} className="btn-primary text-sm h-[38px]">
            Add Player
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-8">Loading...</p>
      ) : users.length === 0 ? (
        <div className="text-center py-12"><p className="text-gray-400">No players yet.</p></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Champion Pick</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <button onClick={() => openPredictions(user)} className="font-medium text-gray-900 hover:text-primary transition-colors text-left">
                      {user.name || 'Unnamed'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    {pickingChamp === user.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={user.championTeamId || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              setChampion(user.id, e.target.value)
                            } else {
                              setChampion(user.id, '')
                            }
                            setPickingChamp(null)
                          }}
                          disabled={savingChamp === user.id}
                          className="input-field text-xs py-1 px-2 max-w-[180px]"
                          autoFocus
                        >
                          <option value="">None</option>
                          {sortedTeams.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.code})
                            </option>
                          ))}
                        </select>
                        <button onClick={() => setPickingChamp(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                      </div>
                    ) : user.championTeam ? (
                      <div className="flex items-center gap-2">
                        {user.championTeam.flagUrl && (
                          <img src={user.championTeam.flagUrl} alt="" className="w-7 h-5 rounded-sm object-cover border border-gray-100" />
                        )}
                        <span className="text-sm font-medium text-gray-800">{user.championTeam.name}</span>
                        <button
                          onClick={() => setPickingChamp(user.id)}
                          className="text-gray-400 hover:text-primary transition-colors ml-1"
                          title="Change champion"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setPickingChamp(user.id)}
                        className="btn-ghost text-primary hover:bg-primary-bg text-xs py-1 px-2 flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Set Champion
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {user.role === 'ADMIN' ? (
                      <span className="badge bg-primary-bg text-primary">Admin</span>
                    ) : (
                      <span className="badge bg-gray-50 text-gray-500">Player</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => deleteUser(user.id)} className="btn-danger text-sm">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-gray-50 text-xs text-gray-400">
            {users.length} total
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Predictions — {selectedUser.name || 'Unnamed'}
                </h3>
                <p className="text-xs text-gray-400">Upcoming matches without predictions</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="space-y-3">
              {matches.filter(m => !userPredicted.has(m.id)).length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">This player has predicted all upcoming matches.</p>
              ) : (
                matches.filter(m => !userPredicted.has(m.id)).map((m) => {
                  const p = predForm[m.id] || { t1: '', t2: '', penaltyWinner: '' }
                  const knockout = isKnockout(m.stage)
                  const scoresAreEqual = p.t1 !== '' && p.t2 !== '' && Number(p.t1) === Number(p.t2)
                  return (
                    <div key={m.id} className="flex flex-col gap-2 p-3 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-700 block truncate">{m.team1.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number" min="0" max="20"
                            className="w-11 h-9 text-center input-field text-sm font-medium hide-spinner"
                            inputMode="numeric"
                            value={p.t1}
                            onChange={(e) => setPredForm({ ...predForm, [m.id]: { t1: e.target.value, t2: p.t2, penaltyWinner: p.penaltyWinner } })}
                          />
                          <span className="text-gray-300 text-xs font-medium">:</span>
                          <input
                            type="number" min="0" max="20"
                            className="w-11 h-9 text-center input-field text-sm font-medium hide-spinner"
                            inputMode="numeric"
                            value={p.t2}
                            onChange={(e) => setPredForm({ ...predForm, [m.id]: { t1: p.t1, t2: e.target.value, penaltyWinner: p.penaltyWinner } })}
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <span className="text-sm font-medium text-gray-700 block truncate">{m.team2.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs text-gray-400">
                          {STAGE_LABELS[m.stage] || m.stage}{m.group ? ` · Group ${m.group}` : ''} · {new Date(m.matchDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} {new Date(m.matchDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
                        </span>
                        <div className="flex items-center gap-2">
                          {knockout && scoresAreEqual && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-400">Pens:</span>
                              {[m.team1, m.team2].map(t => (
                                <button
                                  key={t.id}
                                  onClick={() => setPredForm({ ...predForm, [m.id]: { ...p, penaltyWinner: t.id } })}
                                  className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                                    p.penaltyWinner === t.id
                                      ? 'bg-primary-bg border-primary text-primary font-medium'
                                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                  }`}
                                >
                                  {t.code}
                                </button>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() => savePrediction(m.id)}
                            disabled={!p.t1 || !p.t2}
                            className="btn-primary text-xs py-1 px-3"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {matches.filter(m => !userPredicted.has(m.id)).length > 0 && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={saveAllPredictions}
                  disabled={savingPreds}
                  className="btn-primary text-sm"
                >
                  {savingPreds ? 'Saving...' : 'Save All Predictions'}
                </button>
                <button
                  onClick={() => {
                    const cleared: Record<string, { t1: string; t2: string; penaltyWinner: string }> = {}
                    for (const m of matches) {
                      if (!userPredicted.has(m.id)) cleared[m.id] = { t1: '', t2: '', penaltyWinner: '' }
                    }
                    setPredForm(cleared)
                  }}
                  className="btn-ghost text-red-500 hover:bg-red-50 text-sm"
                >
                  Clear
                </button>
                <button onClick={closeModal} className="btn-ghost text-gray-500 hover:bg-gray-50 text-sm">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
