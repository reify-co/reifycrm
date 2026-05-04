'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  CalendarClock,
  TrendingUp,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Owner Dashboard',
    href: '/owner-dashboard',
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: 'Lead Management',
    href: '/lead-management',
    icon: <Users size={18} />,
    badge: 10,
  },
  {
    label: 'Lead Detail',
    href: '/lead-detail',
    icon: <UserCircle size={18} />,
  },
  {
    label: 'Follow-ups',
    href: '/lead-management',
    icon: <CalendarClock size={18} />,
    badge: 3,
  },
  {
    label: 'Pipeline',
    href: '/owner-dashboard',
    icon: <TrendingUp size={18} />,
  },
  {
    label: 'Notifications',
    href: '/owner-dashboard',
    icon: <Bell size={18} />,
    badge: 2,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        flex flex-col h-screen bg-white border-r border-border
        transition-all duration-300 ease-in-out flex-shrink-0
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-border ${collapsed ? 'justify-center' : 'gap-2'}`}>
        <AppLogo size={32} />
        {!collapsed && (
          <span className="font-semibold text-[15px] text-foreground tracking-tight whitespace-nowrap">
            TravelCRM
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        <div className={`px-3 mb-1 ${collapsed ? 'hidden' : 'block'}`}>
          <p className="text-[10px] font-600 uppercase tracking-widest text-muted-foreground px-2 mb-2">
            Main
          </p>
        </div>
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={`nav-${item.href}-${item.label}`}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`
                    flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium
                    transition-all duration-150 group relative
                    ${isActive
                      ? 'bg-primary/10 text-primary' :'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-primary' : ''}`}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="flex-1 whitespace-nowrap">{item.label}</span>
                  )}
                  {!collapsed && item.badge !== undefined && (
                    <span className="ml-auto bg-primary/15 text-primary text-[10px] font-600 px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {item.badge}
                    </span>
                  )}
                  {collapsed && item.badge !== undefined && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                  )}
                  {collapsed && (
                    <span className="
                      absolute left-full ml-2 px-2 py-1 bg-foreground text-background
                      text-xs rounded whitespace-nowrap opacity-0 pointer-events-none
                      group-hover:opacity-100 transition-opacity duration-150 z-50
                    ">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom */}
      <div className="border-t border-border py-3 px-2 space-y-1">
        <Link
          href="#"
          title={collapsed ? 'Settings' : undefined}
          className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 group relative ${collapsed ? 'justify-center' : ''}`}
        >
          <Settings size={18} />
          {!collapsed && <span>Settings</span>}
          {collapsed && (
            <span className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50">
              Settings
            </span>
          )}
        </Link>

        {/* User */}
        <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-600 flex items-center justify-center flex-shrink-0">
            PM
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-600 text-foreground truncate">Priya Mehta</p>
              <p className="text-[10px] text-muted-foreground truncate">Owner</p>
            </div>
          )}
          {!collapsed && (
            <button className="text-muted-foreground hover:text-destructive transition-colors" title="Sign out">
              <LogOut size={14} />
            </button>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 ${collapsed ? 'justify-center' : ''}`}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}