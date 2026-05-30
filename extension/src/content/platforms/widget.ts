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
      width: 310px;
      background: #171717;
      border: 1px solid #2e2e2e;
      border-radius: 8px;
      color: #e5e5e5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 12px;
      z-index: 999999;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
      padding: 12px;
      box-sizing: border-box;
      user-select: none;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
    }
    
    #ai-usage-guardian-widget.collapsed {
      width: 120px;
      padding: 6px 10px;
      height: 30px;
      overflow: hidden;
    }

    .w-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    #ai-usage-guardian-widget.collapsed .w-header {
      margin-bottom: 0;
    }

    .w-title {
      font-weight: 600;
      font-size: 13px;
      color: #ffffff;
    }

    .w-header-actions {
      display: flex;
      gap: 8px;
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
      margin-bottom: 8px;
    }

    .w-section-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 3px;
    }

    .w-label {
      font-weight: 500;
      color: #e5e5e5;
    }

    .w-meta {
      font-size: 10px;
      color: #7a7a7a;
    }

    .w-progress-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .w-progress-bar-bg {
      flex: 1;
      height: 5px;
      background: #2b2b2b;
      border-radius: 2px;
      overflow: hidden;
    }

    .w-progress-bar-fill {
      height: 100%;
      background: #e06b52; /* Coral/orange theme color from image */
      width: 0%;
      border-radius: 2px;
      transition: width 0.4s ease;
    }

    .w-percent-display {
      font-weight: 600;
      width: 28px;
      text-align: right;
    }

    .w-checkbox-wrap {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 10px;
      color: #8a8a8a;
    }

    .w-checkbox-wrap input {
      accent-color: #e06b52;
      cursor: pointer;
    }

    .w-slider-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
    }

    .w-slider {
      flex: 1;
      height: 5px;
      background: #2b2b2b;
      border-radius: 2px;
      outline: none;
      -webkit-appearance: none;
      accent-color: #3b82f6; /* Blue slider handle */
    }

    .w-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #3b82f6;
      cursor: pointer;
      box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);
    }

    .w-slider-val-box {
      background: #222222;
      border: 1px solid #3a3a3a;
      border-radius: 4px;
      padding: 2px 6px;
      font-weight: bold;
      width: 28px;
      text-align: center;
    }

    .w-export-btn {
      background: #e06b52;
      color: #ffffff;
      border: none;
      border-radius: 4px;
      padding: 4px 10px;
      font-weight: 600;
      cursor: pointer;
      font-size: 11px;
      transition: background 0.2s;
    }

    .w-export-btn:hover {
      background: #d6593f;
    }

    .w-footer-avatar {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      border-top: 1px solid #2e2e2e;
      padding-top: 8px;
    }

    .w-avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #a1a1aa;
      color: #171717;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 10px;
    }

    .w-badge-status {
      font-size: 9px;
      background: #e06b52;
      color: #fff;
      padding: 1px 3px;
      border-radius: 2px;
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

  // Make the widget draggable by its header
  const header = container.querySelector('.w-header') as HTMLElement;
  if (header) {
    header.style.cursor = 'move';
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    header.addEventListener('mousedown', (e) => {
      // Don't drag if clicking buttons or actions inside the header
      if ((e.target as HTMLElement).closest('.w-header-actions') || (e.target as HTMLElement).id === 'w-minimize-btn' || (e.target as HTMLElement).id === 'w-refresh-btn') {
        return;
      }
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = container.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      
      // Switch positioning to precise top/left values
      container.style.bottom = 'auto';
      container.style.right = 'auto';
      container.style.left = `${startLeft}px`;
      container.style.top = `${startTop}px`;
      container.style.margin = '0';
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    });

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      let newLeft = startLeft + dx;
      let newTop = startTop + dy;
      
      const rect = container.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      
      // Keep within the viewport boundaries
      newLeft = Math.max(0, Math.min(newLeft, maxX));
      newTop = Math.max(0, Math.min(newTop, maxY));
      
      container.style.left = `${newLeft}px`;
      container.style.top = `${newTop}px`;
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }

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
