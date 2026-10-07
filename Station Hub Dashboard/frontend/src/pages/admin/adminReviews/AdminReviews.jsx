import { useState, useEffect, useCallback } from 'react'
import { api } from '../../../api/api'

const AdminReviews = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'visible' | 'hidden'
  const [busyId, setBusyId] = useState(null)

  // ─── Fetch reviews ───────────────────────────────────────
  const fetchReviews = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (filter === 'visible') params.hidden = false
      if (filter === 'hidden') params.hidden = true

      const data = await api.admin.reviews.list(params)
      setReviews(data.reviews || [])
    } catch (e) {
      console.error('Failed to load reviews:', e)
      setError(e.message || 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  // ─── Toggle hide/unhide ──────────────────────────────────
  const handleToggleHide = async (review) => {
    const nextHidden = !review.is_hidden
    setBusyId(review.id)
    try {
      await api.admin.reviews.moderate(
        review.id,
        nextHidden,
        nextHidden ? 'Policy violation' : '',
      )
      // Optimistic update
      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id ? { ...r, is_hidden: nextHidden } : r,
        ),
      )
    } catch (e) {
      alert(e.message || 'Action failed')
    } finally {
      setBusyId(null)
    }
  }

  // ─── Helpers ─────────────────────────────────────────────
  const renderStars = (rating) => {
    const n = Math.max(0, Math.min(5, Number(rating) || 0))
    return '★'.repeat(n) + '☆'.repeat(5 - n)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // ─── Loading state ───────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-75">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 dark:bg-[#0f1117]">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
            Quality control
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Reviews Moderation
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review, hide, or unhide customer reviews. Hidden reviews are excluded
            from public view and from station ratings.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-[#0f1117] w-fit">
          {[
            ['all', 'All'],
            ['visible', 'Visible'],
            ['hidden', 'Hidden'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-[#2a2d3e] dark:text-gray-100'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            <p className="text-sm font-medium">{error}</p>
            <button
              type="button"
              onClick={fetchReviews}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!error && reviews.length === 0 && (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white py-16 text-center dark:border-[#2a2d3e] dark:bg-[#1a1d27]">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filter === 'hidden'
                ? 'No hidden reviews.'
                : filter === 'visible'
                ? 'No visible reviews yet.'
                : 'No reviews to moderate.'}
            </p>
          </div>
        )}

        {/* Reviews list */}
        {!error && reviews.length > 0 && (
          <div className="mt-6 space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition-colors dark:bg-[#1a1d27] ${
                  review.is_hidden
                    ? 'border-red-200 dark:border-red-500/30'
                    : 'border-gray-200 dark:border-[#2a2d3e]'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {review.user_name || 'Anonymous'}
                      </span>
                      <span className="text-sm text-orange-500 tracking-wider">
                        {renderStars(review.rating)}
                      </span>
                      {review.is_hidden ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/20 dark:text-red-300">
                          Hidden
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                          Visible
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatDate(review.created_at)}
                      </span>
                    </div>

                    {/* Comment */}
                    {review.comment ? (
                      <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                        {review.comment}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm italic text-gray-400">
                        (no comment)
                      </p>
                    )}

                    {/* Tags */}
                    {review.tags && review.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {review.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-[#2a2d3e] dark:text-gray-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Station */}
                    {review.station_name && (
                      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                        Station:{' '}
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {review.station_name}
                        </span>
                      </p>
                    )}

                    {/* Moderation log */}
                    {review.moderation_log && review.moderation_log.length > 0 && (
                      <details className="mt-3">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 dark:text-gray-400">
                          Moderation history ({review.moderation_log.length})
                        </summary>
                        <ul className="mt-2 space-y-1 pl-4 text-xs text-gray-500 dark:text-gray-400">
                          {review.moderation_log.map((entry, idx) => (
                            <li key={idx}>
                              <span className="font-medium">{entry.action}</span>
                              {entry.reason ? ` — ${entry.reason}` : ''}
                              {' '}
                              <span className="text-gray-400">
                                ({formatDate(entry.at)})
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleHide(review)}
                      disabled={busyId === review.id}
                      className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
                        review.is_hidden
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20'
                          : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20'
                      }`}
                    >
                      {busyId === review.id
                        ? '...'
                        : review.is_hidden
                        ? 'Unhide'
                        : 'Hide'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default AdminReviews