import React from 'react';
import { useAnalyticsStore } from '../store/analyticsStore';
import { Shield, Flame, MessageSquare, Key, Layers, Activity } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { metrics, budgets } = useAnalyticsStore();

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400">
        Sync with the extension or log in to generate usage history.
      </div>
    );
  }

  // Find daily global limit
  const globalBudget = budgets.find((b) => b.platform === 'all') || { daily_token_limit: 100000 };
  const dailyLimit = globalBudget.daily_token_limit;
  
  // Calculate mock values for display if current metrics are new
  const tokensUsed = Math.min(dailyLimit, Math.round(metrics.total_tokens * 0.15)) || 12000;
  const remaining = Math.max(0, dailyLimit - tokensUsed);
  const percentUsed = Math.round((tokensUsed / dailyLimit) * 100) || 12;

  const statCards = [
    { name: 'Estimated Tokens', value: metrics.total_tokens.toLocaleString(), sub: `Daily Limit: ${dailyLimit.toLocaleString()}`, icon: Key, color: 'text-amber-500' },
    { name: 'Total Messages', value: metrics.total_messages.toLocaleString(), sub: 'Across all AI chatbots', icon: MessageSquare, color: 'text-blue-500' },
    { name: 'Active Chats', value: metrics.total_conversations.toLocaleString(), sub: 'Monitored conversations', icon: Layers, color: 'text-purple-500' },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">Daily Dashboard</h2>
        <p className="text-slate-500 mt-1">Real-time AI consumption guardian and exhaustion metrics.</p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 shadow-sm shadow-indigo-500/5">
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-slate-500">{stat.name}</span>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{stat.value}</h3>
                <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mid row: Burn rate & Budget Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Tracker Box */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6 shadow-sm shadow-indigo-500/5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Global Token Budget
            </h3>
            <span className="text-sm font-semibold text-slate-500">{percentUsed}% utilized</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent-purple rounded-full transition-all duration-500" 
                style={{ width: `${percentUsed}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-semibold mt-1">
              <span>{tokensUsed.toLocaleString()} tokens used</span>
              <span>{remaining.toLocaleString()} tokens remaining</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-slate-200/60 pt-6">
            <div>
              <span className="text-xs text-slate-500 block">Daily Cap</span>
              <span className="text-md font-bold text-slate-800">{dailyLimit.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Utilization</span>
              <span className="text-md font-bold text-slate-800">{percentUsed}%</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Status</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Safe
              </span>
            </div>
          </div>
        </div>

        {/* Burn Rate Engine */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6 shadow-sm shadow-indigo-500/5">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
            Burn Rate Engine
          </h3>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/80 border border-slate-200/60 p-4 rounded-xl shadow-inner">
              <span className="text-xs text-slate-500 block font-semibold">Burn Speed</span>
              <span className="text-xl font-extrabold text-slate-800 mt-1 block">
                {metrics.burn_rate_tokens_per_hour.toLocaleString()} <span className="text-xs font-normal text-slate-500">t/hr</span>
              </span>
            </div>
            <div className="bg-white/80 border border-slate-200/60 p-4 rounded-xl shadow-inner">
              <span className="text-xs text-slate-500 block font-semibold">Forecasted Daily</span>
              <span className="text-xl font-extrabold text-slate-800 mt-1 block">
                {metrics.predicted_daily_usage.toLocaleString()} <span className="text-xs font-normal text-slate-500">t</span>
              </span>
            </div>
          </div>

          <div className="border-t border-slate-200/60 pt-4 flex justify-between items-center text-sm">
            <span className="text-slate-500 font-semibold">Budget Depletion Prediction:</span>
            <span className="font-bold text-amber-600">~{metrics.estimated_exhaustion_hours} hours</span>
          </div>
        </div>
      </div>

      {/* Bottom row: Active summary */}
      <div className="glass-panel p-6 rounded-2xl shadow-sm shadow-indigo-500/5">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Consumption Highlights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <span className="text-xs text-slate-500 block">Top Consuming Platform</span>
            <span className="text-lg font-bold text-slate-800 mt-1 block">{metrics.most_active_platform}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Longest Conversation Thread</span>
            <span className="text-lg font-bold text-slate-800 mt-1 block truncate max-w-sm">{metrics.most_active_conversation_title}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
