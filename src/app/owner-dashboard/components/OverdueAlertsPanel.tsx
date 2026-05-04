import React from 'react';
import Link from 'next/link';
import { LEADS, AGENTS } from '@/data/mockData';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export default function OverdueAlertsPanel() {
  const overdueLeads = LEADS?.filter((l) => l?.isOverdue);

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-red-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} className="text-red-600" />
          <h3 className="text-sm font-600 text-red-800">Overdue Follow-ups</h3>
        </div>
        <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-600">
          {overdueLeads?.length}
        </span>
      </div>
      <div className="divide-y divide-red-200">
        {overdueLeads?.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-red-600">
            No overdue follow-ups — great work!
          </div>
        ) : (
          overdueLeads?.map((lead) => {
            const agent = AGENTS?.find((a) => a?.id === lead?.assignedAgentId);
            return (
              <div key={`overdue-${lead?.id}`} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-600 text-red-900 truncate">{lead?.name}</p>
                  <p className="text-xs text-red-700 truncate">{lead?.destination} · {agent?.name}</p>
                  <p className="text-[11px] text-red-600 mt-0.5">Due: {new Date(lead.nextFollowUp)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
                <Link href="/lead-detail" className="text-red-700 hover:text-red-900 transition-colors">
                  <ArrowRight size={14} />
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}