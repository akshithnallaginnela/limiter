import { getStorageData, setStorageData, updateLocalBudget } from '../storage/local';
import { syncWithBackend } from '../services/sync';

let activePlatform = 'all';
const BACKEND_URL = 'http://localhost:8000/api/v1';

function init() {
  setupTabs();
  setupPlatformTabs();
  loadOverviewData();
  setupBudgetForm();
  setupAuthForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// 1. Tab switches
function setupTabs() {
  const tabs = [
    { btn: 'tab-overview-btn', content: 'tab-overview' },
    { btn: 'tab-budget-btn', content: 'tab-budget' },
    { btn: 'tab-settings-btn', content: 'tab-settings' }
  ];

  tabs.forEach((tab) => {
    document.getElementById(tab.btn)?.addEventListener('click', () => {
      tabs.forEach((t) => {
        document.getElementById(t.btn)?.classList.remove('active');
        document.getElementById(t.content)?.classList.remove('active');
      });
      document.getElementById(tab.btn)?.classList.add('active');
      document.getElementById(tab.content)?.classList.add('active');
    });
  });
}

// 2. Platform selector tabs inside Overview
function setupPlatformTabs() {
  const platformTabs = document.querySelectorAll('.platform-tab');
  platformTabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      platformTabs.forEach((t) => t.classList.remove('active'));
      const target = e.target as HTMLElement;
      target.classList.add('active');
      activePlatform = target.dataset.platform || 'all';
      loadOverviewData();
    });
  });
}

// 3. Load Stats in Overview Card
async function loadOverviewData() {
  const cache = await getStorageData();
  const todayStr = new Date().toLocaleDateString('en-CA');

  // Calculate tokens & message counts for active platform
  let tokensUsed = 0;
  let messageCount = 0;
  let conversationCount = 0;

  cache.conversations.forEach((c) => {
    if (activePlatform !== 'all' && c.platform !== activePlatform) return;
    
    let hasMessageToday = false;
    c.messages.forEach((m) => {
      const msgDate = new Date(m.created_at).toLocaleDateString('en-CA');
      if (msgDate === todayStr) {
        tokensUsed += m.estimated_tokens;
        messageCount += 1;
        hasMessageToday = true;
      }
    });

    if (hasMessageToday) {
      conversationCount += 1;
    }
  });

  // Get matching budget
  const budget = cache.budgets.find((b) => b.platform === activePlatform) || {
    daily_token_limit: 100000,
    daily_message_limit: 100
  };

  const limit = budget.daily_token_limit;
  const remaining = Math.max(0, limit - tokensUsed);
  const percent = Math.min(100, Math.round((tokensUsed / limit) * 100)) || 0;

  // Update UI elements
  setText('tokens-used', tokensUsed.toLocaleString());
  setText('tokens-limit', limit.toLocaleString());
  setText('tokens-percent', `${percent}% used`);
  setText('tokens-remaining', `${remaining.toLocaleString()} remaining`);
  setText('msg-count', messageCount.toString());
  setText('conv-count', conversationCount.toString());

  const fillEl = document.getElementById('tokens-progress');
  if (fillEl) {
    fillEl.style.width = `${percent}%`;
    if (percent >= 90) {
      fillEl.style.backgroundColor = '#ef4444'; // red
    } else if (percent >= 75) {
      fillEl.style.backgroundColor = '#f97316'; // orange
    } else {
      fillEl.style.backgroundColor = '#3b82f6'; // blue
    }
  }

  // Calculate Burn Rate (tokens per hour) over the last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let recentTokens = 0;
  cache.conversations.forEach((c) => {
    if (activePlatform !== 'all' && c.platform !== activePlatform) return;
    c.messages.forEach((m) => {
      if (new Date(m.created_at) >= oneDayAgo) {
        recentTokens += m.estimated_tokens;
      }
    });
  });
  const burnRateVal = Math.round(recentTokens / 24.0);
  setText('burn-rate', `${burnRateVal.toLocaleString()} t/hr`);

  // Update auth details & sync badge
  const syncBadge = document.getElementById('sync-status');
  if (cache.settings.user_id) {
    setText('sync-status', 'Synced');
    if (syncBadge) {
      syncBadge.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
      syncBadge.style.color = '#10b981';
      syncBadge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    }
    showElement('profile-info');
    hideElement('login-form');
    setText('profile-email', cache.settings.email || 'Synced User');
  } else {
    setText('sync-status', 'Local Mode');
    if (syncBadge) {
      syncBadge.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
      syncBadge.style.color = '#ef4444';
      syncBadge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    }
    hideElement('profile-info');
    showElement('login-form');
  }
}

// 4. Budget Configurations Form
async function setupBudgetForm() {
  const platformSelect = document.getElementById('budget-platform-select') as HTMLSelectElement;
  const dailyLimitInput = document.getElementById('daily-limit-input') as HTMLInputElement;
  const dailyMsgLimitInput = document.getElementById('daily-msg-limit-input') as HTMLInputElement;
  const saveBtn = document.getElementById('save-budget-btn');

  const updateFields = async () => {
    const cache = await getStorageData();
    const plat = platformSelect.value;
    const budget = cache.budgets.find((b) => b.platform === plat) || {
      daily_token_limit: 100000,
      daily_message_limit: 100
    };
    dailyLimitInput.value = budget.daily_token_limit.toString();
    dailyMsgLimitInput.value = budget.daily_message_limit.toString();
  };

  platformSelect?.addEventListener('change', updateFields);
  await updateFields();

  saveBtn?.addEventListener('click', async () => {
    const plat = platformSelect.value;
    const limit = parseInt(dailyLimitInput.value, 10) || 100000;
    const msgLimit = parseInt(dailyMsgLimitInput.value, 10) || 100;

    await updateLocalBudget(plat, limit, msgLimit);

    // If authenticated, push limits to API backend
    const cache = await getStorageData();
    if (cache.settings.user_id) {
      try {
        await fetch(`${BACKEND_URL}/settings/${cache.settings.user_id}/budget`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: plat,
            daily_token_limit: limit,
            daily_message_limit: msgLimit
          })
        });
      } catch (err) {
        console.error('Failed to sync budget to server:', err);
      }
    }

    alert('Budget settings saved successfully!');
    loadOverviewData();
  });
}

// 5. Auth Configurations
function setupAuthForm() {
  const emailInput = document.getElementById('auth-email') as HTMLInputElement;
  const passInput = document.getElementById('auth-password') as HTMLInputElement;
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const syncNowBtn = document.getElementById('sync-now-btn');

  const handleAuth = async (isSignup: boolean) => {
    const email = emailInput.value;
    const password = passInput.value;

    if (!email || !password) {
      alert('Please fill in both email and password.');
      return;
    }

    try {
      // In this setup, we simulate Supabase or API authentication, generating a mock uuid linked to email
      // and creating profile in FastAPI database
      const mockUserId = 'usr_' + btoa(email).replace(/=/g, '').toLowerCase().substring(0, 16);

      const profileResponse = await fetch(`${BACKEND_URL}/auth/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: mockUserId,
          email: email
        })
      });

      if (!profileResponse.ok) {
        throw new Error('Authentication with local API failed');
      }

      const cache = await getStorageData();
      cache.settings.user_id = mockUserId;
      cache.settings.email = email;
      cache.settings.sync_enabled = true;
      await setStorageData(cache);

      // Perform immediate sync
      await syncWithBackend();
      alert(`Welcome, ${email}! Synchronization active.`);
      loadOverviewData();
    } catch (e) {
      console.error(e);
      alert('Authentication error. Ensure your FastAPI server is running on localhost:8000.');
    }
  };

  loginBtn?.addEventListener('click', () => handleAuth(false));
  signupBtn?.addEventListener('click', () => handleAuth(true));

  logoutBtn?.addEventListener('click', async () => {
    const cache = await getStorageData();
    cache.settings.user_id = null;
    cache.settings.email = null;
    cache.settings.sync_enabled = false;
    await setStorageData(cache);
    loadOverviewData();
  });

  syncNowBtn?.addEventListener('click', async () => {
    const success = await syncWithBackend();
    if (success) {
      alert('Sync completed successfully!');
    } else {
      alert('Sync failed. Please verify API endpoint availability.');
    }
    loadOverviewData();
  });
}

// Helpers
function setText(id: string, text: string) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function showElement(id: string) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';
}

function hideElement(id: string) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}
