'use client';
import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer,  } from 'recharts';
import { SOURCE_DATA } from '@/data/mockData';

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-600 text-foreground">{payload[0].name}</p>
      <p className="text-muted-foreground">{payload[0].value} leads</p>
    </div>
  );
}

export default function SourceChart() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const total = SOURCE_DATA.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white border border-border rounded-xl p-5 shadow-sm h-full">
      <div className="mb-4">
        <h3 className="text-sm font-600 text-foreground">Leads by Source</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Where leads are coming from</p>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={SOURCE_DATA}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={3}
            dataKey="value"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {SOURCE_DATA.map((entry, index) => (
              <Cell
                key={`source-cell-${entry.name}`}
                fill={entry.fill}
                opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-1 space-y-1.5">
        {SOURCE_DATA.map((item) => (
          <li key={`legend-${item.name}`} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
              <span className="text-muted-foreground">{item.name}</span>
            </span>
            <span className="font-600 text-foreground font-tabular">
              {item.value} <span className="text-muted-foreground font-400">({Math.round((item.value / total) * 100)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}