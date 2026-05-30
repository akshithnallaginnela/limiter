/**
 * Injected Chatbox Usage Bar
 * Renders a clean, premium, and ultra-compact single-line usage status bar
 * directly above the AI chat prompt box for ChatGPT, Claude, Gemini, etc.
 * 
 * Collapses all data into a single row to save vertical workspace space.
 */

export interface UsageStats {
  tokensUsed: number;
  limit: number;
  messageCount: number;
  percentUsed: number;

  nativeMessagesUsed?: number;
  nativeMessageLimit?: number;
  nativeResetWindowHours?: number;
  nativePercentUsed?: number;
}

let activePlatformName = 'AI';

export function getChatboxContainer(platform: string): HTMLElement | null {
  activePlatformName = platform;
  
  if (platform === 'chatgpt') {
    const textarea = document.getElementById('prompt-textarea');
    if (textarea) {
      return textarea.closest('form') || textarea.parentElement;
    }
  } else if (platform === 'claude') {
    const editor = document.querySelector('[contenteditable="true"]') || document.querySelector('.ProseMirror');
    if (editor) {
      return editor.closest('fieldset') || editor.closest('.flex-col') || editor.parentElement;
    }
  } else if (platform === 'gemini') {
    const textarea = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
    if (textarea) {
      return textarea.closest('.input-container') || textarea.closest('form') || textarea.parentElement;
    }
  }
  
  const textarea = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
  if (textarea) {
    return textarea.closest('form') || textarea.parentElement;
  }
  
  return null;
}

export function injectUsageBar(targetContainer: HTMLElement): HTMLElement {
  let existingBar = document.getElementById('ai-usage-guardian-bar');
  if (existingBar) return existingBar;

  const barContainer = document.createElement('div');
  barContainer.id = 'ai-usage-guardian-bar';

  // Stylesheet injection
  const styleId = 'ai-usage-guardian-bar-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #ai-usage-guardian-bar {
        width: 96%;
        max-width: 820px;
        margin: 2px auto 6px auto;
        padding: 4px 8px;
        box-sizing: border-box;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: #475569;
        z-index: 9999;
        transition: all 0.3s ease;
        border-bottom: 1px dashed rgba(99, 102, 241, 0.15);
      }

      .dark #ai-usage-guardian-bar,
      [data-theme="dark"] #ai-usage-guardian-bar,
      body.dark-mode #ai-usage-guardian-bar,
      [class*="dark"] #ai-usage-guardian-bar {
        color: #94a3b8;
        border-bottom-color: rgba(99, 102, 241, 0.2);
      }

      .bar-left {
        display: flex;
        align-items: center;
        gap: 4px;
        font-weight: 700;
        color: #4f46e5;
      }

      .dark .bar-left,
      [data-theme="dark"] .bar-left,
      body.dark-mode .bar-left,
      [class*="dark"] .bar-left {
        color: #818cf8;
      }

      .bar-badge {
        display: inline-block;
        width: 5px;
        height: 5px;
        background-color: #6366f1;
        border-radius: 50%;
        box-shadow: 0 0 4px #6366f1;
      }

      .bar-mid {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .bar-item {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .bar-item-label {
        font-weight: 500;
      }

      .bar-item-val {
        font-weight: 600;
        color: #1e293b;
      }

      .dark .bar-item-val,
      [data-theme="dark"] .bar-item-val,
      body.dark-mode .bar-item-val,
      [class*="dark"] .bar-item-val {
        color: #e2e8f0;
      }

      .bar-mini-track {
        width: 50px;
        height: 4px;
        background: rgba(0, 0, 0, 0.06);
        border-radius: 2px;
        display: inline-block;
        overflow: hidden;
      }

      .dark .bar-mini-track,
      [data-theme="dark"] .bar-mini-track,
      body.dark-mode .bar-mini-track,
      [class*="dark"] .bar-mini-track {
        background: rgba(255, 255, 255, 0.15);
      }

      .bar-mini-fill {
        height: 100%;
        width: 0%;
        border-radius: 2px;
        transition: width 0.4s ease, background 0.3s ease;
      }

      .bar-divider {
        color: #cbd5e1;
      }

      .dark .bar-divider,
      [data-theme="dark"] .bar-divider,
      body.dark-mode .bar-divider,
      [class*="dark"] .bar-divider {
        color: #475569;
      }

      .bar-right {
        font-size: 10px;
        background: rgba(99, 102, 241, 0.08);
        color: #6366f1;
        padding: 1px 6px;
        border-radius: 4px;
        font-weight: 600;
        white-space: nowrap;
      }

      .dark .bar-right,
      [data-theme="dark"] .bar-right,
      body.dark-mode .bar-right,
      [class*="dark"] .bar-right {
        background: rgba(129, 140, 248, 0.12);
        color: #a5b4fc;
      }
    `;
    document.head.appendChild(style);
  }

  barContainer.innerHTML = `
    <div class="bar-left">
      <span class="bar-badge"></span>
      <span>${activePlatformName.toUpperCase()}</span>
    </div>
    
    <div class="bar-mid">
      <div class="bar-item">
        <span class="bar-item-label">Budget:</span>
        <span class="bar-item-val" id="ai-usage-budget-text">0/30K (0%)</span>
        <div class="bar-mini-track">
          <div class="bar-mini-fill" id="ai-usage-budget-fill"></div>
        </div>
      </div>
      
      <span class="bar-divider">•</span>

      <div class="bar-item">
        <span class="bar-item-label" id="ai-usage-capacity-title">Free Tier:</span>
        <span class="bar-item-val" id="ai-usage-capacity-text">0/10 (0%)</span>
        <div class="bar-mini-track">
          <div class="bar-mini-fill" id="ai-usage-capacity-fill"></div>
        </div>
      </div>
    </div>

    <div class="bar-right" id="ai-usage-messages-badge">
      0 msgs today
    </div>
  `;

  targetContainer.parentNode?.insertBefore(barContainer, targetContainer);
  return barContainer;
}

export function updateUsageBar(stats: UsageStats) {
  const budgetTextEl = document.getElementById('ai-usage-budget-text');
  const budgetFillEl = document.getElementById('ai-usage-budget-fill');
  const capacityTitleEl = document.getElementById('ai-usage-capacity-title');
  const capacityTextEl = document.getElementById('ai-usage-capacity-text');
  const capacityFillEl = document.getElementById('ai-usage-capacity-fill');
  const msgBadgeEl = document.getElementById('ai-usage-messages-badge');

  if (!budgetTextEl || !budgetFillEl || !capacityTextEl || !capacityFillEl) return;

  // 1. Calculate Custom Budget Metrics
  const budgetLimit = stats.limit || 30000;
  const budgetUsedPct = Math.max(0, Math.min(100, Math.round((stats.tokensUsed / budgetLimit) * 100)));
  
  // Format token counts in 'k' notation (e.g. 4.1k / 30k)
  const formatTokens = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'k';
    }
    return num.toString();
  };

  const tokensUsedStr = formatTokens(stats.tokensUsed);
  const budgetLimitStr = formatTokens(budgetLimit);

  // 2. Extract Message-Based Native Capacity Metrics
  const nativeUsed = stats.nativeMessagesUsed || 0;
  const nativeLimit = stats.nativeMessageLimit || 10;
  const nativeHours = stats.nativeResetWindowHours || 5;
  const capacityUsedPct = Math.max(0, Math.min(100, Math.round((nativeUsed / nativeLimit) * 100)));

  // Update messages count badge
  if (msgBadgeEl) {
    msgBadgeEl.textContent = `${stats.messageCount} msgs today`;
  }

  // Update Custom Budget Progress Bar
  budgetTextEl.textContent = `${tokensUsedStr}/${budgetLimitStr} (${budgetUsedPct}%)`;
  budgetFillEl.style.width = `${budgetUsedPct}%`;
  if (budgetUsedPct >= 85) {
    budgetFillEl.style.backgroundColor = '#ef4444'; // Red
  } else if (budgetUsedPct >= 65) {
    budgetFillEl.style.backgroundColor = '#f97316'; // Orange
  } else {
    budgetFillEl.style.backgroundColor = '#6366f1'; // Indigo
  }

  // Update Chatbot Native Capacity (Message-Based) Progress Bar
  if (capacityTitleEl) {
    capacityTitleEl.textContent = `Free Tier (${nativeHours}h):`;
  }
  capacityTextEl.textContent = `${nativeUsed}/${nativeLimit} (${capacityUsedPct}%)`;
  capacityFillEl.style.width = `${capacityUsedPct}%`;
  if (capacityUsedPct >= 85) {
    capacityFillEl.style.backgroundColor = '#ef4444'; // Red
  } else if (capacityUsedPct >= 65) {
    capacityFillEl.style.backgroundColor = '#f97316'; // Orange
  } else {
    capacityFillEl.style.backgroundColor = '#10b981'; // Emerald Green
  }
}
