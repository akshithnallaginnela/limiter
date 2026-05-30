import React from 'react';
import { useAnalyticsStore } from '../store/analyticsStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';

export const AnalyticsCharts: React.FC = () => {
  const { charts } = useAnalyticsStore();

  // 1. Group records by date to show aggregated timeline
  const timelineDataMap: { [date: string]: any } = {};
  charts.forEach((record) => {
    if (!timelineDataMap[record.date]) {
      timelineDataMap[record.date] = {
        date: record.date,
        claude: 0,
        chatgpt: 0,
        gemini: 0,
        perplexity: 0,
        total: 0
      };
    }
    const plat = record.platform.toLowerCase();
    const tokens = record.tokens_input + record.tokens_output;
    if (plat === 'claude' || plat === 'chatgpt' || plat === 'gemini' || plat === 'perplexity') {
      timelineDataMap[record.date][plat] += tokens;
    }
    timelineDataMap[record.date].total += tokens;
  });

  const timelineData = Object.values(timelineDataMap);

  // 2. Platform Breakdown for Pie/Donut Chart
  const platformSummaryMap: { [platform: string]: number } = {};
  charts.forEach((record) => {
    const plat = record.platform.toUpperCase();
    const tokens = record.tokens_input + record.tokens_output;
    platformSummaryMap[plat] = (platformSummaryMap[plat] || 0) + tokens;
  });

  const pieData = Object.entries(platformSummaryMap).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#e06b52', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">Consumption Analytics</h2>
        <p className="text-slate-500 mt-1">Timeline and distributions of historical token consumption.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Area Chart */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col gap-6 shadow-sm shadow-indigo-500/5">
          <h3 className="text-lg font-bold text-slate-800">Daily Token Usage Trends</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClaude" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e06b52" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#e06b52" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGPT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#1e293b' }} 
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '10px' }} />
                <Area name="Claude" type="monotone" dataKey="claude" stroke="#e06b52" fillOpacity={1} fill="url(#colorClaude)" />
                <Area name="ChatGPT" type="monotone" dataKey="chatgpt" stroke="#3b82f6" fillOpacity={1} fill="url(#colorGPT)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Breakdown Pie Chart */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6 shadow-sm shadow-indigo-500/5">
          <h3 className="text-lg font-bold text-slate-800">Platform Breakdown</h3>
          <div className="h-80 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `${Number(value).toLocaleString()} tokens`}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#1e293b' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="rect" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-slate-400 text-sm">No platform distributions available</span>
            )}
          </div>
        </div>
      </div>

      {/* Bar Chart comparing Input/Output tokens */}
      <div className="glass-panel p-6 rounded-2xl shadow-sm shadow-indigo-500/5">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Prompt Context vs Output Density</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#1e293b' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar name="Input Tokens (Context)" dataKey="tokens_input" fill="#e06b52" radius={[4, 4, 0, 0]} />
              <Bar name="Output Tokens (Response)" dataKey="tokens_output" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
