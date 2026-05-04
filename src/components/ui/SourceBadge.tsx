import React from 'react';
import { SOURCE_COLORS } from '@/data/mockData';
import type { LeadSource } from '@/data/mockData';

export default function SourceBadge({ source }: { source: LeadSource }) {
  const colors = SOURCE_COLORS[source] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
      {source}
    </span>
  );
}