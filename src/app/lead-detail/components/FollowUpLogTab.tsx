'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Phone, MessageCircle, Mail, Video, Users, Plus, X } from 'lucide-react';
import type { Lead, FollowUpLog, FollowUpType, FollowUpOutcome } from '@/data/mockData';

const TYPE_OPTIONS: FollowUpType[] = ['Call', 'WhatsApp', 'Email', 'Meeting', 'Video Call'];
const OUTCOME_OPTIONS: FollowUpOutcome[] = [
  'Reached', 'No Answer', 'Callback Requested', 'Sent Info', 'Meeting Scheduled', 'Not Interested', 'Converted',
];

const TYPE_ICON: Record<FollowUpType, React.ReactNode> = {
  Call: <Phone size={13} />,
  WhatsApp: <MessageCircle size={13} />,
  Email: <Mail size={13} />,
  Meeting: <Users size={13} />,
  'Video Call': <Video size={13} />,
};

const TYPE_COLORS: Record<FollowUpType, string> = {
  Call: 'bg-blue-100 text-blue-700',
  WhatsApp: 'bg-green-100 text-green-700',
  Email: 'bg-purple-100 text-purple-700',
  Meeting: 'bg-orange-100 text-orange-700',
  'Video Call': 'bg-teal-100 text-teal-700',
};

const OUTCOME_COLORS: Record<FollowUpOutcome, string> = {
  Reached: 'bg-green-50 text-green-700',
  'No Answer': 'bg-slate-100 text-slate-700',
  'Callback Requested': 'bg-amber-50 text-amber-700',
  'Sent Info': 'bg-blue-50 text-blue-700',
  'Meeting Scheduled': 'bg-purple-50 text-purple-700',
  'Not Interested': 'bg-red-50 text-red-700',
  Converted: 'bg-green-100 text-green-800',
};

interface FormData {
  type: FollowUpType;
  notes: string;
  outcome: FollowUpOutcome;
  duration: string;
}

interface Props {
  lead: Lead;
  onAddLog: (log: FollowUpLog) => void;
}

export default function FollowUpLogTab({ lead, onAddLog }: Props) {
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { type: 'Call', outcome: 'Reached', notes: '', duration: '' },
  });

  function onSubmit(data: FormData) {
    const newLog: FollowUpLog = {
      id: `log-new-${Date.now()}`,
      date: new Date().toISOString(),
      type: data.type,
      notes: data.notes,
      outcome: data.outcome,
      agentId: lead.assignedAgentId,
      duration: data.duration || undefined,
    };
    onAddLog(newLog);
    reset();
    setShowForm(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-600 text-foreground">Follow-up History</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-sm font-500 bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancel' : 'Log Follow-up'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-muted/30 border border-border rounded-xl p-4 mb-5 animate-slide-up">
          <h4 className="text-sm font-600 text-foreground mb-3">Log New Follow-up</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs font-500 text-foreground mb-1">Contact Type</label>
              <select {...register('type', { required: true })} className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                {TYPE_OPTIONS.map((t) => <option key={`type-opt-${t}`} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1">Outcome</label>
              <select {...register('outcome', { required: true })} className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                {OUTCOME_OPTIONS.map((o) => <option key={`outcome-opt-${o}`} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-500 text-foreground mb-1">Duration (optional)</label>
              <input
                {...register('duration')}
                placeholder="e.g. 15 min"
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-500 text-foreground mb-1">Notes <span className="text-red-500">*</span></label>
            <textarea
              {...register('notes', { required: 'Notes are required' })}
              rows={3}
              placeholder="What was discussed? Any decisions made? Next steps?"
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
            {errors.notes && <p className="text-xs text-red-600 mt-1">{errors.notes.message}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 text-sm font-500 text-muted-foreground border border-border rounded-lg hover:bg-muted transition-all active:scale-95">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4py-2 text-sm font-500 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2">
              {isSubmitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Save Follow-up
            </button>
          </div>
        </form>
      )}

      {/* Log entries */}
      {lead.followUpLog.length === 0 ? (
        <div className="text-center py-12">
          <Phone size={32} className="text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-500 text-muted-foreground">No follow-ups logged yet</p>
          <p className="text-xs text-muted-foreground mt-1">Log your first call, WhatsApp, or email interaction above</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border" />
          <ul className="space-y-4">
            {lead.followUpLog.map((log) => (
              <li key={`log-entry-${log.id}`} className="flex gap-4 relative">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${TYPE_COLORS[log.type]}`}>
                  {TYPE_ICON[log.type]}
                </div>
                <div className="flex-1 bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-[11px] font-600 px-2 py-0.5 rounded-full ${TYPE_COLORS[log.type]}`}>
                      {log.type}
                    </span>
                    <span className={`text-[11px] font-500 px-2 py-0.5 rounded-full ${OUTCOME_COLORS[log.outcome]}`}>
                      {log.outcome}
                    </span>
                    {log.duration && (
                      <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {log.duration}
                      </span>
                    )}
                    <span className="ml-auto text-[11px] text-muted-foreground font-tabular">
                      {new Date(log.date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })} · {new Date(log.date).toLocaleTimeString('en-US', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{log.notes}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}