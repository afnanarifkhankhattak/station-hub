// frontend/src/components/admin/stations/Section.jsx

import { SectionIcons } from '../../../constant/icons';

export default function Section({ title, iconKey, children }) {
  const Icon = SectionIcons[iconKey];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-[#263547] mb-4 flex items-center gap-2">
        {Icon && <Icon size={18} className="text-[#2563EB]" strokeWidth={2.2} />}
        <span>{title}</span>
      </h2>
      {children}
    </div>
  );
}