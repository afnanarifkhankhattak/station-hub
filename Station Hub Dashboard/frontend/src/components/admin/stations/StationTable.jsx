// frontend/src/components/admin/stations/StationTable.jsx

import StatusBadge from './StatusBadge';

// Convert station_type enum to friendly label
function formatType(type) {
  const map = {
    CAR_CARE: 'Car Care',
    EV: 'EV Charging',
    HEV: 'Hybrid',
    BOTH: 'Both',
  };
  return map[type] || type || '—';
}

// Format dates like "7 Oct 2026"
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function StationTable({ stations, onReview }) {
  if (!stations || stations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No stations found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        {/* Header */}
        <thead className="bg-gray-50 dark:bg-[#151821]">
          <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <th scope="col" className="px-5 py-3 font-medium">Station</th>
            <th scope="col" className="px-5 py-3 font-medium">Partner</th>
            <th scope="col" className="px-5 py-3 font-medium">Type</th>
            <th scope="col" className="px-5 py-3 font-medium">City</th>
            <th scope="col" className="px-5 py-3 font-medium">Status</th>
            <th scope="col" className="px-5 py-3 font-medium">Submitted</th>
            <th scope="col" className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-gray-100 dark:divide-[#2a2d3e] bg-white dark:bg-[#1a1d27]">
          {stations.map((station) => (
            <tr
              key={station.id}
              className="transition-colors hover:bg-gray-50/80 dark:hover:bg-[#20232e]"
            >
              {/* Station name + slug/ID */}
              <td className="px-5 py-4">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {station.name || 'Untitled Station'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {station.slug || station.id}
                </p>
              </td>

              {/* Partner */}
              <td className="px-5 py-4">
                <p className="text-gray-800 dark:text-gray-200">
                  {station.owner_name || 'Unknown'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {station.owner_email || '—'}
                </p>
              </td>

              {/* Type */}
              <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                {formatType(station.station_type)}
              </td>

              {/* City */}
              <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                {station.city || '—'}
              </td>

              {/* Status */}
              <td className="px-5 py-4">
                <StatusBadge status={station.status} />
              </td>

              {/* Submitted */}
              <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                {formatDate(station.created_at)}
              </td>

              {/* Actions */}
              <td className="px-5 py-4 text-right">
                <button
                  type="button"
                  onClick={() => onReview(station.id)}
                  className="inline-flex items-center gap-1 text-[#2563EB] dark:text-blue-400 hover:text-[#1d4ed8] dark:hover:text-blue-300 font-medium text-sm"
                >
                  Review
                  <span aria-hidden>→</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}