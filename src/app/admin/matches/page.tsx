'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Team = { id: string; name: string; code: string; group: string | null }
type Match = {
  id: string; team1: Team; team2: Team; team1Score: number | null; team2Score: number | null
  team1Penalties: number | null; team2Penalties: number | null
  matchDate: string; stage: string; group: string | null; status: string; visible: boolean
}
type AppUser = { id: string; name: string | null }

function isKnockout(stage: string) { return stage !== 'GROUP_STAGE' }

const STAGES = ['GROUP_STAGE', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL', 'THIRD_PLACE']
const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Group Stage', ROUND_OF_32: 'Round of 32', ROUND_OF_16: 'Round of 16',
  QUARTER_FINALS: 'Quarter-finals', SEMI_FINALS: 'Semi-finals', FINAL: 'Final', THIRD_PLACE: '3rd Place',
}
const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']


function StageBadge({ stage }: { stage: string }) {
  const colors: Record<string, string> = {
    GROUP_STAGE: 'bg-primary-bg text-primary', ROUND_OF_32: 'bg-blue-50 text-blue-600',
    ROUND_OF_16: 'bg-blue-50 text-blue-600', QUARTER_FINALS: 'bg-amber-50 text-amber-600',
    SEMI_FINALS: 'bg-amber-50 text-amber-600', FINAL: 'bg-rose-50 text-rose-600',
    THIRD_PLACE: 'bg-gray-100 text-gray-600',
  }
  return <span className={`badge ${colors[stage] || 'bg-gray-100 text-gray-600'}`}>{STAGE_LABELS[stage] || stage}</span>
}

export default function AdminMatchesPage() {
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    team1Id: '', team2Id: '', stage: 'GROUP_STAGE', group: '', matchDate: '',
  })

  useEffect(() => { Promise.all([fetchMatches(), fetchTeams(), fetchUsers()]) }, [])

  async function fetchMatches() {
    const res = await fetch('/api/admin/matches')
    setMatches(await res.json())
    setLoading(false)
  }
  async function fetchTeams() {
    const res = await fetch('/api/admin/teams')
    setTeams(await res.json())
  }
  async function fetchUsers() {
    const res = await fetch('/api/admin/users')
    setUsers(await res.json())
  }

  function resetForm() {
    setForm({ team1Id: '', team2Id: '', stage: 'GROUP_STAGE', group: '', matchDate: '' })
    setEditingId(null)
  }

  function editMatch(match: Match) {
    const d = new Date(match.matchDate)
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    setForm({
      team1Id: match.team1.id, team2Id: match.team2.id,
      stage: match.stage, group: match.group || '', matchDate: local,
    })
    setEditingId(match.id)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.team1Id === form.team2Id) { alert('Teams must be different'); return }
    const res = await fetch('/api/admin/matches', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(editingId ? { id: editingId } : {}),
        team1Id: form.team1Id, team2Id: form.team2Id,
        matchDate: form.matchDate || null,
        stage: form.stage,
        group: form.group || null,
      }),
    })
    if (!res.ok) { alert((await res.json()).error || 'Failed to save'); return }
    resetForm()
    fetchMatches()
    router.refresh()
  }

  async function reopenMatch(matchId: string) {
    const res = await fetch('/api/admin/matches', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: matchId, status: 'SCHEDULED', team1Score: null, team2Score: null, team1Penalties: null, team2Penalties: null }),
    })
    if (!res.ok) { alert('Failed to reopen'); return }
    fetchMatches()
    router.refresh()
  }

  async function deleteMatch(id: string) {
    if (!confirm('Delete this match and all its predictions?')) return
    const res = await fetch(`/api/admin/matches?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { alert('Failed to delete'); return }
    fetchMatches()
    router.refresh()
  }

  const filteredTeams = form.stage === 'GROUP_STAGE' && form.group
    ? teams.filter(t => t.group === form.group)
    : teams

  const [predictionMatch, setPredictionMatch] = useState<Match | null>(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-bg rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Matches</h1>
            <p className="text-sm text-gray-400">{form.stage === 'GROUP_STAGE' && form.group ? `Group ${form.group} matches` : 'Create matches and enter results'}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">{editingId ? 'Edit Match' : 'New Match'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Team 1</label>
            <select required value={form.team1Id} onChange={(e) => setForm({ ...form, team1Id: e.target.value })} className="input-field">
              <option value="">{filteredTeams.length === 0 ? 'No teams in this group' : 'Select team'}</option>
              {filteredTeams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Team 2</label>
            <select required value={form.team2Id} onChange={(e) => setForm({ ...form, team2Id: e.target.value })} className="input-field">
              <option value="">{filteredTeams.length === 0 ? 'No teams in this group' : 'Select team'}</option>
              {filteredTeams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Date & Time</label>
            <input
              type="datetime-local"
              value={form.matchDate}
              onChange={(e) => setForm({ ...form, matchDate: e.target.value })}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Stage</label>
            <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="input-field">
              {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
            </select>
          </div>
          {form.stage === 'GROUP_STAGE' && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Group</label>
              <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value, team1Id: '', team2Id: '' })} className="input-field">
                <option value="">None</option>
                {GROUPS.map(g => <option key={g} value={g}>Group {g}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <button type="submit" className="btn-primary text-sm">{editingId ? 'Update Match' : 'Add Match'}</button>
          {editingId && <button type="button" onClick={resetForm} className="btn-ghost text-gray-500 hover:bg-gray-50">Cancel</button>}
        </div>
      </form>

      {loading ? (
        <p className="text-gray-400 text-center py-8">Loading...</p>
      ) : matches.length === 0 ? (
        <div className="text-center py-12"><p className="text-gray-400">No matches yet.</p></div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Match</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Stage</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Result</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                  {matches.map((match) => (
                    <tr key={match.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        {match.team1.name}
                        <span className="text-gray-300 mx-1.5">vs</span>
                        {match.team2.name}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(match.matchDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        <span className="text-gray-300 mx-1">·</span>
                        {new Date(match.matchDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <StageBadge stage={match.stage} />
                        {match.group && <span className="ml-1.5 text-xs text-gray-400">G{match.group}</span>}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {match.status === 'FINISHED' ? (
                          <span className="font-semibold text-gray-900">
                            {match.team1Score} : {match.team2Score}
                            {isKnockout(match.stage) && match.team1Penalties !== null && match.team2Penalties !== null && (
                              <span className="text-xs text-gray-400 ml-1">
                                (pens {match.team1Penalties}-{match.team2Penalties})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => editMatch(match)} className="btn-ghost text-primary hover:bg-primary-bg mr-1">Edit</button>
                        <button onClick={() => setPredictionMatch(match)} className="btn-ghost text-purple-600 hover:bg-purple-50 mr-1">Predictions</button>
                        {match.status === 'FINISHED' ? (
                          <button onClick={() => reopenMatch(match.id)}
                            className="btn-ghost text-amber-600 hover:bg-amber-50 mr-1">Reopen</button>
                        ) : null}
                        <button onClick={() => deleteMatch(match.id)} className="btn-danger">Delete</button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ResultEntrySection
            matches={matches.filter(m => m.status === 'SCHEDULED')}
            onSave={() => { fetchMatches(); router.refresh() }}
          />

          <PredictionSection
            match={predictionMatch}
            users={users}
            onClose={() => setPredictionMatch(null)}
            onSaved={() => { fetchMatches(); router.refresh() }}
          />
        </>
      )}
    </div>
  )
}

function ResultEntrySection({ matches, onSave }: { matches: Match[]; onSave: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [scores, setScores] = useState<Record<string, { t1: string; t2: string; p1: string; p2: string }>>({})

  async function saveAll() {
    for (const [id, s] of Object.entries(scores)) {
      if (!s.t1 || !s.t2) continue
      const body: Record<string, string | number | null> = { id, team1Score: Number(s.t1), team2Score: Number(s.t2), status: 'FINISHED' }
      if (s.p1 !== '' && s.p2 !== '') {
        body.team1Penalties = Number(s.p1)
        body.team2Penalties = Number(s.p2)
      }
      await fetch('/api/admin/matches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }
    onSave()
    setScores({})
    setExpanded(false)
  }

  return (
    <div className="mt-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="btn-primary text-sm"
      >
        {expanded ? 'Close' : `Enter Results (${matches.length} pending)`}
      </button>
      {expanded && (
        <div className="mt-4 card p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Enter Match Results</h3>
          <p className="text-sm text-gray-400 mb-4">Fill scores and save. Points auto-calculate for all users.</p>
          <div className="space-y-3">
            {matches.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="w-24 text-sm font-medium text-right text-gray-700 truncate">{m.team1.name}</span>
                <input
                  type="number" min="0" max="20"
                  className="w-12 h-9 text-center input-field text-sm font-medium"
                  value={scores[m.id]?.t1 ?? ''}
                  onChange={(e) => setScores({ ...scores, [m.id]: { t1: e.target.value, t2: scores[m.id]?.t2 ?? '', p1: scores[m.id]?.p1 ?? '', p2: scores[m.id]?.p2 ?? '' } })}
                />
                <span className="text-gray-300 font-medium">:</span>
                <input
                  type="number" min="0" max="20"
                  className="w-12 h-9 text-center input-field text-sm font-medium"
                  value={scores[m.id]?.t2 ?? ''}
                  onChange={(e) => setScores({ ...scores, [m.id]: { t1: scores[m.id]?.t1 ?? '', t2: e.target.value, p1: scores[m.id]?.p1 ?? '', p2: scores[m.id]?.p2 ?? '' } })}
                />
                <span className="w-24 text-sm font-medium text-gray-700 truncate">{m.team2.name}</span>
                {isKnockout(m.stage) && scores[m.id]?.t1 !== '' && scores[m.id]?.t2 !== '' && Number(scores[m.id]?.t1) === Number(scores[m.id]?.t2) && (
                  <div className="flex items-center gap-1.5 ml-2 text-xs text-gray-400">
                    <span className="text-gray-400">pens</span>
                    <input
                      type="number" min="0" max="20"
                      className="w-9 h-7 text-center input-field text-xs font-medium hide-spinner"
                      placeholder=""
                      value={scores[m.id]?.p1 ?? ''}
                      onChange={(e) => setScores({ ...scores, [m.id]: { t1: scores[m.id]?.t1 ?? '', t2: scores[m.id]?.t2 ?? '', p1: e.target.value, p2: scores[m.id]?.p2 ?? '' } })}
                    />
                    <span className="text-gray-300">:</span>
                    <input
                      type="number" min="0" max="20"
                      className="w-9 h-7 text-center input-field text-xs font-medium hide-spinner"
                      placeholder=""
                      value={scores[m.id]?.p2 ?? ''}
                      onChange={(e) => setScores({ ...scores, [m.id]: { t1: scores[m.id]?.t1 ?? '', t2: scores[m.id]?.t2 ?? '', p1: scores[m.id]?.p1 ?? '', p2: e.target.value } })}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={saveAll} className="btn-primary text-sm mt-4">
            Save All Results
          </button>
        </div>
      )}
    </div>
  )
}

function PredictionSection({
  match,
  users,
  onClose,
  onSaved,
}: {
  match: Match | null
  users: AppUser[]
  onClose: () => void
  onSaved: () => void
}) {
  const [predictions, setPredictions] = useState<Record<string, { t1: string; t2: string; penaltyWinner: string }>>({})
  const [existing, setExisting] = useState<Record<string, { team1Score: number; team2Score: number; penaltyWinnerTeamId: string | null } | null>>({})
  const [savingState, setSaving] = useState(false)

  useEffect(() => {
    if (!match) return
    fetch(`/api/predictions?matchId=${match.id}`)
      .then((r) => r.json())
      .then((data: { userId: string; team1Score: number; team2Score: number; penaltyWinnerTeamId: string | null }[]) => {
        const map: Record<string, { team1Score: number; team2Score: number; penaltyWinnerTeamId: string | null } | null> = {}
        for (const p of data) {
          map[p.userId] = p
        }
        setExisting(map)
      })
  }, [match])

  if (!match) return null

  const m = match
  const knockout = isKnockout(m.stage)

  async function saveAll() {
    setSaving(true)
    for (const user of users) {
      const p = predictions[user.id]
      if (!p?.t1 || !p?.t2) continue
      const body: Record<string, string | number | null> = { matchId: m.id, userId: user.id, team1Score: Number(p.t1), team2Score: Number(p.t2) }
      const s1 = Number(p.t1), s2 = Number(p.t2)
      if (knockout && s1 === s2 && p.penaltyWinner) {
        body.penaltyWinnerTeamId = p.penaltyWinner
      } else if (s1 !== s2) {
        body.penaltyWinnerTeamId = null
      }
      await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="mt-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">
              Predictions — {match.team1.name} vs {match.team2.name}
            </h3>
            <p className="text-xs text-gray-400">Enter scores for each player</p>
          </div>
          <button onClick={onClose} className="btn-ghost text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {users.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">No players yet. Add them in Manage Users.</p>
          )}
          {[...users].sort((a, b) => {
            const aHas = existing[a.id] ? 1 : 0
            const bHas = existing[b.id] ? 1 : 0
            return aHas - bHas
          }).map((u) => {
            const existingPred = existing[u.id]
            const p = predictions[u.id] || {
              t1: existingPred?.team1Score?.toString() ?? '',
              t2: existingPred?.team2Score?.toString() ?? '',
              penaltyWinner: existingPred?.penaltyWinnerTeamId ?? '',
            }
            const s1 = Number(p.t1), s2 = Number(p.t2)
            const scoresAreEqual = p.t1 !== '' && p.t2 !== '' && s1 === s2

            return (
              <div key={u.id} className="flex flex-col gap-2 py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-28 text-sm font-medium text-gray-700 truncate">{u.name || 'Player'}</span>
                  <input
                    type="number"
                    className="w-12 h-9 text-center input-field text-sm font-medium hide-spinner"
                    inputMode="numeric"
                    value={p.t1}
                    onChange={(e) =>
                      setPredictions((prev) => ({
                        ...prev,
                        [u.id]: { t1: e.target.value, t2: prev[u.id]?.t2 ?? existingPred?.team2Score?.toString() ?? '', penaltyWinner: prev[u.id]?.penaltyWinner ?? existingPred?.penaltyWinnerTeamId ?? '' },
                      }))
                    }
                  />
                  <span className="text-gray-300 font-medium">:</span>
                  <input
                    type="number"
                    className="w-12 h-9 text-center input-field text-sm font-medium hide-spinner"
                    inputMode="numeric"
                    value={p.t2}
                    onChange={(e) =>
                      setPredictions((prev) => ({
                        ...prev,
                        [u.id]: { t1: prev[u.id]?.t1 ?? existingPred?.team1Score?.toString() ?? '', t2: e.target.value, penaltyWinner: prev[u.id]?.penaltyWinner ?? existingPred?.penaltyWinnerTeamId ?? '' },
                      }))
                    }
                  />
                  <span className="text-xs text-gray-400 ml-auto">
                    {existingPred ? 'Saved' : ''}
                  </span>
                </div>
                {knockout && scoresAreEqual && (
                  <div className="flex items-center gap-2 ml-[140px]">
                    <span className="text-xs text-gray-400">Pens winner:</span>
                    {[m.team1, m.team2].map((team) => (
                      <button
                        key={team.id}
                        onClick={() =>
                          setPredictions((prev) => ({
                            ...prev,
                            [u.id]: { ...prev[u.id], penaltyWinner: team.id },
                          }))
                        }
                        className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                          p.penaltyWinner === team.id
                            ? 'bg-primary-bg border-primary text-primary font-medium'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {team.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={saveAll} disabled={savingState} className="btn-primary text-sm">
            {savingState ? 'Saving...' : 'Save All Predictions'}
          </button>
          <button onClick={onClose} className="btn-ghost text-gray-500 hover:bg-gray-50 text-sm">Close</button>
        </div>
      </div>
    </div>
  )
}