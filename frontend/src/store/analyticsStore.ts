import { create } from 'zustand';

export interface GeneralMetrics {
  total_messages: number;
  total_conversations: number;
  total_tokens: number;
  most_active_platform: string;
  most_active_conversation_title: string;
  burn_rate_tokens_per_hour: number;
  predicted_daily_usage: number;
  estimated_exhaustion_hours: number;
  efficiency_score: number;
  efficiency_suggestions: string[];
}

export interface ChartRecord {
  date: string;
  platform: string;
  tokens_input: number;
  tokens_output: number;
  message_count: number;
  conversation_count: number;
}

export interface BudgetConfig {
  platform: string;
  daily_token_limit: number;
  daily_message_limit: number;
}

interface AnalyticsState {
  metrics: GeneralMetrics | null;
  charts: ChartRecord[];
  budgets: BudgetConfig[];
  isLoading: boolean;
  fetchData: (userId: string) => Promise<void>;
  updateBudget: (userId: string, platform: string, tokens: number, messages: number) => Promise<void>;
}

const MOCK_METRICS: GeneralMetrics = {
  total_messages: 0,
  total_conversations: 0,
  total_tokens: 0,
  most_active_platform: 'None',
  most_active_conversation_title: 'None',
  burn_rate_tokens_per_hour: 0,
  predicted_daily_usage: 0,
  estimated_exhaustion_hours: 24.0,
  efficiency_score: 100,
  efficiency_suggestions: []
};

const MOCK_CHARTS: ChartRecord[] = [];

const MOCK_BUDGETS: BudgetConfig[] = [
  { platform: 'all', daily_token_limit: 100000, daily_message_limit: 100 },
  { platform: 'chatgpt', daily_token_limit: 30000, daily_message_limit: 40 },
  { platform: 'claude', daily_token_limit: 30000, daily_message_limit: 40 },
  { platform: 'gemini', daily_token_limit: 30000, daily_message_limit: 40 },
  { platform: 'grok', daily_token_limit: 30000, daily_message_limit: 40 },
  { platform: 'perplexity', daily_token_limit: 30000, daily_message_limit: 40 }
];

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  metrics: MOCK_METRICS,
  charts: MOCK_CHARTS,
  budgets: MOCK_BUDGETS,
  isLoading: false,
  fetchData: async (userId) => {
    set({ isLoading: true });
    try {
      const metricsRes = await fetch(`http://localhost:8000/api/v1/analytics/${userId}`);
      const chartsRes = await fetch(`http://localhost:8000/api/v1/analytics/${userId}/charts`);
      const budgetRes = await fetch(`http://localhost:8000/api/v1/settings/${userId}/budget`);

      if (metricsRes.ok && chartsRes.ok && budgetRes.ok) {
        const metricsData = await metricsRes.json();
        const chartsData = await chartsRes.json();
        const budgetData = await budgetRes.json();

        set({
          metrics: metricsData,
          charts: chartsData.length > 0 ? chartsData : MOCK_CHARTS,
          budgets: budgetData.length > 0 ? budgetData : MOCK_BUDGETS,
          isLoading: false
        });
      } else {
        throw new Error('Fallback to mock');
      }
    } catch (e) {
      console.warn('Backend server not connected. Rending mock data dashboard.', e);
      set({ metrics: MOCK_METRICS, charts: MOCK_CHARTS, budgets: MOCK_BUDGETS, isLoading: false });
    }
  },
  updateBudget: async (userId, platform, tokens, messages) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/settings/${userId}/budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          daily_token_limit: tokens,
          daily_message_limit: messages
        })
      });

      if (response.ok) {
        const updated = await response.json();
        set((state) => ({
          budgets: state.budgets.map((b) => b.platform === platform ? {
            platform: updated.platform,
            daily_token_limit: updated.daily_token_limit,
            daily_message_limit: updated.daily_message_limit
          } : b)
        }));
      }
    } catch (e) {
      console.error('Failed to save budget on server. Updating locally.', e);
      set((state) => ({
        budgets: state.budgets.map((b) => b.platform === platform ? {
          platform,
          daily_token_limit: tokens,
          daily_message_limit: messages
        } : b)
      }));
    }
  }
}));
