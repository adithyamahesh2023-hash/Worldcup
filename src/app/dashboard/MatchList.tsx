'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Team = {
  id: string
  name: string
  code: string
  flagUrl: string | null
  group: string | null
}

type Prediction = {
  id: string
  team1Score: number
  team2Score: number
} | null

type MatchItem = {
  id: string
  team1: Team
  team2: Team
  team1Score: number | null
  team2Score: number | null
  matchDate: string
  stage: string
  group: string | null
  status: string
  userPrediction: Prediction
  isPast: boolean
}

function stageLabel(stage: string) {
  const labels: Record<string, string> = {
    GROUP_STAGE: 'Group Stage',
    ROUND_OF_32: 'Round of 32',
    ROUND_OF_16: 'Round of 16',
    QUARTER_FINALS: 'Quarter-finals',
    SEMI_FINALS: 'Semi-finals',
    FINAL: 'Final',
    THIRD_PLACE: '3rd Place',
  }
  return labels[stage] || stage
}

function stageColor(stage: string) {
  const colors: Record<string, string> = {
    GROUP_STAGE: 'bg-primary-bg text-primary',
    ROUND_OF_32: 'bg-blue-50 text-blue-600',
    ROUND_OF_16: 'bg-blue-50 text-blue-600',
    QUARTER_FINALS: 'bg-amber-50 text-amber-600',
    SEMI_FINALS: 'bg-amber-50 text-amber-600',
    FINAL: 'bg-rose-50 text-rose-600',
    THIRD_PLACE: 'bg-gray-100 text-gray-600',
  }
  return colors[stage] || 'bg-gray-100 text-gray-600'
}

export default function MatchList({
  matches,
  userId,
}: {
  matches: MatchItem[]
  userId: string
}) {
  const router = useRouter()
  const [saving, setSaving] = useState<string | null>(null)
  const [predictions, setPredictions] = useState<Record<string, { team1Score: string; team2Score: string }>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 3000)
      return () => clearTimeout(t)
    }
  }, [success])

  function localDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    })
  }

  function localTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString(undefined, {
      hour: '2-digit', minute: '2-digit',
    })
  }

  const grouped = matches.reduce<Record<string, MatchItem[]>>((acc, match) => {
    const date = localDate(match.matchDate)
    if (!acc[date]) acc[date] = []
    acc[date].push(match)
    return acc
  }, {})

  async function savePrediction(matchId: string, team1Score: string, team2Score: string) {
    if (!team1Score || !team2Score) {
      setError('Please enter both scores')
      return
    }
    setError('')
    setSuccess('')
    setSaving(matchId)
    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, team1Score: Number(team1Score), team2Score: Number(team2Score) }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Failed to save')
    } else {
      setSuccess('Prediction saved! You can change it anytime until kickoff.')
    }
    setSaving(null)
    setPredictions((p) => {
      const copy = { ...p }
      delete copy[matchId]
      return copy
    })
    router.refresh()
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-primary-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-500 text-lg">No matches yet</p>
        <p className="text-gray-400 text-sm mt-1">The admin will add them soon!</p>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3.5 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3.5 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Matches</h1>

      <div className="space-y-8">
        {Object.entries(grouped).map(([date, dayMatches]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gray-100" />
              <h2 className="text-sm font-medium text-gray-500">{date}</h2>
              <div className="h-px flex-1 bg-gray-100" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {dayMatches.map((match) => {
                const pKey = `p-${match.id}`
                const localPred = predictions[pKey]
                const editingT1 = localPred?.team1Score
                const editingT2 = localPred?.team2Score
                const t1 = editingT1 !== undefined ? editingT1 : match.userPrediction?.team1Score?.toString() ?? ''
                const t2 = editingT2 !== undefined ? editingT2 : match.userPrediction?.team2Score?.toString() ?? ''
                const hasPrediction = !!match.userPrediction
                const isChanged = editingT1 !== undefined && editingT2 !== undefined

                return (
                  <div key={match.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col items-center gap-4">
                    {/* Stage + time */}
                    <div className="flex items-center gap-2 w-full">
                      <span className={`badge text-xs ${stageColor(match.stage)}`}>
                        {stageLabel(match.stage)}
                      </span>
                      {match.group && (
                        <span className="badge bg-gray-50 text-gray-500 text-xs">Group {match.group}</span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">{localTime(match.matchDate)}</span>
                    </div>

                    {/* Flags + country names */}
                    <div className="flex items-center justify-center gap-4 w-full">
                      {/* Team 1 */}
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

                      {/* Score area */}
                      {match.isPast ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-2xl font-bold text-gray-900 w-8 text-center">
                            {match.team1Score ?? '-'}
                          </span>
                          <span className="text-gray-300 text-base font-medium">vs</span>
                          <span className="text-2xl font-bold text-gray-900 w-8 text-center">
                            {match.team2Score ?? '-'}
                          </span>
                        </div>
                      ) : (
                          <div className="flex flex-col items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                className={`w-12 h-12 text-center input-field text-xl font-bold hide-spinner ${hasPrediction && !isChanged ? 'border-primary text-primary' : ''}`}
                                inputMode="numeric"
                                value={t1}
                                onChange={(e) =>
                                  setPredictions((p) => ({
                                    ...p,
                                    [pKey]: { team1Score: e.target.value, team2Score: localPred?.team2Score ?? t2 },
                                  }))
                                }
                              />
                              <span className="text-gray-300 text-sm font-medium">vs</span>
                              <input
                                type="number"
                                className={`w-12 h-12 text-center input-field text-xl font-bold hide-spinner ${hasPrediction && !isChanged ? 'border-primary text-primary' : ''}`}
                                inputMode="numeric"
                                value={t2}
                                onChange={(e) =>
                                  setPredictions((p) => ({
                                    ...p,
                                    [pKey]: { team1Score: localPred?.team1Score ?? t1, team2Score: e.target.value },
                                  }))
                                }
                              />
                            </div>
                            {/* Predict/Update button below scores */}
                            <button
                              onClick={() => savePrediction(match.id, t1, t2)}
                              disabled={saving === match.id}
                              className={`w-full text-sm py-2 px-4 rounded-lg font-medium transition-colors ${
                                hasPrediction && !isChanged
                                  ? 'bg-primary-bg text-primary border border-primary-lighter hover:bg-primary-bg-hover'
                                  : 'btn-primary text-center'
                              }`}
                            >
                              {saving === match.id ? 'Saving...' : hasPrediction ? 'Update' : 'Predict'}
                            </button>
                          </div>
                      )}

                      {/* Team 2 */}
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

                    {/* Current prediction bar */}
                    {!match.isPast && match.userPrediction && (
                      <div className="w-full px-3 py-2 bg-primary-bg rounded-lg flex items-center justify-center gap-1.5">
                        <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-xs text-gray-600">
                          You picked: <strong className="text-primary">{match.userPrediction.team1Score} - {match.userPrediction.team2Score}</strong>
                        </span>
                      </div>
                    )}

                    {/* Past match prediction */}
                    {match.isPast && (
                      <div className="w-full px-3 py-2 bg-gray-50 rounded-lg flex items-center justify-center gap-1.5">
                        {match.userPrediction ? (
                          <>
                            <span className="text-xs text-gray-500">Your pick:</span>
                            <span className="text-xs font-semibold text-gray-700">{match.userPrediction.team1Score} - {match.userPrediction.team2Score}</span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No prediction</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}