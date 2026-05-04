import React from 'react';
import {
  Users,
  CalendarClock,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { LEADS } from '@/data/mockData';

function calcStats() {
  const active = LEADS?.filter(
    (l) => l?.status !== 'Booked' && l?.status !== 'Lost'
  )?.length;
  const dueToday = LEADS?.filter((l) => {
    if (!l?.nextFollowUp) return false;
    const d = new Date(l.nextFollowUp);
    return (d?.getFullYear() === 2026 &&
    d?.getMonth() === 3 && d?.getDate() === 25);
  })?.length;
  const bookedThisMonth = LEADS?.filter((l) => l?.status === 'Booked')?.length;
  const total = LEADS?.length;
  const conversionRate = Math.round((bookedThisMonth / total) * 100);
  const newThisWeek = LEADS?.filter((l) => {
    const d = new Date(l.createdAt);
    return d >= new Date('2026-04-20');
  })?.length;
  const overdue = LEADS?.filter((l) => l?.isOverdue)?.length;
  return { active, dueToday, bookedThisMonth, conversionRate, newThisWeek, overdue };
}

export default function KPIBentoGrid() {
  const stats = calcStats();

  return (
    // 6 cards: row1 = hero(span2) + 2 regular = 4 cols; row2 = 3 regular
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      {/* Hero: Active Leads */}
      <div className="col-span-2 md:col-span-2 xl:col-span-2 2xl:col-span-2 bg-white border border-border rounded-xl p-5 flex items-center gap-5 shadow-sm">
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Users size={26} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-[12px] font-500 uppercase tracking-widest text-muted-foreground">Active Leads</p>
          <p className="text-4xl font-700 text-foreground font-tabular mt-0.5">{stats?.active}</p>
          <p className="text-xs text-muted-foreground mt-1">Across all pipeline stages</p>
        </div>
        <div className="text-right">
          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">+2 this week</span>
        </div>
      </div>
      {/* Follow-ups Due Today */}
      <div className="bg-white border border-amber-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
            <CalendarClock size={18} className="text-amber-600" />
          </div>
          <span className="text-[10px] font-600 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Today</span>
        </div>
        <p className="text-3xl font-700 text-foreground font-tabular mt-3">{stats?.dueToday}</p>
        <p className="text-[11px] font-500 text-amber-700 mt-1">Follow-ups due today</p>
      </div>
      {/* Booked This Month */}
      <div className="bg-white border border-green-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
            <CheckCircle2 size={18} className="text-green-600" />
          </div>
          <span className="text-[10px] font-600 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Apr</span>
        </div>
        <p className="text-3xl font-700 text-foreground font-tabular mt-3">{stats?.bookedThisMonth}</p>
        <p className="text-[11px] font-500 text-green-700 mt-1">Bookings this month</p>
      </div>
      {/* Conversion Rate */}
      <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp size={18} className="text-primary" />
          </div>
        </div>
        <p className="text-3xl font-700 text-foreground font-tabular mt-3">{stats?.conversionRate}%</p>
        <p className="text-[11px] font-500 text-muted-foreground mt-1">Conversion rate</p>
      </div>
      {/* New This Week */}
      <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
            <Sparkles size={18} className="text-purple-600" />
          </div>
        </div>
        <p className="text-3xl font-700 text-foreground font-tabular mt-3">{stats?.newThisWeek}</p>
        <p className="text-[11px] font-500 text-muted-foreground mt-1">New leads this week</p>
      </div>
      {/* Overdue Follow-ups — alert state */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <span className="text-[10px] font-600 bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Urgent</span>
        </div>
        <p className="text-3xl font-700 text-red-700 font-tabular mt-3">{stats?.overdue}</p>
        <p className="text-[11px] font-600 text-red-700 mt-1">Overdue follow-ups</p>
      </div>
    </div>
  );
}