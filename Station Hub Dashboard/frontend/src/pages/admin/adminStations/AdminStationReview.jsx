// frontend/src/pages/admin/adminStations/AdminStationReview.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, AlertTriangle, Ban } from 'lucide-react';
import StatusBadge from '../../../components/admin/stations/StatusBadge';
import ActionReasonModal from '../../../components/admin/stations/ActionReasonModal';
import Section from '../../../components/admin/stations/Section';
import {
  FacilityIcons,
  DefaultFacilityIcon,
  ConnectorIcon,
  VerifiedIcon,
} from '../../../constant/icons';
import { api } from '../../../api/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminStationReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [modalAction, setModalAction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Fetch station detail ────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/admin/stations?limit=50`);
        const match = (res.stations || []).find((s) => s.id === id);
        if (cancelled) return;
        if (!match) {
          setError('Station not found.');
        } else {
          setStation(match);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load station');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // ─── Handle moderation action ────────────────────────────
  const handleAction = async (action, reason = '') => {
    const statusMap = {
      approve: 'APPROVED',
      requestChanges: 'CHANGES_REQUESTED',
      reject: 'REJECTED',
      suspend: 'SUSPENDED',
    };
    const newStatus = statusMap[action];
    if (!newStatus) return;

    setIsSubmitting(true);
    try {
      const res = await api.admin.updateStationStatus(id, newStatus, reason);
      // Update local state with new status
      setStation((prev) => ({
        ...prev,
        status: res.new_status,
        review_notes: reason,
      }));
      setModalAction(null);
      window.alert(res.message || `Station ${newStatus.toLowerCase()}`);
    } catch (e) {
      window.alert(e.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-75">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Error state ────────────────────────────────────────
  if (error || !station) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || 'Station not found.'}</p>
        <button
          onClick={() => navigate('/admin/admin-stations')}
          className="mt-3 text-[#2563EB]"
        >
          ← Back to Stations
        </button>
      </div>
    );
  }

  // ─── Action permissions ─────────────────────────────────
  const canApprove = station.status === 'SUBMITTED' || station.status === 'CHANGES_PENDING';
  const canRequestChanges = station.status === 'SUBMITTED';
  const canReject = station.status === 'SUBMITTED' || station.status === 'CHANGES_PENDING';
  const canSuspend = station.status === 'APPROVED';

  // For mock-data-driven tabs, default to empty arrays if not present
  const services = station.services || [];
  const chargingUnits = station.chargingUnits || [];
  const facilities = station.facilities || [];
  const documents = station.documents || [];
  const approvalHistory = station.moderation_history || [];

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'services', label: `Services (${services.length})` },
    { key: 'ev', label: `EV Charging (${chargingUnits.length})` },
    { key: 'facilities', label: `Facilities (${facilities.length})` },
    { key: 'documents', label: `Documents (${documents.length})` },
    { key: 'history', label: `Moderation History (${approvalHistory.length})` },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-32">
      {/* HEADER */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <button
            onClick={() => navigate('/admin/admin-stations')}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-2 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Stations
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#263547]">
              {station.name || 'Untitled Station'}
            </h1>
            <StatusBadge status={station.status} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {station.owner_name || 'Unknown owner'} • {station.city || 'Unknown city'}
          </p>

          <div className="flex gap-6 mt-4 -mb-px overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-6 py-6 max-w-5xl mx-auto space-y-6">
        {activeTab === 'overview' && <OverviewTab station={station} />}
        {activeTab === 'services' && <ServicesTab station={station} services={services} />}
        {activeTab === 'ev' && <EVTab station={station} chargingUnits={chargingUnits} />}
        {activeTab === 'facilities' && <FacilitiesTab facilities={facilities} />}
        {activeTab === 'documents' && <DocumentsTab documents={documents} />}
        {activeTab === 'history' && <HistoryTab history={approvalHistory} />}
      </div>

      {/* STICKY ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
        <div className="px-6 py-4 max-w-5xl mx-auto flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Current status:{' '}
            <span className="font-medium text-[#263547]">{station.status}</span>
          </div>
          <div className="flex gap-3">
            {canSuspend && (
              <button
                onClick={() => setModalAction('suspend')}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 font-medium text-sm"
              >
                <Ban size={15} />
                Suspend
              </button>
            )}
            {canReject && (
              <button
                onClick={() => setModalAction('reject')}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 font-medium text-sm"
              >
                <X size={15} />
                Reject
              </button>
            )}
            {canRequestChanges && (
              <button
                onClick={() => setModalAction('requestChanges')}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 disabled:opacity-50 font-medium text-sm"
              >
                <AlertTriangle size={15} />
                Request Changes
              </button>
            )}
            {canApprove && (
              <button
                onClick={() => handleAction('approve', '')}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#10B981] text-white rounded-lg hover:bg-[#0d9668] disabled:opacity-50 font-medium text-sm"
              >
                <Check size={15} />
                Approve Station
              </button>
            )}
          </div>
        </div>
      </div>

      <ActionReasonModal
        isOpen={modalAction !== null}
        action={modalAction}
        onClose={() => setModalAction(null)}
        onConfirm={(reason) => handleAction(modalAction, reason)}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

// ─── Reusable helpers ─────────────────────────────────────
function Field({ label, value, fullWidth, mono }) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`mt-1 text-sm text-[#263547] ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </div>
    </div>
  );
}

function OverviewTab({ station }) {
  // Some fields might not exist for real-data stations (they were for mock data)
  const address = station.address || {};
  const coordinates = station.coordinates || {
    latitude: station.latitude,
    longitude: station.longitude,
  };

  return (
    <>
      <Section title="Business Identity & Partner Account" iconKey="businessIdentity">
        <div className="grid grid-cols-2 gap-6">
          <Field label="Station Name" value={station.name} />
          <Field label="Slug" value={station.slug || station.id} mono />
          <Field label="Description" value={station.description} fullWidth />
          <Field label="Contact Phone" value={station.phone} />
          <Field label="Contact Email" value={station.email} />
          <Field label="Website" value={station.website} />
        </div>
        <hr className="my-5 border-gray-100" />
        <div className="grid grid-cols-2 gap-6">
          <Field label="Owner Name" value={station.owner_name} />
          <Field label="Owner Email" value={station.owner_email} />
          <Field label="Owner ID" value={station.owner_id} mono />
          <Field label="Submitted" value={station.created_at ? new Date(station.created_at).toLocaleString() : '—'} />
        </div>
      </Section>

      <Section title="Station Category & Type" iconKey="categoryType">
        <div className="flex gap-3 mb-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              station.station_type === 'CAR_CARE' || station.station_type === 'BOTH'
                ? 'bg-[#2563EB] text-white'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            Car Care
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              station.station_type === 'EV' || station.station_type === 'BOTH'
                ? 'bg-[#10B981] text-white'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            EV Charging
          </span>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Field label="Station Type" value={station.station_type} />
          <Field label="Publicly Visible" value={station.is_public ? 'Yes' : 'No'} />
        </div>
      </Section>

      <Section title="Map Location & Address" iconKey="location">
        <div className="grid grid-cols-2 gap-6 mb-4">
          <Field label="Address" value={address.line1 || station.address} fullWidth />
          <Field label="City" value={address.city || station.city} />
          <Field label="Province" value={address.province} />
          <Field label="Country" value={address.countryCode || 'PK'} />
        </div>
        {coordinates.latitude && coordinates.longitude && (
          <>
            <hr className="my-4 border-gray-100" />
            <div className="grid grid-cols-2 gap-6 mb-4">
              <Field label="Latitude" value={coordinates.latitude} mono />
              <Field label="Longitude" value={coordinates.longitude} mono />
            </div>
            <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
              <iframe
                title="Station location"
                width="100%"
                height="100%"
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                  coordinates.longitude - 0.01
                }%2C${coordinates.latitude - 0.01}%2C${
                  coordinates.longitude + 0.01
                }%2C${coordinates.latitude + 0.01}&layer=mapnik&marker=${
                  coordinates.latitude
                }%2C${coordinates.longitude}`}
              />
            </div>
          </>
        )}
      </Section>

      <Section title="Moderation Notes" iconKey="history">
        <Field label="Reviewed By" value={station.reviewed_by} mono />
        <Field label="Reviewed At" value={station.reviewed_at} />
        <Field label="Review Notes" value={station.review_notes} fullWidth />
      </Section>
    </>
  );
}

function ServicesTab({ station, services }) {
  if (!services || services.length === 0) {
    return (
      <Section title="Car-Care Services" iconKey="services">
        <p className="text-sm text-gray-400">No services listed for this station.</p>
      </Section>
    );
  }
  return (
    <Section title={`Car-Care Services (${services.length})`} iconKey="services">
      <div className="space-y-3">
        {services.map((svc) => (
          <div key={svc.id} className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-[#263547]">{svc.name}</h4>
            <p className="text-sm text-gray-600 mt-1">{svc.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function EVTab({ station, chargingUnits }) {
  if (!chargingUnits || chargingUnits.length === 0) {
    return (
      <Section title="EV Charging" iconKey="evCharging">
        <p className="text-sm text-gray-400">No charging units configured.</p>
      </Section>
    );
  }
  return (
    <Section title={`Charging Units (${chargingUnits.length})`} iconKey="evCharging">
      <div className="space-y-4">
        {chargingUnits.map((unit) => (
          <div key={unit.id} className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-[#263547]">{unit.label}</h4>
            <p className="text-sm text-gray-600 mt-1">
              {unit.chargingType} • {unit.maxPowerKw} kW • Qty: {unit.quantity}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function FacilitiesTab({ facilities }) {
  if (!facilities || facilities.length === 0) {
    return (
      <Section title="Facilities" iconKey="facilities">
        <p className="text-sm text-gray-400">No facilities listed.</p>
      </Section>
    );
  }
  return (
    <Section title={`Facilities (${facilities.length})`} iconKey="facilities">
      <div className="grid grid-cols-3 gap-3">
        {facilities.map((f, idx) => {
          const name = typeof f === 'string' ? f : f.name;
          const Icon = FacilityIcons[name] || DefaultFacilityIcon;
          return (
            <div
              key={f.id || idx}
              className="flex items-center gap-2.5 px-3 py-2.5 border border-gray-200 rounded-lg"
            >
              <Icon size={16} className="text-[#2563EB] shrink-0" />
              <span className="text-sm text-[#263547]">{name}</span>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function DocumentsTab({ documents }) {
  if (!documents || documents.length === 0) {
    return (
      <Section title="Verification Documents" iconKey="documents">
        <p className="text-sm text-gray-400">No documents uploaded.</p>
      </Section>
    );
  }
  return (
    <Section title={`Verification Documents (${documents.length})`} iconKey="documents">
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
          >
            <div className="text-sm font-medium text-[#263547]">{doc.type}</div>
            <a href={doc.url} className="text-xs text-[#2563EB] hover:underline font-medium">
              View
            </a>
          </div>
        ))}
      </div>
    </Section>
  );
}

function HistoryTab({ history }) {
  if (!history || history.length === 0) {
    return (
      <Section title="Moderation History" iconKey="history">
        <p className="text-sm text-gray-400">No moderation history yet.</p>
      </Section>
    );
  }
  return (
    <Section title="Moderation History" iconKey="history">
      <div className="space-y-4">
        {[...history].reverse().map((entry, idx) => (
          <div key={entry.id || idx} className="border-l-2 border-[#2563EB] pl-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#263547]">
                {entry.action || entry.new_status}
              </span>
              {entry.previous_status && (
                <span className="text-xs text-gray-500">
                  {entry.previous_status} → {entry.new_status || entry.action}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              By {entry.by || entry.actor?.name || 'Admin'} •{' '}
              {entry.at ? new Date(entry.at).toLocaleString() : '—'}
            </div>
            {entry.reason && (
              <div className="text-sm text-gray-700 mt-2 bg-amber-50 border border-amber-200 rounded p-2">
                <span className="font-medium">Reason:</span> {entry.reason}
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}