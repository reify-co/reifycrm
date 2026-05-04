'use client';
import React, { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, Phone, MessageCircle, Mail, Edit, ChevronDown, MapPin, Calendar, Users, DollarSign, Tag, Globe,  } from 'lucide-react';
import { LEADS, AGENTS, STATUS_COLORS, type LeadStatus } from '@/data/mockData';
import StatusBadge from '@/components/ui/StatusBadge';
import SourceBadge from '@/components/ui/SourceBadge';
import FollowUpLogTab from './FollowUpLogTab';
import RemindersTab from './RemindersTab';
import EditLeadTab from './EditLeadTab';

const ALL_STATUSES: LeadStatus[] = [
  'New', 'Contacted', 'Interested', 'Proposal Sent', 'Negotiating', 'Booked', 'Lost',
];

const TABS = ['Overview', 'Follow-up Log', 'Reminders', 'Edit Lead'] as const;
type Tab = typeof TABS[number];

// Using the first lead as the "current" lead for this demo
const DEFAULT_LEAD = LEADS[0];

export default function LeadDetailClient() {
  const [lead, setLead] = useState(DEFAULT_LEAD);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const agent = AGENTS.find((a) => a.id === lead.assignedAgentId);

  function changeStatus(newStatus: LeadStatus) {
    setLead((prev) => ({ ...prev, status: newStatus }));
    setStatusDropdownOpen(false);
    toast.success(`Status updated to "${newStatus}"`);
  }

  return (
    <div className="px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 max-w-screen-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
        <Link href="/lead-management" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft size={14} />
          Lead Management
        </Link>
        <span>/</span>
        <span className="text-foreground font-500">{lead.name}</span>
      </div>

      {/* Lead Header */}
      <div className="bg-white border border-border rounded-xl shadow-sm p-5 mb-4">
        <div className="flex flex-wrap items-start gap-4">
          {/* Avatar + name */}
          <div className="w-14 h-14 rounded-full bg-primary/15 text-primary text-lg font-700 flex items-center justify-center flex-shrink-0">
            {lead.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-semibold text-foreground">{lead.name}</h1>
              <SourceBadge source={lead.source} />
              {lead.isOverdue && (
                <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-500">Overdue</span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Phone size={13} />{lead.phone}</span>
              <span className="flex items-center gap-1"><Mail size={13} />{lead.email}</span>
              <span className="flex items-center gap-1"><MapPin size={13} />{lead.destination}</span>
              <span className="flex items-center gap-1"><Calendar size={13} />{lead.travelDates}</span>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              <span>Assigned to: <span className="font-500 text-foreground">{agent?.name}</span></span>
              <span>·</span>
              <span>Created: <span className="font-500 text-foreground">{new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></span>
              <span>·</span>
              <span>{lead.daysInPipeline} days in pipeline</span>
            </div>
          </div>

          {/* Status + Actions */}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {/* Status change */}
            <div className="relative">
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-2 text-sm font-500 hover:bg-muted transition-all active:scale-95"
              >
                <StatusBadge status={lead.status} size="sm" />
                <ChevronDown size={13} className="text-muted-foreground" />
              </button>
              {statusDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-xl z-20 py-1 w-44 animate-slide-up">
                  {ALL_STATUSES.map((s) => {
                    const colors = STATUS_COLORS[s];
                    return (
                      <button
                        key={`status-change-${s}`}
                        onClick={() => changeStatus(s)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors ${
                          lead.status === s ? 'bg-muted/60' : ''
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                        <span className={colors.text}>{s}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <a
              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-500 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 active:scale-95 transition-all"
            >
              <MessageCircle size={14} />
              WhatsApp
            </a>
            <a
              href={`tel:${lead.phone}`}
              className="flex items-center gap-1.5 text-sm font-500 border border-border rounded-lg px-3 py-2 hover:bg-muted active:scale-95 transition-all"
            >
              <Phone size={14} />
              Call
            </a>
            <button
              onClick={() => setActiveTab('Edit Lead')}
              className="flex items-center gap-1.5 text-sm font-500 bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all"
            >
              <Edit size={14} />
              Edit Lead
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-3 mb-4">
        <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={15} className="text-green-600" />
            <p className="text-[11px] font-500 uppercase tracking-wider text-muted-foreground">Budget</p>
          </div>
          <p className="text-xl font-700 text-foreground font-tabular">${lead.budget.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Users size={15} className="text-primary" />
            <p className="text-[11px] font-500 uppercase tracking-wider text-muted-foreground">Travellers</p>
          </div>
          <p className="text-xl font-700 text-foreground font-tabular">{lead.paxCount} pax</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Tag size={15} className="text-purple-600" />
            <p className="text-[11px] font-500 uppercase tracking-wider text-muted-foreground">Package</p>
          </div>
          <p className="text-sm font-600 text-foreground">{lead.packageType}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Globe size={15} className="text-accent" />
            <p className="text-[11px] font-500 uppercase tracking-wider text-muted-foreground">Follow-ups</p>
          </div>
          <p className="text-xl font-700 text-foreground font-tabular">{lead.followUpLog.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto scrollbar-thin">
          {TABS.map((tab) => (
            <button
              key={`tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3.5 text-sm font-500 whitespace-nowrap transition-all border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-primary text-primary bg-primary/5' :'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              {tab}
              {tab === 'Follow-up Log' && (
                <span className="ml-1.5 text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                  {lead.followUpLog.length}
                </span>
              )}
              {tab === 'Reminders' && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  lead.reminders.filter((r) => !r.isCompleted).length > 0
                    ? 'bg-amber-100 text-amber-700' :'bg-muted text-muted-foreground'
                }`}>
                  {lead.reminders.filter((r) => !r.isCompleted).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'Overview' && <OverviewTab lead={lead} agent={agent} />}
          {activeTab === 'Follow-up Log' && (
            <FollowUpLogTab
              lead={lead}
              onAddLog={(log) => {
                setLead((prev) => ({ ...prev, followUpLog: [log, ...prev.followUpLog] }));
                toast.success('Follow-up logged successfully');
              }}
            />
          )}
          {activeTab === 'Reminders' && (
            <RemindersTab
              lead={lead}
              onAddReminder={(rem) => {
                setLead((prev) => ({ ...prev, reminders: [...prev.reminders, rem] }));
                toast.success('Reminder set successfully');
              }}
              onCompleteReminder={(remId) => {
                setLead((prev) => ({
                  ...prev,
                  reminders: prev.reminders.map((r) =>
                    r.id === remId ? { ...r, isCompleted: true } : r
                  ),
                }));
                toast.success('Reminder marked as done');
              }}
            />
          )}
          {activeTab === 'Edit Lead' && (
            <EditLeadTab
              lead={lead}
              onSave={(updated) => {
                setLead(updated);
                toast.success('Lead details saved');
                setActiveTab('Overview');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ lead, agent }: { lead: typeof LEADS[0]; agent: typeof AGENTS[0] | undefined }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-6">
      {/* Contact Details */}
      <div>
        <h3 className="text-sm font-600 text-foreground mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-primary rounded-full" />
          Contact Details
        </h3>
        <dl className="space-y-2.5">
          {[
            { label: 'Full Name', value: lead.name },
            { label: 'Phone', value: lead.phone },
            { label: 'Email', value: lead.email },
            { label: 'Lead Source', value: <SourceBadge source={lead.source} /> },
            ...(lead.adCampaign ? [{ label: 'Ad Campaign', value: lead.adCampaign }] : []),
          ].map((item) => (
            <div key={`overview-contact-${item.label}`} className="flex items-start gap-3">
              <dt className="text-xs font-500 text-muted-foreground w-32 flex-shrink-0 pt-0.5">{item.label}</dt>
              <dd className="text-sm text-foreground font-500 flex-1">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Travel Details */}
      <div>
        <h3 className="text-sm font-600 text-foreground mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-accent rounded-full" />
          Travel Details
        </h3>
        <dl className="space-y-2.5">
          {[
            { label: 'Destination', value: lead.destination },
            { label: 'Package Type', value: lead.packageType },
            { label: 'Travel Dates', value: lead.travelDates },
            { label: 'No. of Travellers', value: `${lead.paxCount} pax` },
            { label: 'Budget', value: `$${lead.budget.toLocaleString()}` },
            ...(lead.specialRequests ? [{ label: 'Special Requests', value: lead.specialRequests }] : []),
          ].map((item) => (
            <div key={`overview-travel-${item.label}`} className="flex items-start gap-3">
              <dt className="text-xs font-500 text-muted-foreground w-32 flex-shrink-0 pt-0.5">{item.label}</dt>
              <dd className="text-sm text-foreground font-500 flex-1">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Assignment */}
      <div>
        <h3 className="text-sm font-600 text-foreground mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-purple-500 rounded-full" />
          Assignment
        </h3>
        <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
          <div className="w-10 h-10 rounded-full bg-primary/15 text-primary text-sm font-700 flex items-center justify-center">
            {agent?.avatar}
          </div>
          <div>
            <p className="text-sm font-600 text-foreground">{agent?.name}</p>
            <p className="text-xs text-muted-foreground">{agent?.email}</p>
            {agent?.isOnLeave && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-500">Currently on leave</span>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      {lead.notes && (
        <div>
          <h3 className="text-sm font-600 text-foreground mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-green-500 rounded-full" />
            Notes
          </h3>
          <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-3 leading-relaxed">
            {lead.notes}
          </p>
        </div>
      )}
    </div>
  );
}