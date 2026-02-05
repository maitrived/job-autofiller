/**
 * Popup script - Handles popup UI interactions
 */

// DOM elements
const profileStatus = document.getElementById('profileStatus');
const statusIndicator = document.getElementById('statusIndicator');
const statusValue = document.getElementById('statusValue');
const profileSummary = document.getElementById('profileSummary');
const noProfile = document.getElementById('noProfile');
const autofillBtn = document.getElementById('autofillBtn');
const syncBtn = document.getElementById('syncBtn');
const dashboardBtn = document.getElementById('dashboardBtn');

// Profile data elements
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileExperience = document.getElementById('profileExperience');
const profileEducation = document.getElementById('profileEducation');
const lastSync = document.getElementById('lastSync');

// Load profile on popup open
document.addEventListener('DOMContentLoaded', async () => {
    await loadProfile();
    setupEventListeners();
});

/**
 * Load and display profile data
 */
async function loadProfile() {
    try {
        const result = await chrome.storage.local.get(['jobAutofillProfile', 'jobAutofillLastSync']);
        const profile = result.jobAutofillProfile;
        const lastSyncTime = result.jobAutofillLastSync;

        if (profile && profile.personalInfo) {
            displayProfile(profile, lastSyncTime);
        } else {
            displayNoProfile();
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        displayNoProfile();
    }
}

/**
 * Display profile data in UI
 */
function displayProfile(profile, lastSyncTime) {
    const { personalInfo, experience, education } = profile;

    // Update status
    statusIndicator.classList.add('active');
    statusValue.textContent = 'Profile Loaded';
    statusValue.style.color = '#14b8a6';

    // Show profile summary
    profileSummary.style.display = 'block';
    noProfile.style.display = 'none';

    // Fill in profile data
    profileName.textContent = `${personalInfo.firstName} ${personalInfo.lastName}`.trim() || '-';
    profileEmail.textContent = personalInfo.email || '-';
    profileExperience.textContent = experience.length > 0
        ? `${experience.length} position${experience.length > 1 ? 's' : ''}`
        : 'None';
    profileEducation.textContent = education.length > 0
        ? `${education.length} degree${education.length > 1 ? 's' : ''}`
        : 'None';

    // Update last sync time
    if (lastSyncTime) {
        const syncDate = new Date(lastSyncTime);
        const now = new Date();
        const diffMinutes = Math.floor((now - syncDate) / 1000 / 60);

        if (diffMinutes < 1) {
            lastSync.textContent = 'Last synced: Just now';
        } else if (diffMinutes < 60) {
            lastSync.textContent = `Last synced: ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
        } else {
            lastSync.textContent = `Last synced: ${syncDate.toLocaleString()}`;
        }
    }

    // Enable autofill button
    autofillBtn.disabled = false;
}

/**
 * Display no profile message
 */
function displayNoProfile() {
    statusIndicator.classList.remove('active');
    statusValue.textContent = 'No Profile';
    statusValue.style.color = '#94a3b8';

    profileSummary.style.display = 'none';
    noProfile.style.display = 'block';

    // Disable autofill button
    autofillBtn.disabled = true;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Autofill button
    autofillBtn.addEventListener('click', async () => {
        try {
            autofillBtn.disabled = true;
            autofillBtn.innerHTML = '<span>Filling...</span>';

            // Get active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Send autofill message to content script
            await chrome.tabs.sendMessage(tab.id, { action: 'autofill' });

            // Reset button after a delay
            setTimeout(() => {
                autofillBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
          </svg>
          Autofill Current Page
        `;
                autofillBtn.disabled = false;
            }, 1000);

        } catch (error) {
            console.error('Error triggering autofill:', error);
            showError('Could not autofill. Make sure you are on a job application page.');
            autofillBtn.disabled = false;
        }
    });

    // Sync button
    syncBtn.addEventListener('click', async () => {
        try {
            syncBtn.disabled = true;
            syncBtn.innerHTML = '<span>Syncing...</span>';

            // Send sync message to background script
            const response = await chrome.runtime.sendMessage({ action: 'syncFromDashboard' });

            if (response.success) {
                await loadProfile();
                showSuccess('Profile synced successfully!');
            } else {
                throw new Error(response.error || 'Sync failed');
            }

        } catch (error) {
            console.error('Error syncing:', error);
            showError(error.message || 'Could not sync. Make sure the dashboard is open at http://localhost:3000');
        } finally {
            syncBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"></path>
        </svg>
        Sync from Dashboard
      `;
            syncBtn.disabled = false;
        }
    });

    // Dashboard button
    dashboardBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'openDashboard' });
        window.close();
    });
}

/**
 * Show success message
 */
function showSuccess(message) {
    statusValue.textContent = message;
    statusValue.style.color = '#14b8a6';
    setTimeout(() => {
        statusValue.textContent = 'Profile Loaded';
    }, 3000);
}

/**
 * Show error message
 */
function showError(message) {
    statusValue.textContent = message;
    statusValue.style.color = '#ef4444';
    setTimeout(() => {
        loadProfile();
    }, 3000);
}

// Listen for messages from content/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'autofillComplete') {
        loadProfile();
    }
});
