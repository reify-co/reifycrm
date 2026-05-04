'use client';
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { PIPELINE_DATA } from '@/data/mockData';

const BAR_COLORS: Record<string, string> = {
  New: '#93C5FD',
  Contacted: '#94A3B8',
  Interested: '#FCD34D',
  'Proposal Sent': '#A78BFA',
  Negotiating: '#FB923C',
  Booked: '#4ADE80',
  Lost: '#F87171',
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-600 text-foreground">{label}</p>
      <p className="text-muted-foreground">{payload[0].value} lead{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
}

export default function PipelineChart() {
  return (
    <div className="bg-white border border-border rounded-xl p-5 shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-600 text-foreground">Pipeline by Stage</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Lead count per stage — all agents</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={PIPELINE_DATA} barSize={32} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <XAxis
            dataKey="stage"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', radius: 4 }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {PIPELINE_DATA.map((entry) => (
              <Cell key={`cell-${entry.stage}`} fill={BAR_COLORS[entry.stage] ?? '#94A3B8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}