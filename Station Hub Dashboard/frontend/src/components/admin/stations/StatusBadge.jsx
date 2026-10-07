// frontend/src/components/admin/stations/StatusBadge.jsx

export default function StatusBadge({ status }) {
  // Map each status to a label + colors
  const config = {
    DRAFT:              { label: 'Draft',              bg: 'bg-gray-100',   text: 'text-gray-700' },
    SUBMITTED:          { label: 'Pending Review',     bg: 'bg-amber-100',  text: 'text-amber-700' },
    CHANGES_REQUESTED:  { label: 'Changes Requested',  bg: 'bg-orange-100', text: 'text-orange-700' },
    CHANGES_PENDING:    { label: 'Changes Pending',    bg: 'bg-blue-100',   text: 'text-blue-700' },
    APPROVED:           { label: 'Approved',           bg: 'bg-green-100',  text: 'text-green-700' },
    REJECTED:           { label: 'Rejected',           bg: 'bg-red-100',    text: 'text-red-700' },
    SUSPENDED:          { label: 'Suspended',          bg: 'bg-red-100',    text: 'text-red-700' },
  };

  const { label, bg, text } = config[status] || {
    label: status,
    bg: 'bg-gray-100',
    text: 'text-gray-700',
  };

  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      {label}
    </span>
  );
}