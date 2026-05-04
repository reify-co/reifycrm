import React from 'react';
import { LEADS, AGENTS } from '@/data/mockData';
import { Phone, MessageCircle, Mail, Video } from 'lucide-react';

const TYPE_ICON: Record<string, React.ReactNode> = {
  Call: <Phone size={12} />,
  WhatsApp: <MessageCircle size={12} />,
  Email: <Mail size={12} />,
  'Video Call': <Video size={12} />,
  Meeting: <Phone size={12} />,
};

export default function RecentActivityFeed() {
  const allLogs = LEADS.flatMap((lead) =>
    lead.followUpLog.map((log) => ({
      ...log,
      leadName: lead.name,
      leadId: lead.id,
      destination: lead.destination,
    }))
  )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-600 text-foreground">Recent Activity</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Latest follow-up actions</p>
      </div>
      <ul className="divide-y divide-border">
        {allLogs.map((log) => {
          const agent = AGENTS.find((a) => a.id === log.agentId);
          const timeAgo = (() => {
            const diff = Date.now() - new Date(log.date).getTime();
            const hrs = Math.floor(diff / 3600000);
            if (hrs < 1) return 'Just now';
            if (hrs < 24) return `${hrs}h ago`;
            return `${Math.floor(hrs / 24)}d ago`;
          })();
          return (
            <li key={`activity-${log.id}`} className="px-4 py-3 flex items-start gap-3 hover:bg-muted/20 transition-colors">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                {TYPE_ICON[log.type] ?? <Phone size={12} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-500 text-foreground truncate">
                  {log.leadName} · {log.destination}
                </p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{log.notes}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {agent?.name} · {timeAgo}
                </p>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-500 flex-shrink-0 ${
                log.outcome === 'Converted' ? 'bg-green-50 text-green-700' :
                log.outcome === 'Not Interested'? 'bg-red-50 text-red-700' : 'bg-muted text-muted-foreground'
              }`}>
                {log.outcome}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}