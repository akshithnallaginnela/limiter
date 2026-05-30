/**
 * Injected "Usage summary" Widget
 * 
 * Replicates the style, typography, and functionality of the requested image.
 * Renders glassmorphic floating box with session/weekly progress bars,
 * limits reset indicators, sliders, message counts, and the export button.
 */
export function createWidget(platform: string, onExportClick: () => void): HTMLDivElement {
  const container = document.createElement('div');
  container.id = 'ai-usage-guardian-widget';
  
  // Renders beautiful glassmorphic stylesheet directly on injection
  const style = document.createElement('style');
  style.textContent = `
    #ai-usage-guardian-widget {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 440px;
      background: #171717;
      border: 1px solid #2e2e2e;
      border-radius: 12px;
      color: #e5e5e5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      z-index: 999999;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
      padding: 16px;
      box-sizing: border-box;
      user-select: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    #ai-usage-guardian-widget.collapsed {
      width: 140px;
      padding: 8px 12px;
      height: 38px;
      overflow: hidden;
    }

    .w-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }

    #ai-usage-guardian-widget.collapsed .w-header {
      margin-bottom: 0;
    }

    .w-title {
      font-weight: 600;
      font-size: 14px;
      color: #ffffff;
    }

    .w-header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
      color: #888888;
    }

    .w-header-actions span {
      cursor: pointer;
      transition: color 0.2s;
    }

    .w-header-actions span:hover {
      color: #ffffff;
    }

    .w-section {
      margin-bottom: 12px;
    }

    .w-section-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .w-label {
      font-weight: 500;
      color: #e5e5e5;
    }

    .w-meta {
      font-size: 11px;
      color: #7a7a7a;
    }

    .w-progress-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .w-progress-bar-bg {
      flex: 1;
      height: 6px;
      background: #2b2b2b;
      border-radius: 3px;
      overflow: hidden;
    }

    .w-progress-bar-fill {
      height: 100%;
      background: #e06b52; /* Coral/orange theme color from image */
      width: 0%;
      border-radius: 3px;
      transition: width 0.4s ease;
    }

    .w-percent-display {
      font-weight: 600;
      width: 32px;
      text-align: right;
    }

    .w-checkbox-wrap {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #8a8a8a;
    }

    .w-checkbox-wrap input {
      accent-color: #e06b52;
      cursor: pointer;
    }

    .w-slider-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 14px;
    }

    .w-slider {
      flex: 1;
      height: 6px;
      background: #2b2b2b;
      border-radius: 3px;
      outline: none;
      -webkit-appearance: none;
      accent-color: #3b82f6; /* Blue slider handle */
    }

    .w-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #3b82f6;
      cursor: pointer;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
    }

    .w-slider-val-box {
      background: #222222;
      border: 1px solid #3a3a3a;
      border-radius: 4px;
      padding: 4px 8px;
      font-weight: bold;
      width: 32px;
      text-align: center;
    }

    .w-export-btn {
      background: #e06b52;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 6px 14px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
      transition: background 0.2s;
    }

    .w-export-btn:hover {
      background: #d6593f;
    }

    .w-footer-avatar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      border-top: 1px solid #2e2e2e;
      padding-top: 12px;
    }

    .w-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #a1a1aa;
      color: #171717;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 11px;
    }

    .w-badge-status {
      font-size: 10px;
      background: #e06b52;
      color: #fff;
      padding: 1px 4px;
      border-radius: 3px;
      font-weight: bold;
    }
  `;
  
  document.head.appendChild(style);

  // Replicate Claude usage summary widgets
  container.innerHTML = `
    <div class="w-header">
      <span class="w-title">Usage summary (${platform.toUpperCase()})</span>
      <div class="w-header-actions">
        <span id="w-minimize-btn" title="Collapse">⤧</span>
        <span id="w-refresh-btn" title="Refresh">↻</span>
        <span class="w-meta" id="w-updated-time">Updated 0m ago</span>
      </div>
    </div>
    
    <div class="w-body">
      <!-- Session Bar -->
      <div class="w-section">
        <div class="w-section-row">
          <span class="w-label">Session</span>
          <span class="w-meta" id="w-session-reset">Resets in 4h 10m</span>
        </div>
        <div class="w-progress-container">
          <div class="w-progress-bar-bg">
            <div class="w-progress-bar-fill" id="w-session-fill" style="width: 9%;"></div>
          </div>
          <span class="w-percent-display" id="w-session-percent">9%</span>
          <label class="w-checkbox-wrap">
            <input type="checkbox" checked> Display
          </label>
        </div>
      </div>

      <!-- Weekly / Daily Bar -->
      <div class="w-section">
        <div class="w-section-row">
          <span class="w-label">Daily (All)</span>
          <span class="w-meta" id="w-daily-reset">Resets in 11h 00m</span>
        </div>
        <div class="w-progress-container">
          <div class="w-progress-bar-bg">
            <div class="w-progress-bar-fill" id="w-daily-fill" style="width: 23%;"></div>
          </div>
          <span class="w-percent-display" id="w-daily-percent">23%</span>
          <label class="w-checkbox-wrap">
            <input type="checkbox" checked> Display
          </label>
        </div>
      </div>

      <!-- Messages count & export options -->
      <div class="w-section-row" style="margin-top: 14px;">
        <span class="w-label">Messages: <span id="w-msg-count">0</span></span>
        <label class="w-checkbox-wrap">
          <input type="checkbox" id="w-export-new-chat"> Export to new chat
        </label>
      </div>

      <!-- Slider & Export Button -->
      <div class="w-slider-row">
        <input type="range" min="1" max="100" value="20" class="w-slider" id="w-export-slider">
        <div class="w-slider-val-box" id="w-slider-val">20</div>
        <span>%</span>
        <button class="w-export-btn" id="w-export-btn">Export chat</button>
      </div>

      <!-- Avatar & Platform Branding -->
      <div class="w-footer-avatar">
        <div class="w-avatar">U</div>
        <span class="w-meta">AI Usage Guardian</span>
        <div class="w-badge-status">Shield Active</div>
      </div>
    </div>
  `;

  // Attach event handlers
  const minimizeBtn = container.querySelector('#w-minimize-btn');
  minimizeBtn?.addEventListener('click', () => {
    container.classList.toggle('collapsed');
    if (container.classList.contains('collapsed')) {
      (minimizeBtn as HTMLElement).textContent = '⤢';
      (minimizeBtn as HTMLElement).title = 'Expand';
    } else {
      (minimizeBtn as HTMLElement).textContent = '⤧';
      (minimizeBtn as HTMLElement).title = 'Collapse';
    }
  });

  const exportSlider = container.querySelector('#w-export-slider') as HTMLInputElement;
  const sliderVal = container.querySelector('#w-slider-val') as HTMLDivElement;
  exportSlider?.addEventListener('input', () => {
    if (sliderVal) sliderVal.textContent = exportSlider.value;
  });

  const exportBtn = container.querySelector('#w-export-btn');
  exportBtn?.addEventListener('click', onExportClick);

  return container;
}

export function updateWidgetStats(
  container: HTMLDivElement, 
  stats: {
    sessionPercent: number;
    sessionResetText: string;
    dailyPercent: number;
    dailyResetText: string;
    messageCount: number;
    updatedMinutesAgo: number;
  }
) {
  const sessionFill = container.querySelector('#w-session-fill') as HTMLElement;
  const sessionPercent = container.querySelector('#w-session-percent') as HTMLElement;
  const sessionReset = container.querySelector('#w-session-reset') as HTMLElement;

  const dailyFill = container.querySelector('#w-daily-fill') as HTMLElement;
  const dailyPercent = container.querySelector('#w-daily-percent') as HTMLElement;
  const dailyReset = container.querySelector('#w-daily-reset') as HTMLElement;

  const msgCount = container.querySelector('#w-msg-count') as HTMLElement;
  const updatedTime = container.querySelector('#w-updated-time') as HTMLElement;

  if (sessionFill) sessionFill.style.width = `${stats.sessionPercent}%`;
  if (sessionPercent) sessionPercent.textContent = `${stats.sessionPercent}%`;
  if (sessionReset) sessionReset.textContent = stats.sessionResetText;

  if (dailyFill) dailyFill.style.width = `${stats.dailyPercent}%`;
  if (dailyPercent) dailyPercent.textContent = `${stats.dailyPercent}%`;
  if (dailyReset) dailyReset.textContent = stats.dailyResetText;

  if (msgCount) msgCount.textContent = stats.messageCount.toString();
  if (updatedTime) updatedTime.textContent = `Updated ${stats.updatedMinutesAgo}m ago`;
}
