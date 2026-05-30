import { getStorageData, setStorageData, ConversationRecord, MessageRecord } from '../storage/local';
import { syncWithBackend } from '../services/sync';

// Keep track of notification alerts sent today to avoid spamming the user
let sentAlertsToday: { [datePlatform: string]: Set<number> } = {};

chrome.runtime.onInstalled.addListener(() => {
  // Set up periodic sync alarm (every 10 minutes)
  chrome.alarms.create('sync-alarm', { periodInMinutes: 10 });
  console.log('AI Usage Guardian: Installed and alarms configured.');
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sync-alarm') {
    syncWithBackend();
  }
});

// Listener for messages from Content Scripts and Popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'NEW_MESSAGE_EVENT') {
    handleNewMessageEvent(message.payload)
      .then((stats) => {
        sendResponse({ success: true, stats });
      })
      .catch((err) => {
        console.error('Error handling message event:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // Keep channel open for async response
  }
  
  if (message.type === 'GET_CURRENT_LIMITS') {
    getStorageData().then((cache) => {
      sendResponse({ budgets: cache.budgets, settings: cache.settings });
    });
    return true;
  }
  return false;
});

interface NewMessagePayload {
  platform: string;
  external_conv_id: string;
  title: string;
  role: 'user' | 'assistant';
  content: string;
  estimated_tokens: number;
}

async function handleNewMessageEvent(payload: NewMessagePayload) {
  const cache = await getStorageData();
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Find or create conversation
  let conv = cache.conversations.find(
    (c) => c.external_conv_id === payload.external_conv_id && c.platform === payload.platform
  );

  const timestamp = new Date().toISOString();

  const newMsg: MessageRecord = {
    role: payload.role,
    content_length: payload.content.length,
    estimated_tokens: payload.estimated_tokens,
    created_at: timestamp
  };

  if (!conv) {
    conv = {
      external_conv_id: payload.external_conv_id,
      platform: payload.platform,
      title: payload.title || `Chat on ${payload.platform}`,
      messages: [newMsg],
      updated_at: timestamp
    };
    cache.conversations.push(conv);
  } else {
    // Check if duplicate message (prevent re-adding exact same message in short interval)
    const lastMsg = conv.messages[conv.messages.length - 1];
    const isDuplicate = lastMsg && 
                       lastMsg.role === payload.role && 
                       Math.abs(new Date(lastMsg.created_at).getTime() - new Date(timestamp).getTime()) < 2000 &&
                       lastMsg.content_length === payload.content.length;

    if (!isDuplicate) {
      conv.messages.push(newMsg);
      conv.updated_at = timestamp;
      if (payload.title) {
        conv.title = payload.title;
      }
    }
  }

  await setStorageData(cache);

  // 2. Perform budget checks & fire alarms
  await checkBudgetsAndNotify(payload.platform, cache);

  // 3. Queue immediate sync if enabled
  if (cache.settings.user_id && cache.settings.sync_enabled) {
    syncWithBackend().catch((e) => console.log('Sync failure in message handler:', e));
  }

  return calculateCurrentUsage(payload.platform, cache);
}

// Calculates active tokens and counts
function calculateCurrentUsage(platform: string, cache: any) {
  const todayStr = new Date().toISOString().split('T')[0];
  let tokensUsed = 0;
  let messageCount = 0;

  for (const c of cache.conversations) {
    if (platform !== 'all' && c.platform !== platform) continue;
    
    for (const m of c.messages) {
      const msgDate = m.created_at.split('T')[0];
      if (msgDate === todayStr) {
        tokensUsed += m.estimated_tokens;
        messageCount += 1;
      }
    }
  }

  const budget = cache.budgets.find((b: any) => b.platform === platform) || { daily_token_limit: 100000 };

  return {
    tokensUsed,
    limit: budget.daily_token_limit,
    messageCount,
    percentUsed: Math.round((tokensUsed / budget.daily_token_limit) * 100)
  };
}

async function checkBudgetsAndNotify(platform: string, cache: any) {
  const todayStr = new Date().toISOString().split('T')[0];
  const { alert_thresholds, notifications_enabled } = cache.settings;

  if (!notifications_enabled) return;

  // Check Platform Budget
  const platformStats = calculateCurrentUsage(platform, cache);
  const globalStats = calculateCurrentUsage('all', cache);

  const checkAndAlert = (statName: string, stats: any, currentPlatform: string) => {
    const alertKey = `${todayStr}_${currentPlatform}`;
    if (!sentAlertsToday[alertKey]) {
      sentAlertsToday[alertKey] = new Set();
    }

    const currentPercent = stats.percentUsed;
    
    // Find matching thresholds crossed
    for (const threshold of alert_thresholds) {
      if (currentPercent >= threshold && !sentAlertsToday[alertKey].has(threshold)) {
        sentAlertsToday[alertKey].add(threshold);
        triggerDesktopNotification(
          `${currentPlatform.toUpperCase()} Budget Alert`,
          `You have consumed ${currentPercent}% of your daily token budget for ${currentPlatform} (${stats.tokensUsed.toLocaleString()} / ${stats.limit.toLocaleString()} tokens).`
        );
      }
    }
  };

  checkAndAlert(platform, platformStats, platform);
  checkAndAlert('all', globalStats, 'all');
}

function triggerDesktopNotification(title: string, message: string) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png', // Fallback, chrome will load it from extension dir
    title: title,
    message: message,
    priority: 2
  });
}
