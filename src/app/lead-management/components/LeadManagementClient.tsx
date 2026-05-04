'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Search, Plus, ChevronDown, ChevronUp, ArrowUpDown, MessageCircle, Eye, Edit, Trash2, UserCheck, ChevronLeft, ChevronRight, AlertTriangle, X, Users } from 'lucide-react';
import { LEADS, AGENTS, type Lead, type LeadStatus, type LeadSource } from '@/data/mockData';
import StatusBadge from '@/components/ui/StatusBadge';
import SourceBadge from '@/components/ui/SourceBadge';
import ReassignModal from './ReassignModal';

type SortField = 'name' | 'createdAt' | 'nextFollowUp' | 'budget' | 'daysInPipeline';
type SortDir = 'asc' | 'desc';

const ALL_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Interested', 'Proposal Sent', 'Negotiating', 'Booked', 'Lost'];
const ALL_SOURCES: LeadSource[] = ['Google Ads', 'WhatsApp', 'Phone Call', 'Email', 'Referral'];
const PAGE_SIZE_OPTIONS = [5, 10, 20];

export default function LeadManagementClient() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'All'>('All');
  const [sourceFilter, setSourceFilter] = useState<LeadSource | 'All'>('All');
  const [agentFilter, setAgentFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>(LEADS);

  const filtered = useMemo(() => {
    let result = leads;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.destination.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'All') result = result.filter((l) => l.status === statusFilter);
    if (sourceFilter !== 'All') result = result.filter((l) => l.source === sourceFilter);
    if (agentFilter !== 'All') result = result.filter((l) => l.assignedAgentId === agentFilter);

    result = [...result].sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortField === 'name') { av = a.name; bv = b.name; }
      else if (sortField === 'createdAt') { av = a.createdAt; bv = b.createdAt; }
      else if (sortField === 'nextFollowUp') { av = a.nextFollowUp; bv = b.nextFollowUp; }
      else if (sortField === 'budget') { av = a.budget; bv = b.budget; }
      else if (sortField === 'daysInPipeline') { av = a.daysInPipeline; bv = b.daysInPipeline; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [leads, search, statusFilter, sourceFilter, agentFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === paginated.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginated.map((l) => l.id)));
  }

  function handleDelete(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    toast.success('Lead removed from pipeline');
  }

  function handleBulkDelete() {
    setLeads((prev) => prev.filter((l) => !selectedIds.has(l.id)));
    toast.success(`${selectedIds.size} leads deleted`);
    setSelectedIds(new Set());
  }

  function handleReassign(newAgentId: string) {
    setLeads((prev) =>
      prev.map((l) =>
        selectedIds.has(l.id) ? { ...l, assignedAgentId: newAgentId } : l
      )
    );
    const agent = AGENTS.find((a) => a.id === newAgentId);
    toast.success(`${selectedIds.size} leads reassigned to ${agent?.name}`);
    setSelectedIds(new Set());
    setReassignOpen(false);
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-muted-foreground" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-primary" /> : <ChevronDown size={12} className="text-primary" />;
  }

  return (
    <div className="px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Lead Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} lead{filtered.length !== 1 ? 's' : ''} · All agents
          </p>
        </div>
        <Link
          href="/lead-detail"
          className="flex items-center gap-2 bg-primary text-white text-sm font-500 px-4 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all duration-150"
        >
          <Plus size={16} />
          New Lead
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-border rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search leads by name, phone, destination..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as LeadStatus | 'All'); setPage(1); }}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="All">All Statuses</option>
            {ALL_STATUSES.map((s) => <option key={`status-opt-${s}`} value={s}>{s}</option>)}
          </select>

          {/* Source filter */}
          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value as LeadSource | 'All'); setPage(1); }}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="All">All Sources</option>
            {ALL_SOURCES.map((s) => <option key={`source-opt-${s}`} value={s}>{s}</option>)}
          </select>

          {/* Agent filter */}
          <select
            value={agentFilter}
            onChange={(e) => { setAgentFilter(e.target.value); setPage(1); }}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="All">All Agents</option>
            {AGENTS.map((a) => <option key={`agent-opt-${a.id}`} value={a.id}>{a.name}</option>)}
          </select>

          {(statusFilter !== 'All' || sourceFilter !== 'All' || agentFilter !== 'All') && (
            <button
              onClick={() => { setStatusFilter('All'); setSourceFilter('All'); setAgentFilter('All'); setPage(1); }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-3 flex items-center gap-3 animate-slide-up">
          <span className="text-sm font-500 text-primary">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <button
            onClick={() => setReassignOpen(true)}
            className="flex items-center gap-1.5 text-sm font-500 text-primary hover:text-primary/80 transition-colors"
          >
            <UserCheck size={15} /> Reassign
          </button>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 text-sm font-500 text-red-600 hover:text-red-800 transition-colors"
          >
            <Trash2 size={15} /> Delete
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selectedIds.size === paginated.length}
                    onChange={toggleAll}
                    className="rounded border-border accent-primary"
                  />
                </th>
                <th className="text-left px-4 py-3">
                  <button onClick={() => toggleSort('name')} className="flex items-center gap-1 text-[11px] font-600 uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                    Lead <SortIcon field="name" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-600 uppercase tracking-wider text-muted-foreground">Phone</th>
                <th className="text-left px-4 py-3 text-[11px] font-600 uppercase tracking-wider text-muted-foreground">Source</th>
                <th className="text-left px-4 py-3 text-[11px] font-600 uppercase tracking-wider text-muted-foreground">Destination</th>
                <th className="text-left px-4 py-3 text-[11px] font-600 uppercase tracking-wider text-muted-foreground">Agent</th>
                <th className="text-left px-4 py-3 text-[11px] font-600 uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3">
                  <button onClick={() => toggleSort('budget')} className="flex items-center gap-1 text-[11px] font-600 uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors ml-auto">
                    Budget <SortIcon field="budget" />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button onClick={() => toggleSort('nextFollowUp')} className="flex items-center gap-1 text-[11px] font-600 uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                    Next Follow-up <SortIcon field="nextFollowUp" />
                  </button>
                </th>
                <th className="text-center px-4 py-3">
                  <button onClick={() => toggleSort('daysInPipeline')} className="flex items-center gap-1 text-[11px] font-600 uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mx-auto">
                    Days <SortIcon field="daysInPipeline" />
                  </button>
                </th>
                <th className="px-4 py-3 text-[11px] font-600 uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={32} className="text-muted-foreground/40" />
                      <p className="text-sm font-500 text-muted-foreground">No leads match your filters</p>
                      <p className="text-xs text-muted-foreground">Try adjusting the search or filter criteria above</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((lead, i) => {
                  const agent = AGENTS.find((a) => a.id === lead.assignedAgentId);
                  const isSelected = selectedIds.has(lead.id);
                  const isOverdue = lead.isOverdue;
                  return (
                    <tr
                      key={`row-${lead.id}`}
                      className={`border-b border-border last:border-0 transition-colors group
                        ${isSelected ? 'bg-primary/5' : i % 2 === 0 ? 'bg-white' : 'bg-muted/10'}
                        ${isOverdue ? 'border-l-2 border-l-red-400' : ''}
                        hover:bg-primary/5
                      `}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(lead.id)}
                          className="rounded border-border accent-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-[11px] font-700 flex items-center justify-center flex-shrink-0">
                            {lead.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-500 text-foreground text-sm">{lead.name}</p>
                            <p className="text-[11px] text-muted-foreground">{lead.email}</p>
                          </div>
                        </div>
                        {isOverdue && (
                          <span className="flex items-center gap-1 text-[10px] text-red-600 mt-0.5">
                            <AlertTriangle size={10} /> Overdue
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground font-tabular">{lead.phone}</td>
                      <td className="px-4 py-3">
                        <SourceBadge source={lead.source} />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-500 text-foreground">{lead.destination}</p>
                          <p className="text-[11px] text-muted-foreground">{lead.packageType} · {lead.paxCount} pax</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-[10px] font-700 flex items-center justify-center flex-shrink-0">
                            {agent?.avatar}
                          </div>
                          <div>
                            <p className="text-xs font-500 text-foreground">{agent?.name}</p>
                            {agent?.isOnLeave && (
                              <span className="text-[9px] text-amber-600 font-500">On Leave</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={lead.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-right font-tabular text-sm font-500 text-foreground">
                        ${lead.budget.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {lead.nextFollowUp ? (
                          <div>
                            <p className={`text-xs font-500 ${isOverdue ? 'text-red-600' : 'text-foreground'}`}>
                              {new Date(lead.nextFollowUp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {new Date(lead.nextFollowUp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-tabular font-500 ${lead.daysInPipeline > 20 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                          {lead.daysInPipeline}d
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open WhatsApp"
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                          >
                            <MessageCircle size={15} />
                          </a>
                          <Link
                            href="/lead-detail"
                            title="View lead"
                            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Eye size={15} />
                          </Link>
                          <Link
                            href="/lead-detail"
                            title="Edit lead"
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                          >
                            <Edit size={15} />
                          </Link>
                          <button
                            onClick={() => handleDelete(lead.id)}
                            title="Delete lead — this cannot be undone"
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-4 bg-muted/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border border-border rounded-md px-2 py-1 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {PAGE_SIZE_OPTIONS.map((s) => <option key={`page-size-${s}`} value={s}>{s}</option>)}
            </select>
          </div>
          <span className="text-xs text-muted-foreground font-tabular">
            {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-border bg-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && typeof arr[idx - 1] === 'number' && p - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground text-xs">…</span>
                ) : (
                  <button
                    key={`page-btn-${p}`}
                    onClick={() => setPage(p as number)}
                    className={`w-7 h-7 rounded-lg text-xs font-500 transition-colors ${
                      page === p ? 'bg-primary text-white' : 'border border-border bg-white hover:bg-muted'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-border bg-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Reassign Modal */}
      {reassignOpen && (
        <ReassignModal
          selectedCount={selectedIds.size}
          onClose={() => setReassignOpen(false)}
          onReassign={handleReassign}
        />
      )}
    </div>
  );
}