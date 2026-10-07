// frontend/src/components/admin/stations/ActionReasonModal.jsx

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// Dropdown options for Request Changes only
const REQUEST_CHANGE_REASONS = [
  'Incomplete business information',
  'Photos are unclear or missing',
  'Incorrect pricing or service details',
  'Invalid location or address',
  'Missing required documents',
  'Duplicate station listing',
  'Other (please specify below)',
];

const ACTION_CONFIG = {
  requestChanges: {
    title: 'Request Changes',
    description: 'Tell the partner what needs to be corrected. They will be able to resubmit.',
    confirmLabel: 'Send Request',
    confirmColor: 'bg-amber-500 hover:bg-amber-600',
    requireReason: true,
    showDropdown: true,
  },
  reject: {
    title: 'Reject Station',
    description: 'This will reject the listing. The partner will see your reason and cannot resubmit without creating a new submission.',
    confirmLabel: 'Reject Station',
    confirmColor: 'bg-red-600 hover:bg-red-700',
    requireReason: true,
    showDropdown: false,
  },
  suspend: {
    title: 'Suspend Station',
    description: 'The station will be removed from public discovery until restored. Provide a clear reason.',
    confirmLabel: 'Suspend Station',
    confirmColor: 'bg-red-600 hover:bg-red-700',
    requireReason: true,
    showDropdown: false,
  },
};

export default function ActionReasonModal({ isOpen, action, onClose, onConfirm, isSubmitting }) {
  const [dropdownReason, setDropdownReason] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDropdownReason('');
      setReason('');
      setError('');
    }
  }, [isOpen, action]);

  if (!isOpen || !action) return null;

  const config = ACTION_CONFIG[action];

  const handleConfirm = () => {
    // For Request Changes: dropdown must be selected
    if (config.showDropdown && !dropdownReason) {
      setError('Please select a reason from the dropdown.');
      return;
    }

    // Reason textarea must have at least 10 characters
    if (config.requireReason && reason.trim().length < 10) {
      setError('Please provide a reason (at least 10 characters).');
      return;
    }

    setError('');

    // Combine dropdown + reason for Request Changes
    const finalReason = config.showDropdown
      ? `${dropdownReason}${reason.trim() ? ` — ${reason.trim()}` : ''}`
      : reason.trim();

    onConfirm(finalReason);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-bold text-[#263547]">{config.title}</h2>
        <p className="text-sm text-gray-600 mt-2 pr-8">{config.description}</p>

        {/* DROPDOWN — only for Request Changes */}
        {config.showDropdown && (
          <div className="mt-5">
            <label className="block text-sm font-medium text-[#263547] mb-1">
              Select Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={dropdownReason}
              onChange={(e) => setDropdownReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white text-sm"
            >
              <option value="">— Choose a reason —</option>
              {REQUEST_CHANGE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* REASON TEXTAREA */}
        <div className="mt-5">
          <label className="block text-sm font-medium text-[#263547] mb-1">
            {config.showDropdown ? 'Additional Details' : 'Reason'}{' '}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder={
              config.showDropdown
                ? 'Add any specific details the partner needs to know...'
                : 'Explain why this action is being taken...'
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
          />
        </div>

        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-[#263547] hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`px-4 py-2 text-white rounded-lg text-sm font-medium ${config.confirmColor} disabled:opacity-50`}
          >
            {isSubmitting ? 'Processing...' : config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}