const UI = {
  autofillButton: null,

  /**
   * Show notification to user
   * @param {string} message
   * @param {string} type - 'success', 'error', 'warning', 'info'
   */
  showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.getElementById('job-autofill-notification');
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement('div');
    notification.id = 'job-autofill-notification';
    notification.className = `job-autofill-notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  },

  /**
   * Inject floating autofill button
   * @param {Function} onClick
   */
  injectAutofillButton(onClick) {
    // Don't inject if button already exists
    if (this.autofillButton || document.getElementById('job-autofill-button')) return;

    this.autofillButton = document.createElement('div');
    this.autofillButton.id = 'job-autofill-button';
    this.autofillButton.innerHTML = `
        <button id="autofill-trigger">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
          </svg>
          <span>Autofill</span>
        </button>
      `;

    document.body.appendChild(this.autofillButton);

    // Add click handler
    const button = document.getElementById('autofill-trigger');
    button.addEventListener('click', onClick);
  },

  /**
   * Show persistent automation status overlay
   */
  showAutomationOverlay(configName) {
    if (document.getElementById('autofiller-bot-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'autofiller-bot-overlay';
    overlay.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 320px;
        background: #111827;
        color: white;
        padding: 16px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.4);
        z-index: 999999;
        border: 1px solid #374151;
        font-family: 'Inter', system-ui, sans-serif;
    `;

    overlay.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <div style="width: 10px; height: 10px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; animation: blink 1.5s infinite;"></div>
            <strong style="color: #6366f1;">Applyr Bot: Running</strong>
        </div>
        <div style="font-size: 13px; margin-bottom: 8px; color: #9ca3af;">Config: <span style="color: white;">${configName}</span></div>
        <div id="bot-status-text" style="font-size: 14px; font-weight: 500; min-height: 40px; border-left: 2px solid #4f46e5; padding-left: 10px;">Initializing...</div>
        <div style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 11px; color: #6b7280;">Press STOP on dashboard to quit</div>
            <div id="bot-count-text" style="font-size: 18px; font-weight: 800; color: #10b981;">0</div>
        </div>
        <style>
            @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
        </style>
    `;

    document.body.appendChild(overlay);
  },

  updateAutomationOverlay(status, count = null) {
    const textEl = document.getElementById('bot-status-text');
    const countEl = document.getElementById('bot-count-text');
    if (textEl) textEl.textContent = status;
    if (countEl && count !== null) countEl.textContent = count;
  },

  hideAutomationOverlay() {
    const overlay = document.getElementById('autofiller-bot-overlay');
    if (overlay) overlay.remove();
  }
};

// Export to window for access from other content scripts
window.UI = UI;
