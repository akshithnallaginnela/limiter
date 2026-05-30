import React from 'react';
import { LayoutDashboard, BarChart3, AlertCircle, ShieldAlert, Settings, LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuthStore();

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
    { name: 'Analytics', icon: BarChart3, id: 'analytics' },
    { name: 'Efficiency', icon: AlertCircle, id: 'efficiency' },
    { name: 'Insights', icon: ShieldAlert, id: 'insights' },
    { name: 'Limits & Settings', icon: Settings, id: 'settings' },
  ];

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white/60 backdrop-blur-md flex flex-col justify-between h-screen sticky top-0 p-6">
      <div className="flex flex-col gap-8">
        {/* Brand header */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center shadow-lg shadow-primary/20">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-slate-800 uppercase">Guardian</h1>
            <span className="text-xs text-slate-500 font-medium">AI Usage Limiter</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col gap-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary/10 to-accent-purple/10 text-primary border-l-2 border-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User settings / Logout panel */}
      {user && (
        <div className="flex flex-col gap-4 border-t border-slate-200/80 pt-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-600">
              {user.email.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-800 truncate">{user.email}</p>
              <span className="text-xs text-emerald-600 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Shield Active
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 text-slate-400 hover:text-rose-500 text-sm font-semibold py-2 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
};
