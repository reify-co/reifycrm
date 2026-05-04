import React from 'react';
import AppLayout from '@/components/AppLayout';
import KPIBentoGrid from './components/KPIBentoGrid';
import PipelineChart from './components/PipelineChart';
import SourceChart from './components/SourceChart';
import AgentPerformanceTable from './components/AgentPerformanceTable';
import OverdueAlertsPanel from './components/OverdueAlertsPanel';
import RecentActivityFeed from './components/RecentActivityFeed';

export default function OwnerDashboardPage() {
  return (
    <AppLayout>
      <div className="px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Owner Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Sunrise Travels — Team pipeline overview · Last updated just now
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white border border-border rounded-lg px-3 py-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
            <span className="text-xs text-muted-foreground bg-white border border-border rounded-lg px-3 py-1.5 font-tabular">
              Apr 25, 2026 · 07:39
            </span>
          </div>
        </div>

        {/* KPI Cards */}
        <KPIBentoGrid />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-4 mt-4">
          <div className="lg:col-span-3 xl:col-span-3 2xl:col-span-3">
            <PipelineChart />
          </div>
          <div className="lg:col-span-2 xl:col-span-2 2xl:col-span-2">
            <SourceChart />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-4 mt-4">
          <div className="lg:col-span-3 xl:col-span-3 2xl:col-span-3">
            <AgentPerformanceTable />
          </div>
          <div className="lg:col-span-2 xl:col-span-2 2xl:col-span-2 flex flex-col gap-4">
            <OverdueAlertsPanel />
            <RecentActivityFeed />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}