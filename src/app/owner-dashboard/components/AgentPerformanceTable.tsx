import React from 'react';
import { AGENT_PERFORMANCE } from '@/data/mockData';
import { AlertTriangle } from 'lucide-react';

export default function AgentPerformanceTable() {
  return (
    <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-600 text-foreground">Agent Performance</h3>
          <p className="text-xs text-muted-foreground mt-0.5">This month — all agents</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-5 py-2.5 text-[11px] font-600 uppercase tracking-wider text-muted-foreground">Agent</th>
              <th className="text-center px-4 py-2.5 text-[11px] font-600 uppercase tracking-wider text-muted-foreground">Total</th>
              <th className="text-center px-4 py-2.5 text-[11px] font-600 uppercase tracking-wider text-muted-foreground">Active</th>
              <th className="text-center px-4 py-2.5 text-[11px] font-600 uppercase tracking-wider text-muted-foreground">Booked</th>
              <th className="text-center px-4 py-2.5 text-[11px] font-600 uppercase tracking-wider text-muted-foreground">Conv. %</th>
              <th className="text-center px-4 py-2.5 text-[11px] font-600 uppercase tracking-wider text-muted-foreground">Overdue</th>
              <th className="text-center px-4 py-2.5 text-[11px] font-600 uppercase tracking-wider text-muted-foreground">Avg Response</th>
            </tr>
          </thead>
          <tbody>
            {AGENT_PERFORMANCE?.map((agent) => (
              <tr key={`perf-${agent?.agentId}`} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-700 flex items-center justify-center flex-shrink-0">
                      {agent?.avatar}
                    </div>
                    <div>
                      <p className="font-500 text-foreground text-sm">{agent?.name}</p>
                      {agent?.isOnLeave && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-500">On Leave</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-tabular font-500">{agent?.totalLeads}</td>
                <td className="px-4 py-3 text-center font-tabular font-500">{agent?.active}</td>
                <td className="px-4 py-3 text-center">
                  <span className="font-tabular font-600 text-green-700">{agent?.booked}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-tabular font-600 ${agent?.conversionRate > 0 ? 'text-green-700' : 'text-muted-foreground'}`}>
                    {agent?.conversionRate}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {agent?.overdueFollowUps > 0 ? (
                    <span className="inline-flex items-center gap-1 text-red-600 font-600 font-tabular text-xs">
                      <AlertTriangle size={12} />
                      {agent?.overdueFollowUps}
                    </span>
                  ) : (
                    <span className="text-muted-foreground font-tabular">0</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center font-tabular text-muted-foreground text-xs">
                  {agent?.avgResponseHrs}h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}