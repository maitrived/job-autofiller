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
                    if (window.UI) UI.hideAutomationOverlay();
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
        if (!this.isActive || !this.config) return;

        const url = window.location.href.toLowerCase();
        const platform = (typeof FieldDetector !== 'undefined') ? FieldDetector.detectPlatform() : 'unknown';

        // PAGE VALIDATION: Only run on job-related pages
        const isJobPage = url.includes('/jobs/') || url.includes('/search/') || url.includes('/collections/');
        if (!isJobPage) {
            console.log('AutomationManager: Not on a job page. Standing by...');
            return;
        }

        // Show status to user
        if (window.UI) UI.showAutomationOverlay(this.config.name);
        this.notify('Auto-Apply: Active', 'info');
        console.log(`[BOT-v2] Platform detected: ${platform}`);

        try {
            if (platform === 'linkedin') {
                await this.handleLinkedInSearch();
            } else if (platform === 'indeed') {
                await this.handleIndeedSearch();
            } else {
                console.log('AutomationManager: Unsupported platform.');
                this.updateBotStatus('Idle: Platform not supported.');
            }
        } catch (error) {
            console.error('AutomationManager Error:', error);
            this.notify(`Auto-Apply Error: ${error.message}`, 'error');
            this.updateBotStatus(`Error: ${error.message}`);
        }
    },

    updateBotStatus(text, count = null) {
        if (window.UI) UI.updateAutomationOverlay(text, count);
    },

    async handleLinkedInSearch() {
        console.log('AutomationManager: LinkedIn bot searching...');
        this.updateBotStatus('Waiting for results...');

        // 1. Wait for job list
        const listSelector = [
            '.jobs-search-results-list',
            '.scaffold-layout__list',
            '.jobs-search-results__list',
            '.jobs-search-results-container',
            '[aria-label="Job Search Results"]',
            '#main ul.scaffold-layout__list-container'
        ].join(', ');

        try {
            await this.waitForSelector(listSelector, 12000);
        } catch (e) {
            console.log('AutomationManager: List selector timeout. Checking for single job page...');
            const immediateApply = this.findApplyButton();
            if (immediateApply) {
                const jobTitle = document.querySelector('.jobs-unified-top-card__job-title, .jobs-details-top-card__job-title')?.innerText.trim() || 'Direct Job';
                this.updateBotStatus(`Single Job: ${jobTitle}`);
                await this.handleApplyAction(immediateApply, jobTitle);
                return;
            }
            this.updateBotStatus('Results not found. Check keywords.');
            return;
        }

        this.updateBotStatus('Scanning jobs...');

        // Scroll the list a bit to trigger lazy loading
        const listElement = document.querySelector(listSelector);
        if (listElement) listElement.scrollTo({ top: 500, behavior: 'smooth' });
        await SafetyManager.humanWait(1000, 2000);

        // 2. Card selectors for identifying jobs
        const cardSelectors = [
            '.job-card-list__entity-lockup',
            '.jobs-search-results__list-item',
            '.job-card-container',
            '[data-occludable-job-id]',
            'li.jobs-search-results__list-item'
        ].join(', ');

        const processedJobIds = new Set();
        let appsThisSession = 0;

        while (this.isActive) {
            const jobCards = Array.from(document.querySelectorAll(cardSelectors));
            console.log(`AutomationManager: Found ${jobCards.length} potential jobs.`);
            let foundNewJob = false;

            for (let card of jobCards) {
                if (!this.isActive) break;

                // Unique ID for this card to avoid re-clicking
                const jobId = card.getAttribute('data-job-id') ||
                    card.getAttribute('data-occludable-job-id') ||
                    card.innerText.replace(/\s/g, '').substring(0, 50);

                if (processedJobIds.has(jobId)) continue;
                processedJobIds.add(jobId);
                foundNewJob = true;

                // Get details
                const titleEl = card.querySelector('.job-card-list__title, .job-card-container__link, .artdeco-entity-lockup__title');
                const jobTitle = titleEl?.innerText.trim() || 'Software Job';

                this.updateBotStatus(`Checking: ${jobTitle}`);
                console.log(`[BOT-v2] Checking job: ${jobTitle}`);

                // Click and scroll with robustness
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await SafetyManager.humanWait(800, 1200);

                // Click the link inside the card with multi-event dispatch
                const link = card.querySelector('a.job-card-list__title, a.job-card-container__link') || card;
                console.log(`[BOT-v2] Clicking job card for: ${jobTitle}`);
                link.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                link.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                link.click();

                await SafetyManager.humanWait(2500, 4000);

                // Fetch JD and analyze match score
                let jdText = '';
                const jdContainer = document.querySelector('.jobs-description__content, #job-details, .jobs-search__job-details--container');
                if (jdContainer) {
                    jdText = jdContainer.innerText;
                }

                // Analyze if it suits the profile
                const profileRes = await chrome.runtime.sendMessage({ action: 'getProfile' });
                const profile = profileRes.profile;
                
                if (profile && jdText) {
                    this.updateBotStatus(`Analyzing JD for: ${jobTitle}`);
                    const prefRes = await chrome.storage.local.get('jobSearchPreferences');
                    const prefs = prefRes.jobSearchPreferences ? JSON.parse(prefRes.jobSearchPreferences) : {};
                    
                    const matchResult = await window.AIAnalyzer.calculateMatchScore(profile, jdText, prefs);
                    console.log(`[BOT-v2] Match Score for ${jobTitle}: ${matchResult.score}`);
                    
                    if (matchResult.score < 50) { // Minimum threshold for applying
                        console.log(`[BOT-v2] Skipping ${jobTitle}. Low match score (${matchResult.score}). reason: ${matchResult.reasoning}`);
                        this.updateBotStatus(`Skipped (Score ${matchResult.score})`);
                        continue;
                    }
                }

                // Check for APPLY / EASY APPLY
                const applyBtn = this.findApplyButton();
                if (applyBtn) {
                    const success = await this.handleApplyAction(applyBtn, jobTitle);
                    if (success) appsThisSession++;
                } else {
                    console.log(`[BOT-v2] Skipping ${jobTitle} (No Apply button found)`);
                }
            }

            if (!foundNewJob) {
                this.updateBotStatus('No more jobs on screen. Scrolling list...');
                if (listElement) {
                    listElement.scrollBy(0, 600);
                    await SafetyManager.humanWait(3000, 5000);
                } else {
                    break;
                }

                // Check if we actually found anything new after scroll
                const stillNone = Array.from(document.querySelectorAll(cardSelectors))
                    .filter(c => !processedJobIds.has(c.getAttribute('data-job-id') || c.innerText.replace(/\s/g, '').substring(0, 50)));

                if (stillNone.length === 0) {
                    this.updateBotStatus('Finished scanning all detectable jobs.');
                    break;
                }
            }
        }
    },

    async handleApplyAction(applyBtn, jobTitle) {
        if (!applyBtn || !this.isActive) return false;

        this.updateBotStatus(`APPLYING: ${jobTitle}`);
        console.log(`[BOT-v2] Handling Apply for: ${jobTitle}`);

        // Robust click on apply button
        applyBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await SafetyManager.humanWait(1000, 2000);

        // Try direct click first
        applyBtn.click();

        // Wait and verify modal
        await SafetyManager.humanWait(2500, 4000);

        const modalSelector = PLATFORM_SELECTORS.linkedin.formContainer;
        let modal = document.querySelector(modalSelector);

        // RETRY CLICK if modal didn't open
        if (!modal) {
            console.log('[BOT-v2] Modal not opened. Retrying click with mouse events...');
            applyBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            applyBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            applyBtn.click();
            await SafetyManager.humanWait(3000, 5000);
            modal = document.querySelector(modalSelector);
        }

        if (modal) {
            console.log('[BOT-v2] Modal detected in DOM.');
            this.notify(`Applying for ${jobTitle}`, 'info');

            // Small delay for animations
            await SafetyManager.humanWait(1000, 2000);

            console.log('[BOT-v2] Loading profile data...');
            const profileRes = await chrome.runtime.sendMessage({ action: 'getProfile' });

            if (profileRes.profile) {
                console.log('[BOT-v2] Starting multi-step autofill process...');
                const success = await Autofiller.handleMultiStep(profileRes.profile);
                if (success) {
                    await this.incrementSubmitted();
                    this.updateBotStatus(`Applied!`);
                    console.log(`[BOT-v2] SUCCESS: Applied to ${jobTitle}`);
                    // Cleanup modal if it's still there
                    await this.closeModal();
                    await SafetyManager.humanWait(2000, 3000);
                    return true;
                } else {
                    console.log(`[BOT-v2] SKIPPED: ${jobTitle} (Needs manual info)`);
                }
            } else {
                console.error('[BOT-v2] ERROR: No profile found in storage!');
            }
        } else {
            console.log(`[BOT-v2] Modal not detected. This is likely an external Apply link.`);
            const isExternal = applyBtn.tagName === 'A' || applyBtn.getAttribute('target') === '_blank' || applyBtn.innerText.toLowerCase().includes('apply now');

            if (isExternal) {
                 this.notify(`External portal opened for ${jobTitle}`, 'success');
                 // Signal background to watch for the new tab and auto-fill it
                 chrome.runtime.sendMessage({ action: 'externalApplyTriggered', jobTitle });
            } else {
                 this.notify(`Opened application for ${jobTitle}`, 'info');
            }

            await this.incrementSubmitted();
            this.updateBotStatus(`Opened External!`);
            return true;
        }

        // Cleanup modal if it's still there
        await this.closeModal();
        await SafetyManager.humanWait(2000, 3000);
        return false;
    },

    findApplyButton() {
        const selectors = [
            'button.jobs-apply-button',
            '.jobs-s-apply button',
            '[aria-label*="Easy Apply"]',
            '[aria-label*="Apply"]',
            '.jobs-apply-button--top-card'
        ];

        for (let sel of selectors) {
            const btn = document.querySelector(sel);
            if (btn) {
                const text = btn.innerText.toLowerCase();
                if (text.includes('easy apply') || text === 'apply' || text.includes('apply now')) {
                    return btn;
                }
            }
        }

        // Fallback: Look for ANY primary button with the text
        const buttons = Array.from(document.querySelectorAll('button.artdeco-button--primary'));
        return buttons.find(b => {
            const text = b.innerText.toLowerCase();
            return text.includes('easy apply') || text === 'apply' || text.includes('apply now');
        });
    },

    async closeModal() {
        const closeSelectors = [
            '.artdeco-modal__dismiss',
            '[aria-label="Dismiss"]',
            '[aria-label="Close"]',
            '.jobs-easy-apply-modal__close-button'
        ];

        for (let sel of closeSelectors) {
            const btn = document.querySelector(sel);
            if (btn && (btn.offsetWidth > 0 || btn.offsetHeight > 0)) {
                console.log('AutomationManager: Closing modal...');
                btn.click();
                await window.SafetyManager.humanWait(1000, 1500);

                // Confirm dismissal if LinkedIn asks ("Discard application?")
                const confirmBtn = document.querySelector('button[data-control-name="discard_application_confirm_btn"]');
                if (confirmBtn) {
                    confirmBtn.click();
                    await window.SafetyManager.humanWait(1000, 1500);
                }
                return;
            }
        }

        // Fallback: Press Escape key
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    },

    async handleIndeedSearch() {
        console.log('AutomationManager: Indeed automation starting...');
        this.updateBotStatus('Waiting for Indeed results...');

        // 1. Wait for job list
        const listSelector = '.jobsearch-ResultsList, #mosaic-provider-jobcards, ul.jobsearch-ResultsList';

        try {
            await this.waitForSelector(listSelector, 12000);
        } catch (e) {
            console.log('AutomationManager: List selector timeout. Checking for single Indeed job page...');
            const immediateApply = this.findIndeedApplyButton();
            if (immediateApply) {
                const jobTitle = document.querySelector('.jobsearch-JobInfoHeader-title')?.innerText.trim() || 'Direct Job';
                this.updateBotStatus(`Single Job: ${jobTitle}`);
                await this.handleApplyAction(immediateApply, jobTitle);
                return;
            }
            this.updateBotStatus('Results not found. Check keywords.');
            return;
        }

        this.updateBotStatus('Scanning jobs...');

        // 2. Card selectors for identifying jobs
        const cardSelectors = '.job_seen_beacon, .result, .tapItem';
        const processedJobIds = new Set();
        let appsThisSession = 0;

        while (this.isActive) {
            const jobCards = Array.from(document.querySelectorAll(cardSelectors));
            console.log(`AutomationManager: Found ${jobCards.length} potential Indeed jobs.`);
            let foundNewJob = false;

            for (let card of jobCards) {
                if (!this.isActive) break;

                // Unique ID for this card
                const linkEl = card.querySelector('a.jcs-JobTitle') || card.querySelector('a[data-jk]');
                const jobId = linkEl ? linkEl.getAttribute('data-jk') || linkEl.href : card.innerText.replace(/\s/g, '').substring(0, 50);

                if (processedJobIds.has(jobId)) continue;
                processedJobIds.add(jobId);
                foundNewJob = true;

                // Get details
                const titleEl = card.querySelector('.jobTitle, h2');
                const jobTitle = titleEl?.innerText.trim() || 'Software Job';

                this.updateBotStatus(`Checking: ${jobTitle}`);
                console.log(`[BOT-v2] Checking job: ${jobTitle}`);

                // Click and scroll with robustness
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await SafetyManager.humanWait(800, 1200);

                // Click the card to load JD in the side pane
                const clickable = linkEl || card;
                clickable.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                clickable.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                clickable.click();

                await SafetyManager.humanWait(2500, 4000);

                // Fetch JD and analyze match score
                let jdText = '';
                const jdContainer = document.querySelector('#jobDescriptionText');
                if (jdContainer) {
                    jdText = jdContainer.innerText;
                }

                // Analyze if it suits the profile
                const profileRes = await chrome.runtime.sendMessage({ action: 'getProfile' });
                const profile = profileRes.profile;
                
                if (profile && jdText) {
                    this.updateBotStatus(`Analyzing JD for: ${jobTitle}`);
                    const prefRes = await chrome.storage.local.get('jobSearchPreferences');
                    const prefs = prefRes.jobSearchPreferences ? JSON.parse(prefRes.jobSearchPreferences) : {};
                    
                    const matchResult = await window.AIAnalyzer.calculateMatchScore(profile, jdText, prefs);
                    console.log(`[BOT-v2] Match Score for ${jobTitle}: ${matchResult.score}`);
                    
                    if (matchResult.score < 50) { 
                        console.log(`[BOT-v2] Skipping ${jobTitle}. Low match score (${matchResult.score}). reason: ${matchResult.reasoning}`);
                        this.updateBotStatus(`Skipped (Score ${matchResult.score})`);
                        continue;
                    }
                }

                // Check for APPLY
                const applyBtn = this.findIndeedApplyButton();
                if (applyBtn) {
                    const success = await this.handleApplyAction(applyBtn, jobTitle);
                    if (success) appsThisSession++;
                } else {
                    console.log(`[BOT-v2] Skipping ${jobTitle} (No Apply button found)`);
                }
            }

            if (!foundNewJob) {
                this.updateBotStatus('No more jobs on screen. Attempting pagination...');
                const nextBtn = document.querySelector('[data-testid="pagination-page-next"]');
                if (nextBtn) {
                    nextBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                    nextBtn.click();
                    await SafetyManager.humanWait(4000, 6000);
                } else {
                    this.updateBotStatus('Finished scanning all detectable jobs.');
                    break;
                }
            }
        }
    },

    findIndeedApplyButton() {
        const selectors = [
            '#indeedApplyButton',
            '.jobsearch-IndeedApplyButton-buttonWrapper button',
            'button.css-13h211',
            '[aria-label*="Apply"]',
            '.jobsearch-JobComponent-applyButtonContainer button'
        ];

        for (let sel of selectors) {
            const btn = document.querySelector(sel);
            if (btn && this.isVisible(btn)) {
                return btn;
            }
        }
        return null;
    },

    isVisible(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
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

// Start initialization and attach core objects to window
if (typeof window !== 'undefined') {
    AutomationManager.init();

    // Attach core objects to window for cross-file availability
    if (typeof FieldDetector !== 'undefined') window.FieldDetector = FieldDetector;
    if (typeof Autofiller !== 'undefined') window.Autofiller = Autofiller;
    if (typeof SafetyManager !== 'undefined') window.SafetyManager = SafetyManager;
    if (typeof FIELD_PATTERNS !== 'undefined') window.FIELD_PATTERNS = FIELD_PATTERNS;
    if (typeof PLATFORM_SELECTORS !== 'undefined') window.PLATFORM_SELECTORS = PLATFORM_SELECTORS;
    if (typeof INPUT_TYPES !== 'undefined') window.INPUT_TYPES = INPUT_TYPES;
    if (typeof STORAGE_KEYS !== 'undefined') window.STORAGE_KEYS = STORAGE_KEYS;
    if (typeof DEFAULT_SETTINGS !== 'undefined') window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
}
