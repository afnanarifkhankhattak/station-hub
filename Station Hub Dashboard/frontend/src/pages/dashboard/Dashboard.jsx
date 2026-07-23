import React, { useState, useEffect, useCallback } from 'react'
import { api } from '../../api/api'
import { useTheme } from '../../context/theme.Context'

// ── SVG Icons ──────────────────────────────────────────────
const IconStation = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)
const IconUsers = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const IconBooking = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const IconInfinity = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 12c0 1.657-2.239 3-5 3-1.593 0-3.025-.523-4-1.343M18.364 12c0-1.657-2.239-3-5-3-1.593 0-3.025.523-4 1.343M18.364 12H21m-3.636 0C15.727 13.657 13.488 15 10.727 15c-2.762 0-5-1.343-5-3s2.238-3 5-3c2.761 0 5 1.343 5 3zM3 12h2.364" />
  </svg>
)
const IconMoney = () => (
  <svg className="w-10 h-10 text-white/80" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const IconCheck = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)
const IconX = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const IconCalendar = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const IconClock = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const IconCar = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 6H5l-2 6v3h14v-3l-2-6H9m4 0V4" />
  </svg>
)
const IconRefresh = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)
const IconComplete = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const avatar = (name = '') => (name.charAt(0) || '?').toUpperCase()

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [pending, setPending] = useState([])
  const [confirmed, setConfirmed] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actioning, setActioning] = useState({})
  // const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const userName = user.full_name?.split(' ')[0] || 'Admin'

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    setError('')
    try {
      const data = await api.get('/dashboard/stats')
      setStats(data.stats)
      setPending(data.pending_bookings || [])
      setConfirmed(data.confirmed_bookings || [])
      try { localStorage.setItem('cached_dashboard_stats', JSON.stringify(data)) } catch { /* quota exceeded, skip cache */ }
    } catch (e) {
      if (!isBackground) setError(e.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const cached = localStorage.getItem('cached_dashboard_stats')
    if (cached) {
      try {
        const data = JSON.parse(cached)
        setStats(data.stats)
        setPending(data.pending_bookings || [])
        setConfirmed(data.confirmed_bookings || [])
        setLoading(false)
        fetchData(true) // refresh in background, no spinner
        return
      } catch { /* fall through to normal fetch */ }
    }
    fetchData()
  }, [fetchData])
  
  const { dark } = useTheme()

  const updateStatus = async (id, status) => {
    setActioning(prev => ({ ...prev, [id]: true }))
    try {
      await api.patch(`/dashboard/bookings/${id}/status`, { status })
      if (status === 'confirmed') {
        const booking = pending.find(b => b.id === id)
        if (booking) {
          setPending(prev => prev.filter(b => b.id !== id))
          setConfirmed(prev => [{ ...booking, status: 'confirmed' }, ...prev])
        }
      } else if (status === 'rejected') {
        setPending(prev => prev.filter(b => b.id !== id))
      } else if (status === 'completed') {
        setConfirmed(prev => prev.filter(b => b.id !== id))
      }
    } catch (e) {
      alert(e.message || 'Action failed')
    } finally {
      setActioning(prev => ({ ...prev, [id]: false }))
    }
  }

  const statCards = [
    { label: 'Total Stations', value: stats?.total_stations ?? '—', icon: <IconStation />, color: 'blue' },
    { label: 'Total Users', value: stats?.total_users ?? '—', icon: <IconUsers />, color: 'purple' },
    { label: 'Total Bookings', value: stats?.total_bookings ?? '—', icon: <IconBooking />, color: 'orange' },
    { label: 'Services', value: 'Unlimited', icon: <IconInfinity />, color: 'green' },
  ]

  // ── Theme tokens ───────────────────────────────────────
  const D = dark
  const bg = D ? 'bg-[#0f1117]' : 'bg-gray-50'
  const txt = D ? 'text-gray-100' : 'text-gray-900'
  const sub = D ? 'text-gray-400' : 'text-gray-500'
  const card = D ? 'bg-[#1a1d27] border-[#2a2d3e]' : 'bg-white border-gray-200'
  const head = D ? 'border-[#2a2d3e]' : 'border-gray-100'

  const colorMap = {
    blue: D ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-500',
    purple: D ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-500',
    orange: D ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-500',
    green: D ? 'bg-green-500/20 text-green-400' : 'bg-green-50 text-green-500',
  }

  if (loading) return (
    <div className={`flex items-center justify-center h-full min-h-[300px] transition-colors duration-300 ${bg}`}>
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className={`flex-1 p-6 overflow-auto rounded-lg transition-colors duration-300 ${bg}`}>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className={`text-xl font-semibold ${txt}`}>
            Welcome, {userName}! Good to have you onboard.
          </h1>
          <p className={`text-sm mt-1 ${sub}`}>
            Here's what's happening with your stations
          </p>
        </div>
        <button
          onClick={fetchData}
          className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs transition-colors ${D ? 'bg-[#1a1d27] border-[#2a2d3e] text-gray-400 hover:text-gray-300' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          <IconRefresh /> Refresh
        </button>
      </div>

      {error && (
        <div className={`mb-4 px-4 py-3 border rounded-xl text-sm ${D ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-red-50 border-red-200 text-red-500'}`}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map(card => (
          <div key={card.label} className={`border rounded-xl p-4 flex items-center justify-between transition-colors ${card}`}>
            <div>
              <p className={`text-xs mb-1 ${sub}`}>{card.label}</p>
              <p className={`text-2xl font-semibold ${txt}`}>{card.value}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[card.color]}`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl p-5 mb-6 bg-gradient-to-r from-orange-500 to-orange-400 flex items-center justify-between shadow-sm`}>
        <div>
          <p className="text-sm text-orange-100 mb-1">Today's Earnings</p>
          <p className="text-3xl font-bold text-white">
            PKR {stats?.todays_earnings?.toLocaleString() ?? '0'}
          </p>
          <p className="text-xs text-orange-100 mt-1">
            {stats?.todays_earnings > 0 ? 'From completed bookings today' : 'No bookings completed today'}
          </p>
        </div>
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
          <IconMoney />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">

        {/* Pending Bookings */}
        <div className={`col-span-2 border rounded-2xl shadow-sm overflow-hidden ${card}`}>
          <div className={`flex items-center justify-between px-5 py-4 border-b ${head}`}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className={`text-sm font-semibold ${txt}`}>Pending Bookings</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${D ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-500'}`}>
                {pending.length}
              </span>
            </div>
          </div>

          {pending.length === 0 ? (
            <div className={`px-5 py-10 text-center text-sm ${sub}`}>
              No pending bookings
            </div>
          ) : (
            <div className={`divide-y ${D ? 'divide-[#2a2d3e]' : 'divide-gray-50'}`}>
              {pending.map(b => (
                <div key={b.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    {b.user_profile_image ? (
                      <img
                        src={b.user_profile_image}
                        alt={b.user_name}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${D ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                        {avatar(b.user_name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-semibold ${txt}`}>{b.user_name || 'Unknown'}</p>
                        <span className="text-sm font-bold text-orange-500">
                          PKR {b.price?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 ${sub}`}>
                        {b.service_name} · {b.station_name}
                      </p>
                      <div className={`flex items-center gap-3 mt-1.5 text-xs ${sub}`}>
                        <span className="flex items-center gap-1"><IconCalendar /> {b.travel_date}</span>
                        <span className="flex items-center gap-1"><IconClock /> {b.travel_time}</span>
                        {b.vehicle_brand && (
                          <span className="flex items-center gap-1">
                            <IconCar /> {b.vehicle_type} — {b.vehicle_brand} {b.vehicle_number}
                          </span>
                        )}
                      </div>
                      {b.special_request && (
                        <p className={`text-xs mt-1.5 italic ${sub}`}>
                          "{b.special_request}"
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          disabled={actioning[b.id]}
                          onClick={() => updateStatus(b.id, 'confirmed')}
                          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${D ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' : 'bg-green-50 hover:bg-green-100 text-green-600'}`}
                        >
                          <IconCheck /> Confirm
                        </button>
                        <button
                          disabled={actioning[b.id]}
                          onClick={() => updateStatus(b.id, 'rejected')}
                          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${D ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-500'}`}
                        >
                          <IconX /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirmed Bookings */}
        <div className={`border rounded-2xl shadow-sm overflow-hidden ${card}`}>
          <div className={`flex items-center justify-between px-5 py-4 border-b ${head}`}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <p className={`text-sm font-semibold ${txt}`}>Confirmed</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${D ? 'bg-green-500/20 text-green-400' : 'bg-green-50 text-green-600'}`}>
                {confirmed.length}
              </span>
            </div>
          </div>

          {confirmed.length === 0 ? (
            <div className={`px-5 py-10 text-center text-sm ${sub}`}>
              No confirmed bookings
            </div>
          ) : (
            <div className={`divide-y ${D ? 'divide-[#2a2d3e]' : 'divide-gray-50'}`}>
              {confirmed.map(b => (
                <div key={b.id} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    {b.user_profile_image ? (
                      <img
                        src={b.user_profile_image}
                        alt={b.user_name}
                        className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${D ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                        {avatar(b.user_name)}
                      </div>
                    )}
                    <p className={`text-sm font-semibold truncate ${txt}`}>{b.user_name || 'Unknown'}</p>
                  </div>
                  <p className={`text-xs ${sub}`}>
                    {b.service_name} · {b.station_name}
                  </p>
                  <div className={`flex items-center gap-1 text-xs mt-0.5 ${sub}`}>
                    <IconCalendar />{b.travel_date}
                    <span className="mx-1">·</span>
                    <IconClock />{b.travel_time}
                  </div>
                  {b.vehicle_brand && (
                    <p className={`text-xs mt-0.5 flex items-center gap-1 ${sub}`}>
                      <IconCar /> {b.vehicle_type} — {b.vehicle_brand} {b.vehicle_number}
                    </p>
                  )}
                  {b.special_request && (
                    <p className={`text-xs mt-1 italic ${sub}`}>"{b.special_request}"</p>
                  )}
                  <div className="flex gap-2 mt-2.5">
                    <button
                      disabled={actioning[b.id]}
                      onClick={() => updateStatus(b.id, 'completed')}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                    >
                      <IconComplete /> Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Dashboard
