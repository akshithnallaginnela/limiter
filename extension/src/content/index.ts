import { createWidget, updateWidgetStats } from './platforms/widget';
import { estimateTokens } from '../utils/tokenizer';

let activePlatform = 'unknown';
let conversationId = 'default_conv';
let conversationTitle = 'New Chat';
let injectedWidget: HTMLDivElement | null = null;
let lastScrapedMessageCount = 0;

// Determine platform from URL
function detectPlatform(): string {
  const host = window.location.hostname;
  if (host.includes('chatgpt.com')) return 'chatgpt';
  if (host.includes('claude.ai')) return 'claude';
  if (host.includes('gemini.google.com')) return 'gemini';
  if (host.includes('x.com') || host.includes('grok.com')) return 'grok';
  if (host.includes('perplexity.ai')) return 'perplexity';
  return 'unknown';
}

// Scrapes conversations based on target platform selectors
function scrapeConversationData() {
  const platform = detectPlatform();
  if (platform === 'unknown') return;

  const urlParts = window.location.pathname.split('/');
  // Extract conversation ID from URL if present
  let newConvId = 'default_conv';
  if (platform === 'chatgpt' && urlParts.includes('c')) {
    newConvId = urlParts[urlParts.indexOf('c') + 1] || 'default_conv';
  } else if (platform === 'claude' && urlParts.includes('chat')) {
    newConvId = urlParts[urlParts.indexOf('chat') + 1] || 'default_conv';
  } else if (platform === 'gemini') {
    newConvId = urlParts[urlParts.length - 1] || 'default_conv';
  } else {
    // Fallback based on query params or hash
    newConvId = window.location.hash || 'default_conv';
  }

  if (newConvId !== conversationId) {
    conversationId = newConvId;
    lastScrapedMessageCount = 0;
    // Get chat title
    conversationTitle = document.title || `${platform.toUpperCase()} Chat`;
  }

  // Scrape message lists
  let userMessages: string[] = [];
  let assistantMessages: string[] = [];

  if (platform === 'claude') {
    // Select user messages
    document.querySelectorAll('[data-testid="user-message"]').forEach((el) => {
      userMessages.push(el.textContent || '');
    });
    // Select assistant messages (standard prose text)
    document.querySelectorAll('.font-claude-message').forEach((el) => {
      assistantMessages.push(el.textContent || '');
    });
  } else if (platform === 'chatgpt') {
    document.querySelectorAll('[data-testid^="conversation-turn"]').forEach((el) => {
      const isUser = el.querySelector('[data-testid="user-message"]') !== null;
      const text = el.querySelector('.markdown')?.textContent || el.textContent || '';
      if (isUser) {
        userMessages.push(text);
      } else {
        assistantMessages.push(text);
      }
    });
  } else if (platform === 'gemini') {
    document.querySelectorAll('.user-query').forEach((el) => {
      userMessages.push(el.textContent || '');
    });
    document.querySelectorAll('.model-response').forEach((el) => {
      assistantMessages.push(el.textContent || '');
    });
  } else {
    // Generic selectors for unknown or generic markdown bubbles
    document.querySelectorAll('pre, p, blockquote').forEach((el) => {
      // Very basic fallback parser if needed
    });
  }

  const totalScraped = userMessages.length + assistantMessages.length;
  if (totalScraped > lastScrapedMessageCount) {
    lastScrapedMessageCount = totalScraped;

    // Send the latest messages to the background script
    // Send user messages
    userMessages.forEach((msg, idx) => {
      chrome.runtime.sendMessage({
        type: 'NEW_MESSAGE_EVENT',
        payload: {
          platform,
          external_conv_id: conversationId,
          title: conversationTitle,
          role: 'user',
          content: msg,
          estimated_tokens: estimateTokens(msg)
        }
      }, (response) => {
        if (response && response.success) {
          updateWidgetDisplay(response.stats);
        }
      });
    });

    // Send assistant messages
    assistantMessages.forEach((msg, idx) => {
      chrome.runtime.sendMessage({
        type: 'NEW_MESSAGE_EVENT',
        payload: {
          platform,
          external_conv_id: conversationId,
          title: conversationTitle,
          role: 'assistant',
          content: msg,
          estimated_tokens: estimateTokens(msg)
        }
      }, (response) => {
        if (response && response.success) {
          updateWidgetDisplay(response.stats);
        }
      });
    });
  }
}

function updateWidgetDisplay(stats: any) {
  if (!injectedWidget) return;
  
  // Calculate mock hours and daily percentages
  const now = new Date();
  const resetHours = 23 - now.getHours();
  const resetMins = 59 - now.getMinutes();

  updateWidgetStats(injectedWidget, {
    sessionPercent: Math.min(100, Math.round(stats.percentUsed * 0.4)), // Simulate sub-session partition
    sessionResetText: `Resets in ${resetHours}h ${resetMins}m`,
    dailyPercent: stats.percentUsed,
    dailyResetText: `Resets in ${resetHours}h ${resetMins}m`,
    messageCount: stats.messageCount,
    updatedMinutesAgo: 0
  });
}

function handleExportChat() {
  // Scrapes the current chat history, generates a markdown file, and prompts download
  const platform = detectPlatform();
  const textBlocks: string[] = [];
  
  textBlocks.push(`# Chat Export - ${platform.toUpperCase()}`);
  textBlocks.push(`*Generated by AI Usage Guardian on ${new Date().toLocaleString()}*\n\n---\n`);

  if (platform === 'claude') {
    document.querySelectorAll('[data-testid="user-message"], .font-claude-message').forEach((el) => {
      const role = el.getAttribute('data-testid') === 'user-message' ? 'USER' : 'ASSISTANT';
      textBlocks.push(`### ${role}:\n${el.textContent || ''}\n`);
    });
  } else if (platform === 'chatgpt') {
    document.querySelectorAll('[data-testid^="conversation-turn"]').forEach((el) => {
      const isUser = el.querySelector('[data-testid="user-message"]') !== null;
      const role = isUser ? 'USER' : 'ASSISTANT';
      const text = el.querySelector('.markdown')?.textContent || el.textContent || '';
      textBlocks.push(`### ${role}:\n${text}\n`);
    });
  } else {
    // Fallback general export
    const paragraphs = document.querySelectorAll('p, pre');
    paragraphs.forEach((p) => {
      textBlocks.push(p.textContent || '');
    });
  }

  const blob = new Blob([textBlocks.join('\n\n')], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chat-export-${platform}-${conversationId}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Injects the floating usage box
function initializeWidget() {
  const platform = detectPlatform();
  if (platform === 'unknown') return;

  activePlatform = platform;
  
  if (!injectedWidget) {
    injectedWidget = createWidget(platform, handleExportChat);
    document.body.appendChild(injectedWidget);

    // Initial limits check and widget display
    chrome.runtime.sendMessage({ type: 'GET_CURRENT_LIMITS' }, (response) => {
      if (response && response.budgets) {
        const budget = response.budgets.find((b: any) => b.platform === platform) || { daily_token_limit: 100000 };
        // Trigger initial stats load
        updateWidgetDisplay({ percentUsed: 0, messageCount: 0 });
      }
    });
  }
}

// Watch DOM for new elements (new chat bubbles appearing)
function startObserver() {
  initializeWidget();
  scrapeConversationData();

  const observer = new MutationObserver(() => {
    // Prevent observer loops during self injections
    observer.disconnect();
    scrapeConversationData();
    // Restart observing
    observer.observe(document.body, { childList: true, subtree: true });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Periodically scrape to keep sync active even if window changes without heavy DOM updates
  setInterval(() => {
    scrapeConversationData();
  }, 10000);
}

// Wait for load
if (document.readyState === 'complete') {
  startObserver();
} else {
  window.addEventListener('load', startObserver);
}
