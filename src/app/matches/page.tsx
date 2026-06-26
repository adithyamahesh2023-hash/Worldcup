'use client'

import { useEffect, useState } from 'react'

type Team = { id: string; name: string; code: string; flagUrl: string | null; group: string | null }
type Match = {
  id: string; team1: Team; team2: Team; team1Score: number | null; team2Score: number | null
  team1Penalties: number | null; team2Penalties: number | null
  matchDate: string; stage: string; group: string | null; status: string; visible: boolean
}
type AppUser = { id: string; name: string | null }
type PredictionData = { userId: string; team1Score: number; team2Score: number; penaltyWinnerTeamId: string | null; points: number }

function isKnockout(stage: string) { return stage !== 'GROUP_STAGE' }

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Group Stage', ROUND_OF_32: 'Round of 32', ROUND_OF_16: 'Round of 16',
  QUARTER_FINALS: 'Quarter-finals', SEMI_FINALS: 'Semi-finals', FINAL: 'Final', THIRD_PLACE: '3rd Place',
}

function stageColor(stage: string) {
  const colors: Record<string, string> = {
    GROUP_STAGE: 'bg-primary-bg text-primary', ROUND_OF_32: 'bg-blue-50 text-blue-600',
    ROUND_OF_16: 'bg-blue-50 text-blue-600', QUARTER_FINALS: 'bg-amber-50 text-amber-600',
    SEMI_FINALS: 'bg-amber-50 text-amber-600', FINAL: 'bg-rose-50 text-rose-600',
    THIRD_PLACE: 'bg-gray-100 text-gray-600',
  }
  return colors[stage] || 'bg-gray-100 text-gray-600'
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [predictions, setPredictions] = useState<PredictionData[]>([])
  const [predForm, setPredForm] = useState<Record<string, { t1: string; t2: string; penaltyWinner: string }>>({})
  const [savingPreds, setSavingPreds] = useState(false)
  const [scores, setScores] = useState<Record<string, { t1: string; t2: string; p1: string; p2: string }>>({})
  const [success, setSuccess] = useState('')
  const [savingResult, setSavingResult] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/matches').then(r => r.json()),
      fetch('/api/admin/users').then(r => r.json()),
    ]).then(([m, u]) => {
      setMatches(m)
      setUsers(u)
      setLoading(false)
    })
  }, [])

  async function saveResult(matchId: string) {
    const s = scores[matchId]
    if (!s?.t1 || !s?.t2) return
    setSavingResult(matchId)
    const body: Record<string, string | number | null> = { id: matchId, team1Score: Number(s.t1), team2Score: Number(s.t2), status: 'FINISHED' }
    if (s.p1 !== '' && s.p2 !== '') {
      body.team1Penalties = Number(s.p1)
      body.team2Penalties = Number(s.p2)
    }
    await fetch('/api/admin/matches', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSavingResult(null)
    setScores(p => { const c = { ...p }; delete c[matchId]; return c })
    const res = await fetch('/api/admin/matches')
    setMatches(await res.json())
  }

  async function openMatch(match: Match) {
    setSelectedMatch(match)
    const data: PredictionData[] = await fetch(`/api/predictions?matchId=${match.id}`).then(r => r.json())
    setPredictions(data)
    const form: Record<string, { t1: string; t2: string; penaltyWinner: string }> = {}
    for (const p of data) {
      form[p.userId] = { t1: p.team1Score.toString(), t2: p.team2Score.toString(), penaltyWinner: p.penaltyWinnerTeamId ?? '' }
    }
    setPredForm(form)
  }

  async function savePredictions() {
    if (!selectedMatch) return
    setSavingPreds(true)
    const knockout = isKnockout(selectedMatch.stage)
    for (const user of users) {
      const p = predForm[user.id]
      if (!p?.t1 || !p?.t2) continue
      const body: Record<string, string | number | null> = { matchId: selectedMatch.id, userId: user.id, team1Score: Number(p.t1), team2Score: Number(p.t2) }
      if (knockout && Number(p.t1) === Number(p.t2) && p.penaltyWinner) {
        body.penaltyWinnerTeamId = p.penaltyWinner
      }
      await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }
    setSavingPreds(false)
    setSelectedMatch(null)
    setPredForm({})
    setSuccess('Predictions saved!')
    setTimeout(() => setSuccess(''), 3000)
  }

  if (loading) return <p className="text-gray-400 text-center py-8">Loading...</p>

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary-bg rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matches</h1>
          <p className="text-sm text-gray-400">Enter results and manage predictions</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 p-3.5 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100">
          {success}
        </div>
      )}

      {matches.length === 0 ? (
        <div className="text-center py-12"><p className="text-gray-400">No matches yet.</p></div>
      ) : (
        <div className="space-y-8">
          {Object.entries(
            matches.reduce<Record<string, Match[]>>((acc, m) => {
              const date = new Date(m.matchDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
              if (!acc[date]) acc[date] = []
              acc[date].push(m)
              return acc
            }, {})
          ).map(([date, dayMatches]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gray-100" />
                <h2 className="text-sm font-medium text-gray-500">{date}</h2>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {dayMatches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col items-center gap-4 cursor-pointer"
                    onClick={() => openMatch(match)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className={`badge text-xs ${stageColor(match.stage)}`}>
                        {STAGE_LABELS[match.stage] || match.stage}
                      </span>
                      {match.group && (
                        <span className="badge bg-gray-50 text-gray-500 text-xs">Group {match.group}</span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(match.matchDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-4 w-full">
                      <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                        {match.team1.flagUrl ? (
                          <img src={match.team1.flagUrl} alt={match.team1.name} className="w-28 h-20 rounded-lg object-cover shadow-sm border border-gray-100" />
                        ) : (
                          <div className="w-28 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-medium">
                            {match.team1.code}
                          </div>
                        )}
                        <span className="text-sm font-semibold text-gray-800 text-center leading-tight truncate max-w-full">{match.team1.name}</span>
                      </div>

                      <div className="flex flex-col items-center gap-2 shrink-0">
                        {match.status === 'FINISHED' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-900">{match.team1Score ?? '-'}</span>
                            <span className="text-gray-300 text-base font-medium">vs</span>
                            <span className="text-2xl font-bold text-gray-900">{match.team2Score ?? '-'}</span>
                            {isKnockout(match.stage) && match.team1Penalties !== null && match.team2Penalties !== null && (
                              <span className="text-xs text-gray-400">(pens {match.team1Penalties}-{match.team2Penalties})</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number" min="0" max="20"
                                className="w-12 h-12 text-center input-field text-xl font-bold hide-spinner"
                                inputMode="numeric"
                                value={scores[match.id]?.t1 ?? ''}
                                onChange={(e) => setScores({ ...scores, [match.id]: { t1: e.target.value, t2: scores[match.id]?.t2 ?? '', p1: scores[match.id]?.p1 ?? '', p2: scores[match.id]?.p2 ?? '' } })}
                              />
                              <span className="text-gray-300 text-sm font-medium">vs</span>
                              <input
                                type="number" min="0" max="20"
                                className="w-12 h-12 text-center input-field text-xl font-bold hide-spinner"
                                inputMode="numeric"
                                value={scores[match.id]?.t2 ?? ''}
                                onChange={(e) => setScores({ ...scores, [match.id]: { t1: scores[match.id]?.t1 ?? '', t2: e.target.value, p1: scores[match.id]?.p1 ?? '', p2: scores[match.id]?.p2 ?? '' } })}
                              />
                            </div>
                            {isKnockout(match.stage) && scores[match.id]?.t1 !== '' && scores[match.id]?.t2 !== '' && Number(scores[match.id]?.t1) === Number(scores[match.id]?.t2) && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <span>pens</span>
                                <input
                                  type="number" min="0" max="20"
                                  className="w-9 h-7 text-center input-field text-xs font-medium hide-spinner"
                                  value={scores[match.id]?.p1 ?? ''}
                                  onChange={(e) => setScores({ ...scores, [match.id]: { t1: scores[match.id]?.t1 ?? '', t2: scores[match.id]?.t2 ?? '', p1: e.target.value, p2: scores[match.id]?.p2 ?? '' } })}
                                />
                                <span className="text-gray-300">:</span>
                                <input
                                  type="number" min="0" max="20"
                                  className="w-9 h-7 text-center input-field text-xs font-medium hide-spinner"
                                  value={scores[match.id]?.p2 ?? ''}
                                  onChange={(e) => setScores({ ...scores, [match.id]: { t1: scores[match.id]?.t1 ?? '', t2: scores[match.id]?.t2 ?? '', p1: scores[match.id]?.p1 ?? '', p2: e.target.value } })}
                                />
                              </div>
                            )}
                            <button
                              onClick={() => saveResult(match.id)}
                              disabled={savingResult === match.id || !scores[match.id]?.t1 || !scores[match.id]?.t2}
                              className="btn-primary text-sm py-2 px-4"
                            >
                              {savingResult === match.id ? 'Saving...' : 'Save Result'}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                        {match.team2.flagUrl ? (
                          <img src={match.team2.flagUrl} alt={match.team2.name} className="w-28 h-20 rounded-lg object-cover shadow-sm border border-gray-100" />
                        ) : (
                          <div className="w-28 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-medium">
                            {match.team2.code}
                          </div>
                        )}
                        <span className="text-sm font-semibold text-gray-800 text-center leading-tight truncate max-w-full">{match.team2.name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => { setSelectedMatch(null); setPredForm({}) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedMatch.team1.name} vs {selectedMatch.team2.name}
                </h3>
                <span className={`badge text-xs ${stageColor(selectedMatch.stage)}`}>
                  {STAGE_LABELS[selectedMatch.stage] || selectedMatch.stage}
                </span>
                {selectedMatch.status === 'FINISHED' && (
                  <span className="ml-2 font-bold text-primary">{selectedMatch.team1Score} : {selectedMatch.team2Score}</span>
                )}
              </div>
              <button onClick={() => { setSelectedMatch(null); setPredForm({}) }} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="space-y-2">
              {users.length === 0 && (
                <p className="text-sm text-gray-400 py-4 text-center">No players added yet.</p>
              )}
              {users
                .slice()
                .sort((a, b) => {
                  if (selectedMatch.status !== 'FINISHED') {
                    const ha = predictions.find(p => p.userId === a.id) ? 1 : 0
                    const hb = predictions.find(p => p.userId === b.id) ? 1 : 0
                    return ha - hb
                  }
                  const pa = predictions.find(p => p.userId === a.id)?.points ?? 0
                  const pb = predictions.find(p => p.userId === b.id)?.points ?? 0
                  return pb - pa
                })
                .map((u, i) => {
                const p = predForm[u.id] || { t1: '', t2: '', penaltyWinner: '' }
                const existing = predictions.find(p => p.userId === u.id)
                const knockout = isKnockout(selectedMatch.stage)
                const scoresAreEqual = p.t1 !== '' && p.t2 !== '' && Number(p.t1) === Number(p.t2)
                return (
                  <div key={u.id} className="flex flex-col gap-1.5 p-2 rounded-xl bg-gray-50">
                    <div className="flex items-center justify-between">
                      {selectedMatch.status === 'FINISHED' && (
                        <span className="w-5 text-xs font-bold text-gray-300 text-center shrink-0">#{i + 1}</span>
                      )}
                      <span className="text-sm font-medium text-gray-700 w-24 truncate">{u.name || 'Player'}</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number" min="0" max="20"
                          className="w-11 h-9 text-center input-field text-sm font-medium hide-spinner"
                          inputMode="numeric"
                          value={p.t1}
                          onChange={(e) => setPredForm({ ...predForm, [u.id]: { t1: e.target.value, t2: p.t2, penaltyWinner: p.penaltyWinner } })}
                        />
                        <span className="text-gray-300 text-xs font-medium">:</span>
                        <input
                          type="number" min="0" max="20"
                          className="w-11 h-9 text-center input-field text-sm font-medium hide-spinner"
                          inputMode="numeric"
                          value={p.t2}
                          onChange={(e) => setPredForm({ ...predForm, [u.id]: { t1: p.t1, t2: e.target.value, penaltyWinner: p.penaltyWinner } })}
                        />
                        {selectedMatch.status === 'FINISHED' && existing && (
                          <span className="ml-2 badge bg-primary-bg text-primary text-xs font-bold">{existing.points} pts</span>
                        )}
                        {selectedMatch.status === 'FINISHED' && knockout && existing && selectedMatch.team1Penalties !== null && selectedMatch.team2Penalties !== null && (
                          <span className={`ml-1.5 badge text-xs font-medium ${
                            existing.penaltyWinnerTeamId
                              ? existing.penaltyWinnerTeamId === (selectedMatch.team1Penalties > selectedMatch.team2Penalties ? selectedMatch.team1.id : selectedMatch.team2.id)
                                ? 'bg-green-50 text-green-700'
                                : 'bg-red-50 text-red-500'
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            Pens: {existing.penaltyWinnerTeamId
                              ? (existing.penaltyWinnerTeamId === selectedMatch.team1.id ? selectedMatch.team1.code : selectedMatch.team2.code)
                              : '—'}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedMatch.status !== 'FINISHED' && knockout && scoresAreEqual && (
                      <div className="flex items-center gap-2 ml-[116px]">
                        <span className="text-xs text-gray-400">Pens winner:</span>
                        {[selectedMatch.team1, selectedMatch.team2].map((team) => (
                          <button
                            key={team.id}
                            onClick={() =>
                              setPredForm({ ...predForm, [u.id]: { ...p, penaltyWinner: team.id } })
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
              <button
                onClick={savePredictions}
                disabled={savingPreds}
                className="btn-primary text-sm"
              >
                {savingPreds ? 'Saving...' : 'Save All Predictions'}
              </button>
              <button
                onClick={() => {
                  const cleared: Record<string, { t1: string; t2: string; penaltyWinner: string }> = {}
                  for (const u of users) cleared[u.id] = { t1: '', t2: '', penaltyWinner: '' }
                  setPredForm(cleared)
                }}
                className="btn-ghost text-red-500 hover:bg-red-50 text-sm"
              >
                Clear
              </button>
              <button
                onClick={() => { setSelectedMatch(null); setPredForm({}) }}
                className="btn-ghost text-gray-500 hover:bg-gray-50 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
