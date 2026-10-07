// frontend/src/pages/admin/adminStations/AdminStations.jsx

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StationTable from '../../../components/admin/stations/StationTable';
import { api } from '../../../api/api';

const TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'SUBMITTED', label: 'Pending Review' },
  { key: 'CHANGES_PENDING', label: 'Changes Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'SUSPENDED', label: 'Suspended' },
  { key: 'REJECTED', label: 'Rejected' },
];

export default function AdminStations() {
  const navigate = useNavigate();

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchStations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 50 };
      if (activeTab !== 'ALL') params.status = activeTab;
      if (typeFilter) params.station_type = typeFilter;

      const res = await api.admin.getStations(params);
      console.log('[AdminStations] API response:', res);

      // ⚠️ Defensive: handle null/undefined responses
      const list = res?.stations ?? [];
      setStations(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to load stations:', e);
      setError(e.message || 'Failed to load stations');
      setStations([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, typeFilter]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const filteredStations = stations.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.owner_name || '').toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q)
    );
  });

  const handleReview = (id) => {
    navigate(`/admin/admin-stations/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-75">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <h2 className="text-lg font-semibold">Failed to load stations</h2>
          <p className="mt-2 text-sm">{error}</p>
          <button
            type="button"
            onClick={fetchStations}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#263547]">Stations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review, approve, and manage all station listings
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search by name, partner, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-60 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <option value="">All Types</option>
            <option value="CAR_CARE">Car Care</option>
            <option value="EV">EV Charging</option>
            <option value="HEV">Hybrid</option>
            <option value="BOTH">Both</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-[#10233F] text-white'
                : 'bg-white text-[#263547] border hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        {filteredStations.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            {search
              ? 'No stations match your search.'
              : 'No stations found for this filter.'}
          </div>
        ) : (
          <StationTable
            stations={filteredStations}
            onReview={handleReview}
          />
        )}
      </div>

      <div className="mt-3 text-sm text-gray-500">
        Showing {filteredStations.length} of {stations.length} stations
      </div>
    </div>
  );
}