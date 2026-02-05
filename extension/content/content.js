let isFormDetected = false;

// --- Visibility Spoofing for Indeed/LinkedIn ---
function handleVisibilitySpoofing() {
    // Override visibilityState to always be 'visible'
    Object.defineProperty(document, 'visibilityState', {
        get: function () { return 'visible'; }
    });
    Object.defineProperty(document, 'hidden', {
        get: function () { return false; }
    });

    // Block visibilitychange events
    window.addEventListener('visibilitychange', (e) => {
        e.stopImmediatePropagation();
    }, true);

    // Spoof focus/blur
    window.addEventListener('blur', (e) => {
        e.stopImmediatePropagation();
    }, true);
}

handleVisibilitySpoofing();

// Initialize when page loads
function init() {
    console.log('Job Autofiller Content Script active on:', window.location.href);

    // Bridges dashboard requests to extension
    // Broader check for local development environments
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.addEventListener('message', async (event) => {
            // Check if extension is still alive
            if (typeof chrome === 'undefined' || !chrome.runtime) return;

            try {
                if (event.data && event.data.type === 'GET_JOBS') {
                    const result = await chrome.storage.local.get('discoveredJobs');
                    window.postMessage({ type: 'JOBS_DATA', jobs: result.discoveredJobs || [] }, '*');
                }
                if (event.data && event.data.type === 'CHECK_STATUS') {
                    StatusScraper.checkAllStatuses();
                }
                if (event.data && event.data.type === 'UPDATE_AI_CONFIG') {
                    await chrome.storage.local.set({
                        openRouterApiKey: event.data.apiKey,
                        openRouterModel: event.data.model
                    });
                }
                if (event.data && event.data.type === 'START_AUTO_APPLY') {
                    console.log('Bridge: START_AUTO_APPLY received from dashboard');

                    // VISUAL DEBUG: Notify user that message was received
                    if (window.UI) UI.showNotification('Extension: Starting Auto-Apply...', 'success');

                    chrome.runtime.sendMessage({
                        action: 'startAutoApply',
                        searchProfile: event.data.searchProfile,
                        jobBoards: event.data.jobBoards,
                        profile: event.data.profile
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error('Bridge: Error sending START_AUTO_APPLY:', chrome.runtime.lastError.message);
                        } else {
                            console.log('Bridge: Background response for START:', response);
                        }
                    });
                }
                if (event.data && event.data.type === 'STOP_AUTO_APPLY') {
                    console.log('Bridge: STOP_AUTO_APPLY received from dashboard');
                    chrome.runtime.sendMessage({
                        action: 'stopAutoApply',
                        searchProfileId: event.data.searchProfileId
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error('Bridge: Error sending STOP_AUTO_APPLY:', chrome.runtime.lastError.message);
                        } else {
                            console.log('Bridge: Background response for STOP:', response);
                        }
                    });
                }
            } catch (e) {
                // Silently ignore context invalidation errors
                if (e.message && e.message.includes('context invalidated')) {
                    // This is expected when the extension reloads but the tab is still open
                } else {
                    console.warn('Job Autofiller Bridge:', e.message);
                }
            }
        });
    }

    // Check if we're on a job application page
    const platform = FieldDetector.detectPlatform();
    const urlParams = new URLSearchParams(window.location.search);
    const shouldAutofill = urlParams.get('autofill') === 'true';

    if (platform !== 'generic' || hasJobApplicationForm()) {
        isFormDetected = true;
        injectAutofillButton();

        // Always try to capture JD if we're on a job-related page
        expandAndCaptureJD();

        if (shouldAutofill) {
            handleAutoApply();
        }
    }
}

/**
 * Handle fully automatic application flow
 */
async function handleAutoApply() {
    try {
        const result = await chrome.storage.local.get('jobAutofillProfile');
        const profile = result.jobAutofillProfile;

        if (profile) {
            showNotification('Auto-apply triggered. Starting...', 'info');

            // 1. Handle Login first (Google Sign-in, etc.)
            await Autofiller.handleLogin(profile);

            // 2. Give the page a moment to fully load/login
            await new Promise(resolve => setTimeout(resolve, 3000));

            // 3. Ensure we have the JD before starting
            await expandAndCaptureJD();

            // 4. Start the application
            await Autofiller.handleMultiStep(profile);

            showNotification('Automatic application process complete!', 'success');
        }
    } catch (error) {
        console.error('Auto-apply error:', error);
        showNotification('Automatic application failed. Please try manually.', 'error');
    }
}

/**
 * Detect and expand job description buttons ("Read More", "See More")
 */
async function expandAndCaptureJD() {
    const selectors = [
        'button.jobs-description__footer-button', // LinkedIn
        'button.jobs-description-details__footer-button', // LinkedIn Alternative
        'div#jobDescriptionText', // Indeed (usually already expanded but good to check)
        'button.show-more-button', // Generic
        'a.show-more-link', // Generic
        '[aria-label*="Show more"]',
        '[aria-label*="Read more"]'
    ];

    // Find and click "Read more" buttons
    for (const selector of selectors) {
        const btn = document.querySelector(selector);
        if (btn && Autofiller.isVisible(btn)) {
            const text = btn.textContent.toLowerCase();
            if (text.includes('more') || text.includes('read') || text.includes('see')) {
                console.log('Expanding Job Description...');
                btn.click();
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for expansion
                break;
            }
        }
    }

    // Capture JD text
    const jdKeywords = ['responsibilities', 'qualifications', 'requirements', 'about the role', 'what you will do'];
    const bodyText = document.body.innerText;

    const hasJD = jdKeywords.some(k => bodyText.toLowerCase().includes(k));

    if (hasJD) {
        // Find the most likely JD container to avoid noise
        // This is a simplified version, can be refined per platform
        const jdText = bodyText.substring(0, 10000); // Take first 10k chars

        chrome.storage.local.set({
            activeJobContext: {
                text: jdText,
                url: window.location.href,
                timestamp: Date.now()
            }
        });
        console.log('Job Description captured and persisted.');
    }
}

/**
 * Check if page has a job application form
 * @returns {boolean}
 */
function hasJobApplicationForm() {
    const fields = FieldDetector.detectFields();

    // If we have at least 3 common job application fields, it's likely a job form
    const jobFields = fields.filter(f =>
        ['firstName', 'lastName', 'email', 'phone', 'resume', 'coverLetter'].includes(f.type)
    );

    return jobFields.length >= 3;
}

function injectAutofillButton() {
    // Safety check for invalidated context
    if (!chrome.runtime?.id) return;

    // Use the UI namespace helper from ui.js
    if (window.UI && typeof window.UI.injectAutofillButton === 'function') {
        window.UI.injectAutofillButton(handleAutofill);
    } else if (typeof UI !== 'undefined' && UI.injectAutofillButton) {
        UI.injectAutofillButton(handleAutofill);
    }
}

/**
 * Handle autofill action
 */
async function handleAutofill() {
    try {
        // Show loading state
        const button = document.getElementById('autofill-trigger');
        const originalHTML = button.innerHTML;
        button.innerHTML = '<span>Filling...</span>';
        button.disabled = true;

        // Get profile from storage
        const result = await chrome.storage.local.get('jobAutofillProfile');
        const profile = result.jobAutofillProfile;

        if (!profile) {
            showNotification('No profile data found. Please set up your profile in the dashboard.', 'error');
            button.innerHTML = originalHTML;
            button.disabled = false;
            return;
        }

        // Detect fields
        const fields = FieldDetector.detectFields();

        if (fields.length === 0) {
            showNotification('No fillable fields detected on this page.', 'warning');
            button.innerHTML = originalHTML;
            button.disabled = false;
            return;
        }

        // Fill fields
        const results = await Autofiller.fillFields(profile, fields);

        // Show results
        if (results.filled > 0) {
            showNotification(
                `Successfully filled ${results.filled} field${results.filled > 1 ? 's' : ''}!`,
                'success'
            );

            // Notify background script
            chrome.runtime.sendMessage({
                action: 'autofillComplete',
                message: `Filled ${results.filled} fields`
            });
        } else {
            showNotification('No fields could be filled. Please check your profile data.', 'warning');
        }

        // Reset button
        button.innerHTML = originalHTML;
        button.disabled = false;

    } catch (error) {
        console.error('Autofill error:', error);
        showNotification('An error occurred during autofill. Please try again.', 'error');

        const button = document.getElementById('autofill-trigger');
        button.disabled = false;
    }
}


/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Safety check for invalidated context
    if (!chrome.runtime?.id) return;

    if (request.action === 'autofill') {
        handleAutofill();
        sendResponse({ success: true });
    }

    if (request.action === 'autoApply') {
        (async () => {
            const result = await chrome.storage.local.get('jobAutofillProfile');
            const profile = result.jobAutofillProfile;
            if (profile) {
                showNotification('Starting automatic application...', 'info');
                await Autofiller.handleMultiStep(profile);
                sendResponse({ success: true });
            } else {
                showNotification('No profile found. Please sync from dashboard.', 'error');
                sendResponse({ success: false, error: 'Profile not found' });
            }
        })();
        return true; // Keep channel open for async
    }

    if (request.action === 'autoApplyStatusUpdate') {
        window.postMessage({ action: 'autoApplyStatusUpdate', status: request.status }, '*');
        sendResponse({ success: true });
    }
    return true;
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Re-check for forms when page content changes (for SPAs)
const observer = new MutationObserver((mutations) => {
    if (!isFormDetected && hasJobApplicationForm()) {
        isFormDetected = true;
        injectAutofillButton();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
