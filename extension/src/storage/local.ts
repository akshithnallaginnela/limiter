export interface MessageRecord {
  role: 'user' | 'assistant';
  content_length: number;
  estimated_tokens: number;
  created_at: string;
}

export interface ConversationRecord {
  external_conv_id: string;
  platform: string;
  title: string;
  messages: MessageRecord[];
  updated_at: string;
}

export interface BudgetConfig {
  platform: string;
  daily_token_limit: number;
  daily_message_limit: number;
}

export interface UsageCache {
  conversations: ConversationRecord[];
  budgets: BudgetConfig[];
  settings: {
    user_id: string | null;
    email: string | null;
    sync_enabled: boolean;
    alert_thresholds: number[];
    notifications_enabled: boolean;
  };
}

const DEFAULT_CACHE: UsageCache = {
  conversations: [],
  budgets: [
    { platform: 'all', daily_token_limit: 100000, daily_message_limit: 100 },
    { platform: 'chatgpt', daily_token_limit: 30000, daily_message_limit: 40 },
    { platform: 'claude', daily_token_limit: 30000, daily_message_limit: 40 },
    { platform: 'gemini', daily_token_limit: 30000, daily_message_limit: 40 },
    { platform: 'grok', daily_token_limit: 30000, daily_message_limit: 40 },
    { platform: 'perplexity', daily_token_limit: 30000, daily_message_limit: 40 }
  ],
  settings: {
    user_id: null,
    email: null,
    sync_enabled: true,
    alert_thresholds: [50, 75, 90, 100],
    notifications_enabled: true
  }
};

export async function getStorageData(): Promise<UsageCache> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['usage_cache'], (result) => {
      if (result.usage_cache) {
        // Merge with defaults in case of new fields
        resolve({
          ...DEFAULT_CACHE,
          ...result.usage_cache,
          settings: { ...DEFAULT_CACHE.settings, ...result.usage_cache.settings },
          budgets: result.usage_cache.budgets || DEFAULT_CACHE.budgets,
          conversations: result.usage_cache.conversations || DEFAULT_CACHE.conversations
        });
      } else {
        resolve(DEFAULT_CACHE);
      }
    });
  });
}

export async function setStorageData(data: UsageCache): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ usage_cache: data }, () => {
      resolve();
    });
  });
}

export async function updateLocalBudget(platform: string, tokenLimit: number, msgLimit: number): Promise<void> {
  const cache = await getStorageData();
  const index = cache.budgets.findIndex((b) => b.platform === platform);
  if (index >= 0) {
    cache.budgets[index].daily_token_limit = tokenLimit;
    cache.budgets[index].daily_message_limit = msgLimit;
  } else {
    cache.budgets.push({ platform, daily_token_limit: tokenLimit, daily_message_limit: msgLimit });
  }
  await setStorageData(cache);
}
