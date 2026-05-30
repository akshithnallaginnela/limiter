import { getStorageData, setStorageData } from '../storage/local';

const BACKEND_URL = 'http://localhost:8000/api/v1';

export async function syncWithBackend(): Promise<boolean> {
  try {
    const cache = await getStorageData();
    const { user_id, sync_enabled } = cache.settings;

    if (!user_id || !sync_enabled) {
      return false;
    }

    // 1. Sync conversations & messages
    const syncPayload = {
      conversations: cache.conversations.map((c) => ({
        external_conv_id: c.external_conv_id,
        platform: c.platform,
        title: c.title,
        messages: c.messages.map((m) => ({
          role: m.role,
          content_length: m.content_length,
          estimated_tokens: m.estimated_tokens,
          created_at: m.created_at
        }))
      }))
    };

    const syncResponse = await fetch(`${BACKEND_URL}/sync/${user_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(syncPayload),
    });

    if (!syncResponse.ok) {
      throw new Error('Sync endpoint returned error status');
    }

    // 2. Fetch updated budgets from server
    const budgetResponse = await fetch(`${BACKEND_URL}/settings/${user_id}/budget`);
    if (budgetResponse.ok) {
      const serverBudgets = await budgetResponse.json();
      // Update local budgets based on server configurations
      for (const serverB of serverBudgets) {
        const idx = cache.budgets.findIndex((b) => b.platform === serverB.platform);
        if (idx >= 0) {
          cache.budgets[idx].daily_token_limit = serverB.daily_token_limit;
          cache.budgets[idx].daily_message_limit = serverB.daily_message_limit;
        } else {
          cache.budgets.push({
            platform: serverB.platform,
            daily_token_limit: serverB.daily_token_limit,
            daily_message_limit: serverB.daily_message_limit
          });
        }
      }
    }

    // 3. Fetch settings from server
    const settingsResponse = await fetch(`${BACKEND_URL}/settings/${user_id}/settings`);
    if (settingsResponse.ok) {
      const serverSettings = await settingsResponse.json();
      cache.settings.sync_enabled = serverSettings.sync_enabled;
      cache.settings.alert_thresholds = serverSettings.alert_thresholds;
      cache.settings.notifications_enabled = serverSettings.notifications_enabled;
    }

    await setStorageData(cache);
    return true;
  } catch (error) {
    console.error('AI Usage Guardian: Backend sync failed:', error);
    return false;
  }
}
