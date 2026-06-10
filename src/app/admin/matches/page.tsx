'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Team = { id: string; name: string; code: string; group: string | null }
type Match = {
  id: string; team1: Team; team2: Team; team1Score: number | null; team2Score: number | null
  matchDate: string; stage: string; group: string | null; status: string; visible: boolean
}

const STAGES = ['GROUP_STAGE', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL', 'THIRD_PLACE']
const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Group Stage', ROUND_OF_32: 'Round of 32', ROUND_OF_16: 'Round of 16',
  QUARTER_FINALS: 'Quarter-finals', SEMI_FINALS: 'Semi-finals', FINAL: 'Final', THIRD_PLACE: '3rd Place',
}
const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

const TIMEZONES = [
  { label: 'UTC+5:30 (India)', offset: 5.5 },
  { label: 'UTC+8 (China, SG, PH)', offset: 8 },
  { label: 'UTC+7 (Thailand, Vietnam)', offset: 7 },
  { label: 'UTC+4 (UAE, Gulf)', offset: 4 },
  { label: 'UTC+3 (Arabia, Qatar)', offset: 3 },
  { label: 'UTC+2 (Europe Eastern)', offset: 2 },
  { label: 'UTC+1 (Europe Central)', offset: 1 },
  { label: 'UTC+0 (UK, Portugal)', offset: 0 },
  { label: 'UTC-4 (US Eastern)', offset: -4 },
  { label: 'UTC-5 (US Central)', offset: -5 },
  { label: 'UTC-6 (US Mountain)', offset: -6 },
  { label: 'UTC-7 (US Pacific)', offset: -7 },
]

function toUTCDate(dateStr: string, timeStr: string, offsetHours: number): string {
  const sign = offsetHours >= 0 ? '+' : '-'
  const abs = Math.abs(offsetHours)
  const h = Math.floor(abs)
  const m = (abs - h) * 60
  const tz = `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const isoWithTz = `${dateStr}T${timeStr}:00${tz}`
  return new Date(isoWithTz).toISOString()
}

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
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    team1Id: '', team2Id: '', matchDate: '', matchTime: '', stage: 'GROUP_STAGE', group: '', timezone: '5.5',
  })

  useEffect(() => { Promise.all([fetchMatches(), fetchTeams()]) }, [])

  async function fetchMatches() {
    const res = await fetch('/api/admin/matches')
    setMatches(await res.json())
    setLoading(false)
  }
  async function fetchTeams() {
    const res = await fetch('/api/admin/teams')
    setTeams(await res.json())
  }

  function resetForm() {
    setForm({ team1Id: '', team2Id: '', matchDate: '', matchTime: '', stage: 'GROUP_STAGE', group: '', timezone: '5.5' })
    setEditingId(null)
  }

  function editMatch(match: Match) {
    const d = new Date(match.matchDate)
    setForm({
      team1Id: match.team1.id, team2Id: match.team2.id,
      matchDate: d.toISOString().split('T')[0], matchTime: d.toTimeString().split(':').slice(0, 2).join(':'),
      stage: match.stage, group: match.group || '', timezone: '5.5',
    })
    setEditingId(match.id)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.team1Id === form.team2Id) { alert('Teams must be different'); return }
    if (!form.matchTime) { alert('Match time is required for prediction locking'); return }
    const utcIso = toUTCDate(form.matchDate, form.matchTime, Number(form.timezone))
    const res = await fetch('/api/admin/matches', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(editingId ? { id: editingId } : {}),
        team1Id: form.team1Id, team2Id: form.team2Id,
        matchDate: utcIso, stage: form.stage,
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
      body: JSON.stringify({ id: matchId, status: 'SCHEDULED', team1Score: null, team2Score: null }),
    })
    if (!res.ok) { alert('Failed to reopen'); return }
    fetchMatches()
    router.refresh()
  }

  async function toggleVisibility(match: Match) {
    const res = await fetch('/api/admin/matches', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: match.id, visible: !match.visible }),
    })
    if (!res.ok) { alert('Failed to toggle visibility'); return }
    fetchMatches()
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Stage</label>
            <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="input-field">
              {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Group</label>
            <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value, team1Id: '', team2Id: '' })} className="input-field">
              <option value="">None</option>
              {GROUPS.map(g => <option key={g} value={g}>Group {g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Date</label>
            <input required type="date" value={form.matchDate} onChange={(e) => setForm({ ...form, matchDate: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Time</label>
            <input required type="time" value={form.matchTime} onChange={(e) => setForm({ ...form, matchTime: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Timezone</label>
            <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="input-field">
              {TIMEZONES.map(tz => (
                <option key={tz.offset} value={tz.offset}>{tz.label}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Time is converted to UTC for storage. All users see it in their local timezone.</p>
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
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Stage</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
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
                      <td className="px-5 py-3.5">
                        <StageBadge stage={match.stage} />
                        {match.group && <span className="ml-1.5 text-xs text-gray-400">G{match.group}</span>}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">
                        {new Date(match.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => toggleVisibility(match)}
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                            match.visible
                              ? 'bg-green-50 text-green-600 hover:bg-green-100'
                              : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {match.visible ? (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Visible
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                              Hidden
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {match.status === 'FINISHED' ? (
                          <span className="font-semibold text-gray-900">{match.team1Score} : {match.team2Score}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => editMatch(match)} className="btn-ghost text-primary hover:bg-primary-bg mr-1">Edit</button>
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
        </>
      )}
    </div>
  )
}

function ResultEntrySection({ matches, onSave }: { matches: Match[]; onSave: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [scores, setScores] = useState<Record<string, { t1: string; t2: string }>>({})

  async function saveAll() {
    for (const [id, s] of Object.entries(scores)) {
      if (!s.t1 || !s.t2) continue
      await fetch('/api/admin/matches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, team1Score: Number(s.t1), team2Score: Number(s.t2), status: 'FINISHED' }),
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
                <span className="w-28 text-sm font-medium text-right text-gray-700 truncate">{m.team1.name}</span>
                <input
                  type="number" min="0" max="20"
                  className="w-12 h-9 text-center input-field text-sm font-medium"
                  value={scores[m.id]?.t1 ?? ''}
                  onChange={(e) => setScores({ ...scores, [m.id]: { t1: e.target.value, t2: scores[m.id]?.t2 ?? '' } })}
                />
                <span className="text-gray-300 font-medium">:</span>
                <input
                  type="number" min="0" max="20"
                  className="w-12 h-9 text-center input-field text-sm font-medium"
                  value={scores[m.id]?.t2 ?? ''}
                  onChange={(e) => setScores({ ...scores, [m.id]: { t1: scores[m.id]?.t1 ?? '', t2: e.target.value } })}
                />
                <span className="w-28 text-sm font-medium text-gray-700 truncate">{m.team2.name}</span>
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(m.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
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