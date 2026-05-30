import { createWidget, updateWidgetStats } from './platforms/widget';
import { estimateTokens } from '../utils/tokenizer';
import { getChatboxContainer, injectUsageBar, updateUsageBar } from './platforms/usageBar';

let activePlatform = 'unknown';
let conversationId = 'default_conv';
let conversationTitle = 'New Chat';
let injectedWidget: HTMLDivElement | null = null;
let lastScrapedMessageCount = 0;
let lastStats: any = null;

// Determine platform from URL
function detectPlatform(): string {
  const host = window.location.hostname;
  if (host.includes('chatgpt.com') || host.includes('openai.com')) return 'chatgpt';
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

  let currentMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  try {
    if (platform === 'claude') {
      const elements = document.querySelectorAll('[data-testid="user-message"], .font-user-message, [data-testid="assistant-message"], .font-claude-message');
      currentMessages = Array.from(elements).map((el) => {
        const isUser = el.getAttribute('data-testid') === 'user-message' || el.classList.contains('font-user-message');
        return {
          role: (isUser ? 'user' : 'assistant') as 'user' | 'assistant',
          content: el.textContent?.trim() || ''
        };
      }).filter(m => m.content.length > 0);
    } else if (platform === 'chatgpt') {
      const elements = document.querySelectorAll('[data-testid^="conversation-turn"], article');
      currentMessages = Array.from(elements).map((el) => {
        const isUser = el.querySelector('[data-testid="user-message"]') !== null || 
                       el.querySelector('[class*="user"]') !== null || 
                       el.outerHTML.includes('user');
        const text = el.querySelector('.markdown')?.textContent?.trim() || el.textContent?.trim() || '';
        return {
          role: (isUser ? 'user' : 'assistant') as 'user' | 'assistant',
          content: text
        };
      }).filter(m => m.content.length > 0);
    } else if (platform === 'gemini') {
      const elements = document.querySelectorAll('.user-query, [class*="query-text"], [class*="user-message"], .model-response, [class*="model-response"], [class*="assistant-message"]');
      currentMessages = Array.from(elements).map((el) => {
        const isUser = el.classList.contains('user-query') || el.className.includes('query-text') || el.className.includes('user-message');
        return {
          role: (isUser ? 'user' : 'assistant') as 'user' | 'assistant',
          content: el.textContent?.trim() || ''
        };
      }).filter(m => m.content.length > 0);
    } else if (platform === 'grok') {
      const elements = document.querySelectorAll('[data-testid="grok-message-container"], [class*="message-row"], [class*="message-bubble"]');
      currentMessages = Array.from(elements).map((el) => {
        const isUser = el.querySelector('[class*="user"]') !== null || 
                       el.className.includes('user') || 
                       el.outerHTML.includes('user');
        return {
          role: (isUser ? 'user' : 'assistant') as 'user' | 'assistant',
          content: el.textContent?.trim() || ''
        };
      }).filter(m => m.content.length > 0);
    } else if (platform === 'perplexity') {
      const elements = document.querySelectorAll('[class*="UserMessage"], [class*="query"], [class*="Answer"], [class*="answer"]');
      currentMessages = Array.from(elements).map((el) => {
        const isUser = el.className.includes('UserMessage') || el.className.includes('query');
        return {
          role: (isUser ? 'user' : 'assistant') as 'user' | 'assistant',
          content: el.textContent?.trim() || ''
        };
      }).filter(m => m.content.length > 0);
    }
  } catch (err) {
    console.error('Error selecting messages in scrapeConversationData:', err);
  }

  // Handle conversation changes (initial load or chat switches)
  if (newConvId !== conversationId) {
    conversationId = newConvId;
    // Set to current count so we ignore the historical prompts already visible on the screen
    lastScrapedMessageCount = currentMessages.length;
    conversationTitle = document.title || `${platform.toUpperCase()} Chat`;
    
    // Immediately query current stats from background to show them
    chrome.runtime.sendMessage({ type: 'GET_CURRENT_USAGE', platform }, (response) => {
      if (response && response.success && response.stats) {
        updateWidgetDisplay(response.stats);
      }
    });
    return; // Don't send initial history
  }

  if (currentMessages.length > lastScrapedMessageCount) {
    // Slice only the newly appended messages (e.g. index 10 onwards if last count was 10)
    const newMessages = currentMessages.slice(lastScrapedMessageCount);
    lastScrapedMessageCount = currentMessages.length;

    // Send only the newly added messages to the background script
    newMessages.forEach((msg) => {
      chrome.runtime.sendMessage({
        type: 'NEW_MESSAGE_EVENT',
        payload: {
          platform,
          external_conv_id: conversationId,
          title: conversationTitle,
          role: msg.role,
          content: msg.content,
          estimated_tokens: estimateTokens(msg.content)
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
  lastStats = stats;
  
  if (injectedWidget) {
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

  // Update the chatbox usage bar if it is currently in the DOM
  updateUsageBar({
    tokensUsed: stats.tokensUsed || 0,
    limit: stats.limit || 100000,
    messageCount: stats.messageCount || 0,
    percentUsed: stats.percentUsed || 0
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

    // Initial current usage check and widget display
    chrome.runtime.sendMessage({ type: 'GET_CURRENT_USAGE', platform }, (response) => {
      if (response && response.success && response.stats) {
        updateWidgetDisplay(response.stats);
      } else {
        updateWidgetDisplay({ percentUsed: 0, messageCount: 0, tokensUsed: 0, limit: 100000 });
      }
      checkAndInjectUsageBar();
    });
  }
}

function checkAndInjectUsageBar() {
  if (activePlatform === 'unknown') return;
  const chatboxContainer = getChatboxContainer(activePlatform);
  if (chatboxContainer) {
    const bar = injectUsageBar(chatboxContainer);
    if (bar && lastStats) {
      updateUsageBar({
        tokensUsed: lastStats.tokensUsed || 0,
        limit: lastStats.limit || 100000,
        messageCount: lastStats.messageCount || 0,
        percentUsed: lastStats.percentUsed || 0
      });
    }
  }
}

function setupActiveInputListener() {
  try {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        setTimeout(() => {
          scrapeConversationData();
        }, 800);
      }
    }, true);

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('button[class*="send"]') ||
        target.closest('button[data-testid*="send"]') ||
        target.closest('button[class*="submit"]') ||
        target.closest('[aria-label="Send prompt"]') ||
        target.closest('svg[class*="send"]')
      ) {
        setTimeout(() => {
          scrapeConversationData();
        }, 800);
      }
    }, true);
  } catch (err) {
    console.error('Error setting up active input listener:', err);
  }
}

// Watch DOM for new elements (new chat bubbles appearing)
function startObserver() {
  initializeWidget();
  scrapeConversationData();
  checkAndInjectUsageBar();
  setupActiveInputListener();

  const observer = new MutationObserver(() => {
    // Prevent observer loops during self injections
    observer.disconnect();
    scrapeConversationData();
    checkAndInjectUsageBar();
    // Restart observing
    observer.observe(document.body, { childList: true, subtree: true });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Periodically scrape to keep sync active even if window changes without heavy DOM updates
  setInterval(() => {
    scrapeConversationData();
    checkAndInjectUsageBar();
  }, 3000);
}

// Wait for load
if (document.readyState === 'complete') {
  startObserver();
} else {
  window.addEventListener('load', startObserver);
}
