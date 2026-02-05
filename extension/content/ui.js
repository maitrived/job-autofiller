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
  }
};

// Export to window for access from other content scripts
window.UI = UI;
