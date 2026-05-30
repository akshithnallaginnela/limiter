import React, { useState } from 'react';
import { useAnalyticsStore } from '../store/analyticsStore';
import { useAuthStore } from '../store/authStore';
import { Save, AlertTriangle, ShieldCheck, Database } from 'lucide-react';

export const Settings: React.FC = () => {
  const { budgets, updateBudget } = useAnalyticsStore();
  const { user } = useAuthStore();

  const [platform, setPlatform] = useState('all');
  const [tokensLimit, setTokensLimit] = useState(100000);
  const [messagesLimit, setMessagesLimit] = useState(100);

  // Sync settings states
  const [thresholds, setThresholds] = useState('50, 75, 90, 100');
  const [notifEnabled, setNotifEnabled] = useState(true);

  // Update form inputs when changing platform selection
  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const plat = e.target.value;
    setPlatform(plat);
    const existing = budgets.find((b) => b.platform === plat);
    if (existing) {
      setTokensLimit(existing.daily_token_limit);
      setMessagesLimit(existing.daily_message_limit);
    }
  };

  const handleSaveBudget = async () => {
    const userId = user?.id || 'demo_user';
    await updateBudget(userId, platform, tokensLimit, messagesLimit);
    alert('Daily limits successfully updated!');
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">Limits & Settings</h2>
        <p className="text-slate-500 mt-1">Configure threshold bounds, notifications, and storage credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Budget Configuration */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6 shadow-sm shadow-indigo-500/5">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Platform Daily Allocations
          </h3>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-slate-600 block mb-2 font-medium">Select target platform</label>
              <select 
                value={platform}
                onChange={handlePlatformChange}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              >
                <option value="all">Global (All Chatbots)</option>
                <option value="chatgpt">ChatGPT</option>
                <option value="claude">Claude</option>
                <option value="gemini">Gemini</option>
                <option value="grok">Grok</option>
                <option value="perplexity">Perplexity</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600 block mb-2 font-medium">Daily Token Limit</label>
              <input 
                type="number" 
                value={tokensLimit}
                onChange={(e) => setTokensLimit(parseInt(e.target.value) || 0)}
                step="5000"
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 block mb-2 font-medium">Daily Message Limit</label>
              <input 
                type="number" 
                value={messagesLimit}
                onChange={(e) => setMessagesLimit(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>

            <button 
              onClick={handleSaveBudget}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white font-semibold text-sm py-3 rounded-xl transition shadow-md shadow-indigo-500/10"
            >
              <Save className="w-4 h-4" />
              Save Limits
            </button>
          </div>
        </div>

        {/* Notifications and Alerts config */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6 shadow-sm shadow-indigo-500/5">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Alert Threshold Configurations
          </h3>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-200/60">
              <div>
                <span className="text-sm font-bold text-slate-800">Enable Browser Notifications</span>
                <p className="text-xs text-slate-500 mt-1">Get alerts when approaching budget limits.</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifEnabled}
                onChange={(e) => setNotifEnabled(e.target.checked)}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 block mb-2 font-medium">Notification Thresholds (Percentages)</label>
              <input 
                type="text" 
                value={thresholds}
                onChange={(e) => setThresholds(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
              <span className="text-[10px] text-slate-400 block mt-1.5 font-medium">Comma-separated integers, e.g. 50, 75, 90, 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Status / Supabase indicator */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm shadow-indigo-500/5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h4 className="text-md font-bold text-slate-800">Supabase DB Synchronization</h4>
            <p className="text-xs text-slate-500 mt-1">
              Cross-device sync coordinates platform analytics, budgets and token records between extension cache and PostgreSQL database.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-emerald-600 font-semibold text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Ready to Sync
        </div>
      </div>
    </div>
  );
};
