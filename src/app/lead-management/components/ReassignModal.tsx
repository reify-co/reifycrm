'use client';
import React, { useState } from 'react';
import { AGENTS } from '@/data/mockData';
import { X, UserCheck, AlertTriangle } from 'lucide-react';

interface Props {
  selectedCount: number;
  onClose: () => void;
  onReassign: (agentId: string) => void;
}

export default function ReassignModal({ selectedCount, onClose, onReassign }: Props) {
  const [selectedAgent, setSelectedAgent] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-primary" />
            <h2 className="text-base font-600 text-foreground">Reassign Leads</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">
          <p className="text-sm text-muted-foreground mb-4">
            Reassigning <span className="font-600 text-foreground">{selectedCount}</span> selected lead{selectedCount !== 1 ? 's' : ''} to:
          </p>
          <div className="space-y-2">
            {AGENTS.filter((a) => a.role !== 'owner').map((agent) => (
              <label
                key={`reassign-agent-${agent.id}`}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedAgent === agent.id
                    ? 'border-primary bg-primary/5' :'border-border hover:bg-muted/40'
                }`}
              >
                <input
                  type="radio"
                  name="reassign-agent"
                  value={agent.id}
                  checked={selectedAgent === agent.id}
                  onChange={() => setSelectedAgent(agent.id)}
                  className="accent-primary"
                />
                <div className="w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-700 flex items-center justify-center">
                  {agent.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-500 text-foreground">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.email}</p>
                </div>
                {agent.isOnLeave && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 font-500">
                    <AlertTriangle size={12} /> On Leave
                  </span>
                )}
              </label>
            ))}
          </div>
          {selectedAgent && AGENTS.find((a) => a.id === selectedAgent)?.isOnLeave && (
            <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">This agent is currently on leave. They may not be able to follow up promptly.</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-500 text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedAgent && onReassign(selectedAgent)}
            disabled={!selectedAgent}
            className="px-4 py-2 text-sm font-500 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            Reassign Leads
          </button>
        </div>
      </div>
    </div>
  );
}