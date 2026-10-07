// frontend/src/pages/admin/adminDashboard/AdminDashboard.jsx

import { useState, useEffect, useCallback } from 'react'
import MetricCard from '../../../components/admin/MetricCard'
import { api } from '../../../api/api'

const Icon = ({ children, className = 'h-5 w-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    {children}
  </svg>
)

const iconPaths = {
  station: <><path strokeLinecap="round" strokeLinejoin="round" d="M4 21h16M6 21V5a2 2 0 012-2h8a2 2 0 012 2v16M9 7h1m4 0h1M9 11h1m4 0h1m-5 10v-5h4v5" /></>,
  check: <><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" /></>,
  alert: <><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.8L2.7 17a2 2 0 001.7 3h15.2a2 2 0 001.7-3L13.7 3.8a2 2 0 00-3.4 0z" /></>,
  car: <><path strokeLinecap="round" strokeLinejoin="round" d="M5 17h14l-1-6H6l-1 6zm2 0v2m10-2v2M7 11l1.5-4h7L17 11M3 14h2m14 0h2" /></>,
  bolt: <><path strokeLinecap="round" strokeLinejoin="round" d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></>,
  users: <><path strokeLinecap="round" strokeLinejoin="round" d="M16 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m8-10a4 4 0 100-8 4 4 0 000 8zm6 1a4 4 0 013 3.9V20m-1-12a4 4 0 010 7.7" /></>,
  booking: <><path strokeLinecap="round" strokeLinejoin="round" d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" /></>,
  report: <><path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14l-4-2-4 2-4-2-4 2z" /><path strokeLinecap="round" d="M8 8h8M8 12h6" /></>,
}

const EMPTY_STATS = {
  stations: { total: 0, approved: 0, pending: 0, suspended_rejected: 0, car_care: 0, ev: 0, hev: 0 },
  users: { total: 0, customers: 0 },
  bookings: { total: 0, today: 0 },
}

const AdminDashboard = () => {
  const [stats, setStats] = useState(EMPTY_STATS)
  const [approvals, setApprovals] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ─── Fetch all dashboard data ────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [statsRes, stationsRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getStations({ status: 'SUBMITTED', limit: 10 }),
      ])
      setStats(statsRes)
      setApprovals(stationsRes.stations || [])
    } catch (e) {
      console.error('Failed to load admin dashboard:', e)
      setError(e.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ─── Build metric cards from real stats ──────────────────
  const metrics = [
    ['Total Stations', stats.stations.total, 'All registered stations', 'station', 'indigo'],
    ['Approved Stations', stats.stations.approved, 'Live on the platform', 'check', 'green'],
    ['Pending Approval', stats.stations.pending, 'Needs review', 'clock', 'amber'],
    ['Suspended / Rejected', stats.stations.suspended_rejected, 'Moderation visibility', 'alert', 'red'],
    ['Car Care Stations', stats.stations.car_care, 'Wash and detailing', 'car', 'cyan'],
    ['EV Stations', stats.stations.ev, 'Charging locations', 'bolt', 'emerald'],
    ['Hybrid Stations', stats.stations.hev, 'Car care + EV', 'station', 'purple'],
    ['Total Customers', stats.users.customers, 'Registered users', 'users', 'teal'],
    ['Total Bookings', stats.bookings.total, 'Platform volume', 'booking', 'blue'],
    ['Bookings Today', stats.bookings.today, 'Operational snapshot', 'clock', 'sky'],
    ['Reviews / Reports', 0, 'Quality workload', 'report', 'rose'],
  ]

  // ─── Filter pending approvals by type ────────────────────
  const visibleApprovals =
    filter === 'All'
      ? approvals
      : approvals.filter((s) => {
          if (filter === 'Car Care') return s.station_type === 'CAR_CARE'
          if (filter === 'EV Station') return s.station_type === 'EV'
          if (filter === 'Hybrid') return s.station_type === 'HEV'
          return true
        })

  // ─── Handle approve/reject (placeholder for Task 2.4) ────
  const updateApproval = (id, action) => {
    if (action === 'view') {
      window.alert('Station review coming soon. (Task 2.4 will wire this up.)')
      return
    }
    window.alert(`${action === 'approve' ? 'Approve' : 'Reject'} coming in Task 2.4.`)
  }

  // ─── Loading state ───────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-75 bg-gray-50 dark:bg-[#0f1117]">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ─── Error state ─────────────────────────────────────────
  if (error) {
    return (
      <main className="flex-1 overflow-auto bg-gray-50 p-6 dark:bg-[#0f1117]">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            <h2 className="text-lg font-semibold">Failed to load dashboard</h2>
            <p className="mt-2 text-sm">{error}</p>
            <button
              type="button"
              onClick={fetchData}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ─── Main content ────────────────────────────────────────
  return (
    <main className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 dark:bg-[#0f1117]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
              Platform control center
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              Admin overview
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Monitor stations, customers, and moderation activity in one place.
            </p>
          </div>
          <div className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-xs text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />
            All systems operational
          </div>
        </div>

        <section
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          aria-label="Platform metrics"
        >
          {metrics.map(([label, value, detail, icon, accent]) => (
            <MetricCard
              key={label}
              label={label}
              value={value.toLocaleString?.() ?? value}
              detail={detail}
              accent={accent}
              icon={<Icon>{iconPaths[icon]}</Icon>}
            />
          ))}
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-[#2a2d3e] dark:bg-[#1a1d27]">
          <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#2a2d3e]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Recent pending approvals
                </h2>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                  {approvals.length}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Review new station listings before they become public.
              </p>
            </div>
            <div
              className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-[#0f1117]"
              aria-label="Filter approvals"
            >
              {['All', 'Car Care', 'EV Station', 'Hybrid'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    filter === option
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-[#2a2d3e] dark:text-gray-100'
                      : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            {visibleApprovals.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                {approvals.length === 0
                  ? 'No pending approvals. All stations are up to date. ✅'
                  : 'No approvals match this filter.'}
              </p>
            ) : (
              <table className="w-full min-w-180 text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-400 dark:bg-[#151821] dark:text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Station</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Location</th>
                    <th className="px-5 py-3 font-medium">Submitted</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#2a2d3e]">
                  {visibleApprovals.map((station) => (
                    <tr
                      key={station.id}
                      className="transition-colors hover:bg-gray-50/80 dark:hover:bg-[#20232e]"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {station.name || 'Untitled station'}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {station.owner_name || 'Unknown owner'}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-[#2a2d3e] dark:text-gray-300">
                          {formatStationType(station.station_type)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                        {station.city || station.address || '—'}
                      </td>
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(station.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => updateApproval(station.id, 'approve')}
                            className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => updateApproval(station.id, 'reject')}
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => updateApproval(station.id, 'view')}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-[#3a3e4e] dark:text-gray-300 dark:hover:bg-[#2a2d3e]"
                          >
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

// ─── Helpers ──────────────────────────────────────────────
function formatStationType(type) {
  const map = {
    CAR_CARE: 'Car Care',
    EV: 'EV Station',
    HEV: 'Hybrid',
  }
  return map[type] || type || '—'
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
  } catch {
    return dateStr
  }
}

export default AdminDashboard