'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Team = {
  id: string
  name: string
  code: string
  flagUrl: string | null
  group: string | null
}

const ALL_TEAMS = [
  { name: "Algeria", code: "ALG", flagUrl: "https://flagcdn.com/dz.svg" },
  { name: "Argentina", code: "ARG", flagUrl: "https://flagcdn.com/ar.svg" },
  { name: "Australia", code: "AUS", flagUrl: "https://flagcdn.com/au.svg" },
  { name: "Austria", code: "AUT", flagUrl: "https://flagcdn.com/at.svg" },
  { name: "Belgium", code: "BEL", flagUrl: "https://flagcdn.com/be.svg" },
  { name: "Bosnia and Herzegovina", code: "BIH", flagUrl: "https://flagcdn.com/ba.svg" },
  { name: "Brazil", code: "BRA", flagUrl: "https://flagcdn.com/br.svg" },
  { name: "Cape Verde", code: "CPV", flagUrl: "https://flagcdn.com/cv.svg" },
  { name: "Canada", code: "CAN", flagUrl: "https://flagcdn.com/ca.svg" },
  { name: "Colombia", code: "COL", flagUrl: "https://flagcdn.com/co.svg" },
  { name: "Congo DR", code: "COD", flagUrl: "https://flagcdn.com/cd.svg" },
  { name: "Ivory Coast", code: "CIV", flagUrl: "https://flagcdn.com/ci.svg" },
  { name: "Croatia", code: "CRO", flagUrl: "https://flagcdn.com/hr.svg" },
  { name: "Curaçao", code: "CUR", flagUrl: "https://flagcdn.com/cw.svg" },
  { name: "Czechia", code: "CZE", flagUrl: "https://flagcdn.com/cz.svg" },
  { name: "Ecuador", code: "ECU", flagUrl: "https://flagcdn.com/ec.svg" },
  { name: "Egypt", code: "EGY", flagUrl: "https://flagcdn.com/eg.svg" },
  { name: "England", code: "ENG", flagUrl: "https://flagcdn.com/gb-eng.svg" },
  { name: "France", code: "FRA", flagUrl: "https://flagcdn.com/fr.svg" },
  { name: "Germany", code: "GER", flagUrl: "https://flagcdn.com/de.svg" },
  { name: "Ghana", code: "GHA", flagUrl: "https://flagcdn.com/gh.svg" },
  { name: "Haiti", code: "HAI", flagUrl: "https://flagcdn.com/ht.svg" },
  { name: "Iran", code: "IRN", flagUrl: "https://flagcdn.com/ir.svg" },
  { name: "Iraq", code: "IRQ", flagUrl: "https://flagcdn.com/iq.svg" },
  { name: "Japan", code: "JPN", flagUrl: "https://flagcdn.com/jp.svg" },
  { name: "Jordan", code: "JOR", flagUrl: "https://flagcdn.com/jo.svg" },
  { name: "South Korea", code: "KOR", flagUrl: "https://flagcdn.com/kr.svg" },
  { name: "Mexico", code: "MEX", flagUrl: "https://flagcdn.com/mx.svg" },
  { name: "Morocco", code: "MAR", flagUrl: "https://flagcdn.com/ma.svg" },
  { name: "Netherlands", code: "NED", flagUrl: "https://flagcdn.com/nl.svg" },
  { name: "New Zealand", code: "NZL", flagUrl: "https://flagcdn.com/nz.svg" },
  { name: "Norway", code: "NOR", flagUrl: "https://flagcdn.com/no.svg" },
  { name: "Panama", code: "PAN", flagUrl: "https://flagcdn.com/pa.svg" },
  { name: "Paraguay", code: "PAR", flagUrl: "https://flagcdn.com/py.svg" },
  { name: "Portugal", code: "POR", flagUrl: "https://flagcdn.com/pt.svg" },
  { name: "Qatar", code: "QAT", flagUrl: "https://flagcdn.com/qa.svg" },
  { name: "Saudi Arabia", code: "KSA", flagUrl: "https://flagcdn.com/sa.svg" },
  { name: "Scotland", code: "SCO", flagUrl: "https://flagcdn.com/gb-sct.svg" },
  { name: "Senegal", code: "SEN", flagUrl: "https://flagcdn.com/sn.svg" },
  { name: "South Africa", code: "RSA", flagUrl: "https://flagcdn.com/za.svg" },
  { name: "Spain", code: "ESP", flagUrl: "https://flagcdn.com/es.svg" },
  { name: "Sweden", code: "SWE", flagUrl: "https://flagcdn.com/se.svg" },
  { name: "Switzerland", code: "SUI", flagUrl: "https://flagcdn.com/ch.svg" },
  { name: "Tunisia", code: "TUN", flagUrl: "https://flagcdn.com/tn.svg" },
  { name: "Türkiye", code: "TUR", flagUrl: "https://flagcdn.com/tr.svg" },
  { name: "United States", code: "USA", flagUrl: "https://flagcdn.com/us.svg" },
  { name: "Uruguay", code: "URU", flagUrl: "https://flagcdn.com/uy.svg" },
  { name: "Uzbekistan", code: "UZB", flagUrl: "https://flagcdn.com/uz.svg" },
]

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export default function AdminTeamsPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editGroup, setEditGroup] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => { fetchTeams() }, [])

  async function fetchTeams() {
    const res = await fetch('/api/admin/teams')
    setTeams(await res.json())
    setLoading(false)
  }

  const existingCodes = new Set(teams.map(t => t.code))
  const availableTeams = ALL_TEAMS.filter(t => !existingCodes.has(t.code))

  async function addTeam() {
    if (!selectedCountry) return
    const team = ALL_TEAMS.find(t => t.code === selectedCountry)
    if (!team) return
    const res = await fetch('/api/admin/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: team.name,
        code: team.code,
        flagUrl: team.flagUrl,
        group: selectedGroup || null,
      }),
    })
    if (!res.ok) { setMessage('Failed to add team'); return }
    setSelectedCountry('')
    setSelectedGroup('')
    setMessage(`"${team.name}" added!`)
    fetchTeams()
    router.refresh()
  }

  async function updateGroup(teamId: string, group: string) {
    const res = await fetch('/api/admin/teams', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: teamId, group: group || null }),
    })
    if (!res.ok) { setMessage('Failed to update'); return }
    fetchTeams()
    router.refresh()
  }

  async function deleteTeam(id: string) {
    const team = teams.find(t => t.id === id)
    if (!confirm(`Remove "${team?.name}" from the tournament?`)) return
    const res = await fetch(`/api/admin/teams?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { setMessage('Failed to delete'); return }
    fetchTeams()
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary-bg rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Teams</h1>
          <p className="text-sm text-gray-400">48 teams — assign groups A-L</p>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100">
          {message}
        </div>
      )}

      {/* Add team dropdown */}
      {availableTeams.length > 0 && (
        <div className="card p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">Add a Team</h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[250px]">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Country</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="input-field"
              >
                <option value="">Select a country...</option>
                {availableTeams.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Group</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="input-field"
              >
                <option value="">Unassigned</option>
                {GROUPS.map((g) => <option key={g} value={g}>Group {g}</option>)}
              </select>
            </div>
            <button onClick={addTeam} disabled={!selectedCountry} className="btn-primary text-sm h-[38px]">
              Add Team
            </button>
          </div>
          {selectedCountry && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
              {(() => {
                const t = ALL_TEAMS.find(x => x.code === selectedCountry)
                return t ? (
                  <>
                    <img src={t.flagUrl} alt="" className="w-5 h-4 rounded-sm" />
                    <span>{t.name} — FIFA code: {t.code}</span>
                  </>
                ) : null
              })()}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-center py-8">Loading...</p>
      ) : teams.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No teams yet. Add teams from the dropdown above.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Flag</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Country</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Code</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Group</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    {team.flagUrl ? (
                      <img src={team.flagUrl} alt="" className="w-7 h-5 rounded-sm object-cover shadow-sm" />
                    ) : (
                      <span className="text-gray-300 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-gray-900">{team.name}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 font-mono">{team.code}</td>
                  <td className="px-5 py-3.5">
                    {editingId === team.id ? (
                      <div className="flex gap-1 items-center">
                        <select
                          value={editGroup}
                          onChange={(e) => setEditGroup(e.target.value)}
                          className="input-field text-xs py-1 px-2 w-28"
                          autoFocus
                        >
                          <option value="">None</option>
                          {GROUPS.map((g) => <option key={g} value={g}>Group {g}</option>)}
                        </select>
                        <button
                          onClick={async () => {
                            await updateGroup(team.id, editGroup)
                            setEditingId(null)
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:underline">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span
                        className="cursor-pointer"
                        onClick={() => { setEditingId(team.id); setEditGroup(team.group || '') }}
                      >
                        {team.group ? (
                          <span className="badge bg-primary-bg text-primary">Group {team.group}</span>
                        ) : (
                          <span className="text-gray-300 text-sm cursor-pointer hover:text-gray-500">Click to assign</span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => deleteTeam(team.id)} className="btn-danger">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-gray-50 text-xs text-gray-400">
            {teams.length} / 48 teams
          </div>
        </div>
      )}
    </div>
  )
}