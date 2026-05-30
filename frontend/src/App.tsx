import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useAnalyticsStore } from './store/analyticsStore';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { PromptEfficiency } from './components/PromptEfficiency';
import { ProductivityInsights } from './components/ProductivityInsights';
import { Settings } from './components/Settings';
import { Shield } from 'lucide-react';

function App() {
  const { isAuthenticated, user, login } = useAuthStore();
  const { fetchData } = useAnalyticsStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Auth fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }
    const success = await login(email);
    if (!success) {
      setError('Failed to authenticate with local backend. Standard dev session loaded.');
    }
  };

  // Pull backend updates once logged in
  useEffect(() => {
    if (user?.id) {
      fetchData(user.id);
      // Poll every 30 seconds for real-time local syncs from extension
      const interval = setInterval(() => {
        fetchData(user.id);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchData]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 relative overflow-hidden">
        {/* Abstract vibrant blur gradients for colorful backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-accent-purple/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-10 right-10 w-80 h-80 bg-accent-blue/15 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-md glass-panel p-8 rounded-2xl relative z-10 shadow-xl shadow-indigo-500/5">
          <div className="flex flex-col items-center gap-4 text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center shadow-xl shadow-primary/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">AI Usage Guardian</h1>
              <p className="text-sm text-slate-500 mt-1.5 font-medium">Protect and monitor your local LLM usage limits.</p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
            <div>
              <label className="text-xs text-slate-600 block mb-2 font-medium">Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 block mb-2 font-medium">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>

            {error && (
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg block">
                {error}
              </span>
            )}

            <button
              type="submit"
              className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-lg shadow-primary/20"
            >
              Sign In
            </button>
          </form>

          {/* Quick instructions panel */}
          <div className="mt-8 border-t border-slate-200/80 pt-6 text-center text-xs text-slate-500 leading-relaxed font-medium">
            No paid APIs or credential requirements. Register/login to generate dashboard metrics locally.
          </div>
        </div>
      </div>
    );
  }

  // Logged-in page view
  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      {/* Dynamic background mesh gradient spots for main dashboard */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/4 w-[350px] h-[350px] bg-accent-purple/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-2/3 w-[300px] h-[300px] bg-accent-blue/5 rounded-full blur-[100px] pointer-events-none"></div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 bg-transparent min-h-screen p-10 relative overflow-y-auto z-10">
        <div className="max-w-5xl mx-auto w-full">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'analytics' && <AnalyticsCharts />}
          {activeTab === 'efficiency' && <PromptEfficiency />}
          {activeTab === 'insights' && <ProductivityInsights />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  );
}

export default App;
