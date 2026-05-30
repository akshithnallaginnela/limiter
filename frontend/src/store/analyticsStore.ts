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
  total_messages: 148,
  total_conversations: 12,
  total_tokens: 84500,
  most_active_platform: 'Claude',
  most_active_conversation_title: 'UI refactoring using TailwindCSS',
  burn_rate_tokens_per_hour: 4500,
  predicted_daily_usage: 108000,
  estimated_exhaustion_hours: 5.2,
  efficiency_score: 81,
  efficiency_suggestions: [
    'Reduce repeated prompts (re-evaluate constraints)',
    'Split large files into smaller parts when feeding context',
    'Re-use existing active chats instead of starting fresh ones for minor details'
  ]
};

const MOCK_CHARTS: ChartRecord[] = [
  { date: '05-24', platform: 'claude', tokens_input: 12000, tokens_output: 15000, message_count: 22, conversation_count: 2 },
  { date: '05-24', platform: 'chatgpt', tokens_input: 8000, tokens_output: 10000, message_count: 14, conversation_count: 1 },
  { date: '05-25', platform: 'claude', tokens_input: 15000, tokens_output: 22000, message_count: 35, conversation_count: 3 },
  { date: '05-25', platform: 'gemini', tokens_input: 4000, tokens_output: 6000, message_count: 8, conversation_count: 1 },
  { date: '05-26', platform: 'claude', tokens_input: 18000, tokens_output: 24000, message_count: 42, conversation_count: 2 },
  { date: '05-26', platform: 'perplexity', tokens_input: 2000, tokens_output: 3000, message_count: 5, conversation_count: 1 },
  { date: '05-27', platform: 'claude', tokens_input: 10000, tokens_output: 12000, message_count: 20, conversation_count: 1 },
  { date: '05-27', platform: 'chatgpt', tokens_input: 14000, tokens_output: 18000, message_count: 30, conversation_count: 2 },
  { date: '05-28', platform: 'claude', tokens_input: 22000, tokens_output: 28000, message_count: 50, conversation_count: 4 },
  { date: '05-29', platform: 'chatgpt', tokens_input: 16000, tokens_output: 20000, message_count: 32, conversation_count: 2 }
];

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
