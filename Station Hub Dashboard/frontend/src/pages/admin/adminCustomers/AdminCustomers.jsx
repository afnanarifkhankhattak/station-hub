// frontend/src/pages/admin/adminCustomers/AdminCustomers.jsx

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../api/api';

// Role tabs
const ROLE_TABS = [
  { key: 'ALL', label: 'All Users' },
  { key: 'user', label: 'Customers' },
  { key: 'station_owner', label: 'Owners' },
  { key: 'admin', label: 'Admins' },
];

// Status tabs
const STATUS_TABS = [
  { key: 'ALL', label: 'Any Status' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'SUSPENDED', label: 'Suspended' },
  { key: 'BLOCKED', label: 'Blocked' },
];

// Role pill
function RoleBadge({ role }) {
  const map = {
    user: { label: 'Customer', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' },
    station_owner: { label: 'Owner', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' },
    admin: { label: 'Admin', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300' },
  };
  const { label, cls } = map[role] || { label: role || '—', cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// Status pill
function StatusPill({ status }) {
  const map = {
    ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    SUSPENDED: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    BLOCKED: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
    PENDING: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300',
  };
  const cls = map[status] || map.PENDING;
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

export default function AdminCustomers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleTab, setRoleTab] = useState('ALL');
  const [statusTab, setStatusTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);

  // ─── Fetch users ─────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 100 };
      if (roleTab !== 'ALL') params.role = roleTab;
      if (statusTab !== 'ALL') params.status = statusTab;

      const res = await api.admin.getUsers(params);
      setUsers(Array.isArray(res?.users) ? res.users : []);
    } catch (e) {
      console.error('Failed to load users:', e);
      setError(e.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [roleTab, statusTab]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ─── Client-side search ──────────────────────────────────
  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });

  // ─── Suspend / Reactivate ────────────────────────────────
  const handleSuspend = async (user) => {
    const reason = window.prompt(
      `Reason for suspending ${user.full_name || user.email}?`,
      ''
    );
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      alert('A reason is required.');
      return;
    }
    setBusyId(user.id);
    try {
      await api.admin.updateUserStatus(user.id, 'SUSPENDED', reason);
      await fetchUsers();
      alert('User suspended');
    } catch (e) {
      alert(e.message || 'Failed to suspend user');
    } finally {
      setBusyId(null);
    }
  };

  const handleReactivate = async (user) => {
    setBusyId(user.id);
    try {
      await api.admin.updateUserStatus(user.id, 'ACTIVE', '');
      await fetchUsers();
      alert('User reactivated');
    } catch (e) {
      alert(e.message || 'Failed to reactivate user');
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  return (
    <main className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 dark:bg-[#0f1117]">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
            User management
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Customers & Accounts
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View all registered users, filter by role, and manage account status.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 dark:bg-[#1a1d27] dark:border-[#2a2d3e]">
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-60 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] dark:bg-[#0f1117] dark:border-[#2a2d3e] dark:text-gray-100"
            />
          </div>
        </div>

        {/* Role tabs */}
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRoleTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                roleTab === tab.key
                  ? 'bg-[#10233F] text-white dark:bg-[#2563EB]'
                  : 'bg-white text-[#263547] border border-gray-200 hover:bg-gray-50 dark:bg-[#1a1d27] dark:text-gray-300 dark:border-[#2a2d3e] dark:hover:bg-[#2a2d3e]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusTab === tab.key
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-[#263547] border border-gray-200 hover:bg-gray-50 dark:bg-[#1a1d27] dark:text-gray-300 dark:border-[#2a2d3e] dark:hover:bg-[#2a2d3e]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            <p className="text-sm font-medium">{error}</p>
            <button
              type="button"
              onClick={fetchUsers}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        )}

        {/* Users table */}
        {!loading && !error && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden dark:bg-[#1a1d27] dark:border-[#2a2d3e]">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                {search ? 'No users match your search.' : 'No users found.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-[#151821]">
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <th scope="col" className="px-5 py-3 font-medium">User</th>
                      <th scope="col" className="px-5 py-3 font-medium">Role</th>
                      <th scope="col" className="px-5 py-3 font-medium">Status</th>
                      <th scope="col" className="px-5 py-3 font-medium">Phone</th>
                      <th scope="col" className="px-5 py-3 font-medium">Joined</th>
                      <th scope="col" className="px-5 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#2a2d3e]">
                    {filteredUsers.map((user) => {
                      const userStatus = user.status || 'ACTIVE';
                      const isSuspended = userStatus === 'SUSPENDED' || userStatus === 'BLOCKED';
                      return (
                        <tr
                          key={user.id}
                          className="transition-colors hover:bg-gray-50/80 dark:hover:bg-[#20232e]"
                        >
                          <td className="px-5 py-4">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {user.full_name || 'Unnamed User'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {user.email}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <RoleBadge role={user.role} />
                          </td>
                          <td className="px-5 py-4">
                            <StatusPill status={userStatus} />
                          </td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                            {user.phone || '—'}
                          </td>
                          <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {isSuspended ? (
                              <button
                                type="button"
                                disabled={busyId === user.id}
                                onClick={() => handleReactivate(user)}
                                className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                              >
                                {busyId === user.id ? '...' : 'Reactivate'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busyId === user.id}
                                onClick={() => handleSuspend(user)}
                                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                              >
                                {busyId === user.id ? '...' : 'Suspend'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Count */}
        {!loading && !error && (
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        )}
      </div>
    </main>
  );
}