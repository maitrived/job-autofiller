/**
 * Automation Manager - Manages the job search/navigation flow during auto-apply
 */

const AutomationManager = {
    isActive: false,
    config: null,

    async init() {
        // Safety check for invalidated context
        if (!chrome.runtime?.id) return;

        // Listen for stop signal AND start signal
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'local' && changes.activeAutoApply) {
                if (!changes.activeAutoApply.newValue) {
                    console.log('AutomationManager: Stop signal received.');
                    this.isActive = false;
                } else if (changes.activeAutoApply.newValue && changes.activeAutoApply.newValue.status === 'running') {
                    // START signal received via storage change
                    console.log('AutomationManager: Start signal received via storage change.');
                    this.isActive = true;
                    this.config = changes.activeAutoApply.newValue.config;
                    this.startAutomation();
                }
            }
        });

        // Also check on initial load (in case we're resuming)
        console.log('AutomationManager: Checking session state...');
        const result = await chrome.storage.local.get('activeAutoApply');
        if (result.activeAutoApply && result.activeAutoApply.status === 'running') {
            this.isActive = true;
            this.config = result.activeAutoApply.config;
            console.log('AutomationManager: Session active. Starting automation...');

            this.startAutomation();
        }
    },

    async startAutomation() {
        // Show status to user (using local notification helper)
        this.notify('Auto-Apply: Searching for jobs...', 'info');

        const platform = FieldDetector.detectPlatform();
        console.log(`AutomationManager: Platform detected: ${platform}`);

        try {
            if (platform === 'linkedin') {
                await this.handleLinkedInSearch();
            } else if (platform === 'indeed') {
                await this.handleIndeedSearch();
            } else {
                console.log('AutomationManager: Not on a supported search page currently.');
            }
        } catch (error) {
            console.error('AutomationManager Error:', error);
            this.notify(`Auto-Apply Error: ${error.message}`, 'error');
        }
    },

    async handleLinkedInSearch() {
        console.log('AutomationManager: Waiting for LinkedIn search results...');

        // 1. Wait for job list with multiple fallbacks
        const listSelector = '.jobs-search-results-list, .scaffold-layout__list, .jobs-search-results__list, .jobs-search-results-container';
        try {
            await this.waitForSelector(listSelector, 15000);
        } catch (e) {
            console.log('AutomationManager: Could not find job list. Site might be different.');
            throw new Error('Search results list not found.');
        }

        // 2. Find jobs
        const cardSelectors = '.jobs-search-results__list-item, .job-card-container, [data-occludable-job-id], .jobs-search-results-list__item';
        const jobCards = Array.from(document.querySelectorAll(cardSelectors));
        console.log(`AutomationManager: Found ${jobCards.length} job cards.`);

        if (jobCards.length === 0) {
            this.notify('No jobs found on this page.', 'warning');
            return;
        }

        for (let card of jobCards) {
            if (!this.isActive) break;

            const titleEl = card.querySelector('.job-card-list__title, .job-card-container__link, .artdeco-entity-lockup__title');
            const jobTitle = titleEl?.textContent.trim() || 'Software Job';
            const jobUrl = card.querySelector('a')?.href || window.location.href;

            console.log(`AutomationManager: Processing job: ${jobTitle}`);
            await this.reportProgress(jobUrl);

            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.click();
            await SafetyManager.humanWait(2000, 3500);

            // Check for Easy Apply button
            const applySelectors = [
                'button.jobs-apply-button',
                '.jobs-s-apply button',
                '[aria-label*="Easy Apply"]',
                '.jobs-apply-button--top-card'
            ];

            let applyBtn = null;
            for (let sel of applySelectors) {
                const btn = document.querySelector(sel);
                if (btn && btn.textContent.toLowerCase().includes('easy apply')) {
                    applyBtn = btn;
                    break;
                }
            }

            if (applyBtn) {
                console.log('AutomationManager: Triggering Easy Apply...');
                this.notify(`Applying to: ${jobTitle}`, 'info');

                applyBtn.click();
                console.log('AutomationManager: Clicked Easy Apply. Waiting for modal...');

                // CRITICAL: Wait for the modal to actually appear before filling
                const modalSelector = PLATFORM_SELECTORS.linkedin.formContainer || '.jobs-easy-apply-content, .jobs-apply-form';
                try {
                    await this.waitForSelector(modalSelector, 10000); // Increased to 10s
                    console.log('AutomationManager: Modal detected.');

                    if (!this.isActive) return; // Exit complete function if stopped

                    const profileRes = await chrome.runtime.sendMessage({ action: 'getProfile' });
                    if (profileRes.profile) {
                        const success = await Autofiller.handleMultiStep(profileRes.profile);
                        if (success) {
                            await this.incrementSubmitted();
                            this.notify(`Applied successfully to ${jobTitle}!`, 'success');
                        }
                    }
                } catch (e) {
                    console.log('AutomationManager: Modal did not appear in time. Selector:', modalSelector);
                }

                if (!this.isActive) break;
                await SafetyManager.humanWait(3000, 5000);
            } else {
                console.log(`AutomationManager: Skipping ${jobTitle} (No Easy Apply)`);
            }
        }
    },

    async handleIndeedSearch() {
        console.log('AutomationManager: Indeed automation starting...');
        this.notify('Indeed auto-apply coming soon!', 'info');
    },

    notify(msg, type) {
        // Use the UI namespace helper from ui.js
        if (window.UI && typeof window.UI.showNotification === 'function') {
            window.UI.showNotification(msg, type);
        } else if (typeof UI !== 'undefined' && UI.showNotification) {
            UI.showNotification(msg, type);
        } else {
            console.log(`[AutomationManager] ${type.toUpperCase()}: ${msg}`);
        }
    },

    async reportProgress(jobUrl) {
        const result = await chrome.storage.local.get('activeAutoApply');
        if (result.activeAutoApply) {
            const updated = { ...result.activeAutoApply };
            updated.progress.currentJobUrl = jobUrl;
            await chrome.storage.local.set({ activeAutoApply: updated });

            chrome.runtime.sendMessage({
                action: 'broadcastStatusUpdate',
                status: updated
            });
        }
    },

    async incrementSubmitted() {
        const result = await chrome.storage.local.get('activeAutoApply');
        if (result.activeAutoApply) {
            const updated = { ...result.activeAutoApply };
            updated.progress.applicationsSubmitted++;
            await chrome.storage.local.set({ activeAutoApply: updated });

            chrome.runtime.sendMessage({
                action: 'broadcastStatusUpdate',
                status: updated
            });
        }
    },

    waitForSelector(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);

            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) {
                    observer.disconnect();
                    resolve(el);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timeout waiting for selector: ${selector}`));
            }, timeout);
        });
    }
};

// Start initialization
if (typeof window !== 'undefined') {
    AutomationManager.init();
}
