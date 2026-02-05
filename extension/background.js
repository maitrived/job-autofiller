/**
 * Background service worker for the Job Autofiller extension
 * Handles extension lifecycle, keyboard shortcuts, and message passing
 */

importScripts('utils/constants.js');
importScripts('content/safetyManager.js');
importScripts('content/aiAnalyzer.js');

// --- Global State ---
let activeAutoApply = {};

// Restore state from storage on startup
chrome.storage.local.get('activeAutoApply', (result) => {
    try {
        if (result.activeAutoApply && result.activeAutoApply.config) {
            console.log('Restored active auto-apply state:', result.activeAutoApply);
            activeAutoApply[result.activeAutoApply.config.id] = result.activeAutoApply;
        }
    } catch (e) {
        console.error('Failed to restore auto-apply state:', e);
    }
});

// Installation handler
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Job Autofiller extension installed!');

        // Set default settings
        chrome.storage.local.set({
            jobAutofillSettings: {
                autoDetect: true,
                showNotifications: true,
                keyboardShortcut: true,
                confirmBeforeFill: false
            }
        });

        // Open welcome page or dashboard
        chrome.tabs.create({
            url: 'http://localhost:3000'
        });
    } else if (details.reason === 'update') {
        console.log('Job Autofiller extension updated!');
    }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
    if (command === 'autofill') {
        // Get the active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                // Send message to content script to trigger autofill
                chrome.tabs.sendMessage(tabs[0].id, { action: 'autofill' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Error sending autofill message:', chrome.runtime.lastError);
                    }
                });
            }
        });
    }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getProfile') {
        // Get profile from storage
        chrome.storage.local.get('jobAutofillProfile', (result) => {
            sendResponse({ profile: result.jobAutofillProfile || null });
        });
        return true; // Keep the message channel open for async response
    }

    if (request.action === 'syncFromDashboard') {
        // Sync profile from dashboard
        syncFromDashboard()
            .then((profile) => {
                sendResponse({ success: true, profile });
            })
            .catch((error) => {
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep the message channel open for async response
    }

    if (request.action === 'autofillComplete') {
        // Show notification when autofill is complete
        chrome.storage.local.get('jobAutofillSettings', (result) => {
            const settings = result.jobAutofillSettings || { showNotifications: true };

            if (settings.showNotifications) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'Autofill Complete',
                    message: request.message || 'Form fields have been filled successfully!'
                });
            }
        });
    }

    if (request.action === 'openDashboard') {
        // Open dashboard in new tab
        chrome.tabs.create({
            url: 'http://localhost:3000'
        });
    }

    if (request.action === 'jobsDiscovered') {
        // Save discovered jobs to storage
        chrome.storage.local.get('discoveredJobs', (result) => {
            const existingJobs = result.discoveredJobs || [];
            const newJobs = request.jobs.filter(newJob =>
                !existingJobs.find(existJob => existJob.url === newJob.url)
            );

            if (newJobs.length > 0) {
                (async () => {
                    const profileRes = await chrome.storage.local.get('jobAutofillProfile');
                    const profile = profileRes.jobAutofillProfile;

                    const prefRes = await chrome.storage.local.get('jobSearchPreferences');
                    const prefs = prefRes.jobSearchPreferences ? JSON.parse(prefRes.jobSearchPreferences) : {};

                    const processedJobs = await Promise.all(newJobs.map(async (job) => {
                        const matchResult = await AIAnalyzer.calculateMatchScore(
                            profile || {},
                            `${job.title} ${job.company} ${job.location}`,
                            prefs
                        );
                        return {
                            ...job,
                            id: Math.random().toString(36).substr(2, 9),
                            discoveredDate: new Date().toISOString(),
                            status: 'new',
                            matchScore: matchResult.score,
                            reasoning: matchResult.reasoning,
                            matchingSkills: matchResult.matchingSkills,
                            missingSkills: matchResult.missingSkills
                        };
                    }));

                    const updatedJobs = [...existingJobs, ...processedJobs];
                    await chrome.storage.local.set({ discoveredJobs: updatedJobs });

                    console.log(`Saved ${newJobs.length} new jobs with AI matching to storage.`);

                    // Show notification
                    chrome.storage.local.get('jobAutofillSettings', (setResult) => {
                        const settings = setResult.jobAutofillSettings || { showNotifications: true };
                        if (settings.showNotifications) {
                            chrome.notifications.create({
                                type: 'basic',
                                iconUrl: 'icons/icon48.png',
                                title: 'New Jobs Found!',
                                message: `Found ${newJobs.length} new matching jobs. Best match: ${Math.max(...processedJobs.map(j => j.matchScore))}%`
                            });
                        }
                    });
                })();
            }
        });
    }

    if (request.action === 'applicationSubmitted') {
        const { url, qaLog } = request;

        // 1. Update job status in storage
        chrome.storage.local.get(['discoveredJobs', 'activeJobContext'], async (result) => {
            const jobs = result.discoveredJobs || [];
            const activeJD = result.activeJobContext || {};

            // Match URL
            const jobIndex = jobs.findIndex(j => {
                const jobUrl = j.url ? j.url.split('?')[0] : '';
                const requestUrl = url ? url.split('?')[0] : '';
                return jobUrl && requestUrl && (jobUrl.includes(requestUrl) || requestUrl.includes(jobUrl));
            });

            if (jobIndex !== -1) {
                const job = jobs[jobIndex];
                job.status = 'applied';
                job.appliedDate = new Date().toISOString();

                await chrome.storage.local.set({ discoveredJobs: jobs });
                console.log(`Updated status to 'applied' for job: ${job.title}`);

                // 2. Log to Excel via Dashboard API
                try {
                    await fetch('http://localhost:3000/api/log-application', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            company: job.company,
                            position: job.title,
                            status: 'applied',
                            appLink: url,
                            jdLink: activeJD.url || job.url,
                            qaLog: qaLog,
                            appliedDate: job.appliedDate
                        })
                    });
                    console.log('Successfully logged application to Excel.');
                } catch (e) {
                    console.error('Failed to log to Excel API:', e);
                }
            }
        });
    }

    if (request.action === 'needManualIntervention') {
        // Forward to Dashboard Notification API
        fetch('http://localhost:3000/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: request.type,
                siteName: request.siteName
            })
        }).catch(e => console.error('Failed to send notification:', e));
    }

    if (request.action === 'statusUpdatesDiscovered') {
        const { updates, platform } = request;

        chrome.storage.local.get('discoveredJobs', async (result) => {
            const jobs = result.discoveredJobs || [];
            let updatedCount = 0;

            for (const update of updates) {
                // Find matching job by title and company
                const jobIndex = jobs.findIndex(j =>
                    j.title.toLowerCase().includes(update.title.toLowerCase()) &&
                    j.company.toLowerCase().includes(update.company.toLowerCase())
                );

                if (jobIndex !== -1) {
                    if (jobs[jobIndex].status !== update.status) {
                        const oldStatus = jobs[jobIndex].status;
                        jobs[jobIndex].status = update.status;
                        jobs[jobIndex].rawStatus = update.rawStatus;
                        jobs[jobIndex].lastStatusCheck = new Date().toISOString();
                        updatedCount++;

                        // Sync to Excel API
                        try {
                            await fetch('http://localhost:3000/api/update-status', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    company: update.company,
                                    position: update.title,
                                    newStatus: update.status
                                })
                            });
                        } catch (e) {
                            console.error('Failed to update Excel status:', e);
                        }
                    }
                }
            }

            if (updatedCount > 0) {
                chrome.storage.local.set({ discoveredJobs: jobs }, () => {
                    console.log(`Updated ${updatedCount} job statuses from ${platform}.`);

                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icons/icon48.png',
                        title: 'Application Updates',
                        message: `Found status updates for ${updatedCount} applications on ${platform}.`
                    });
                });
            }
        });
    }

    // Auto-Apply Handlers
    if (request.action === 'startAutoApply') {
        try {
            const { searchProfile, jobBoards, profile } = request;
            let targetUrl = '';
            console.log('Starting auto-apply for:', searchProfile.name);

            // 1. Sync profile to extension storage immediately
            if (profile) {
                chrome.storage.local.set({ jobAutofillProfile: profile });
            }

            // 2. Find priority job board
            const enabledBoards = (jobBoards || []).filter(b => b.enabled);
            const priorityBoard = enabledBoards[0];

            if (!priorityBoard) {
                sendResponse({ success: false, error: 'No enabled job boards found in settings.' });
                return;
            }

            // 3. Construct Search URL
            const config = searchProfile.config || {};
            const keywordArr = Array.isArray(config.keywords) ? config.keywords : [];
            const locationArr = Array.isArray(config.locations) ? config.locations : [];

            const keywords = encodeURIComponent(keywordArr.join(' '));
            const locations = encodeURIComponent(locationArr.join(' '));

            if (priorityBoard.name === 'LinkedIn') {
                targetUrl = `https://www.linkedin.com/jobs/search/?keywords=${keywords}&location=${locations}`;
                if (config.remote === 'remote') targetUrl += '&f_WT=2';

                // Add date filters
                if (config.datePosted === 'past_24h') targetUrl += '&f_TPR=r86400';
                else if (config.datePosted === 'past_week') targetUrl += '&f_TPR=r604800';
                else if (config.datePosted === 'past_month') targetUrl += '&f_TPR=r2592000';

            } else if (priorityBoard.name === 'Indeed') {
                targetUrl = `https://www.indeed.com/jobs?q=${keywords}&l=${locations}`;
                if (config.remote === 'remote') targetUrl += '&sc=0kf%3Aattr(DS7W8)expl(YL4H9)jt(1)sr(0)%3B&vjk=';

                // Add date filters
                if (config.datePosted === 'past_24h') targetUrl += '&fromage=1';
                else if (config.datePosted === 'past_week') targetUrl += '&fromage=7';
                else if (config.datePosted === 'past_month') targetUrl += '&fromage=30';
            } else {
                // Fallback / Default
                targetUrl = 'https://www.linkedin.com/jobs/';
            }

            // 4. Store active process
            const process = {
                status: 'running',
                config: searchProfile,
                jobBoards: enabledBoards,
                currentBoardIndex: 0,
                progress: {
                    applicationsSubmitted: 0,
                    applicationsTarget: searchProfile.config.dailyLimit,
                    currentJobUrl: targetUrl
                },
                startedAt: new Date().toISOString()
            };

            activeAutoApply[searchProfile.id] = process;
            chrome.storage.local.set({ activeAutoApply: process });

            // 5. Open tab in FOREGROUND
            chrome.tabs.create({ url: targetUrl, active: true }, (tab) => {
                activeAutoApply[searchProfile.id].tabId = tab.id;

                // Send initial status back
                broadcastStatusUpdate({
                    searchProfileId: searchProfile.id,
                    ...process
                });
            });

            sendResponse({ success: true, status: 'started' });
        } catch (e) {
            console.error('CRITICAL: Start Auto-Apply failed:', e);
            sendResponse({ success: false, error: e.message });
        }
        return true;
    }

    if (request.action === 'stopAutoApply') {
        const { searchProfileId } = request;
        if (activeAutoApply[searchProfileId]) {
            delete activeAutoApply[searchProfileId];
            chrome.storage.local.remove('activeAutoApply');
            console.log('Stopped auto-apply for:', searchProfileId);
        }
        return true;
    }

    if (request.action === 'broadcastStatusUpdate') {
        const { status } = request;
        broadcastStatusUpdate({
            searchProfileId: status.config.id,
            ...status
        });
        return true;
    }
});

// --- Periodic Background Checks ---
chrome.alarms.create('checkStatus', { periodInMinutes: 240 }); // Every 4 hours

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkStatus') {
        console.log('Triggering periodic status check...');
        // We need a tab to run content script logic. 
        // We'll open one of the portals in a background tab
        chrome.tabs.create({ url: 'https://www.indeed.com/myjobs/applied', active: false }, (tab) => {
            // Let it run for 30 seconds then close
            setTimeout(() => chrome.tabs.remove(tab.id), 30000);
        });
    }
});

// State for active auto-apply processes
// (Moved to top)

function broadcastStatusUpdate(statusUpdate) {
    chrome.tabs.query({ url: 'http://localhost:3000/*' }, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'autoApplyStatusUpdate',
                status: statusUpdate
            }, (response) => {
                // Ignore "Receiving end does not exist" errors
                if (chrome.runtime.lastError) {
                    // console.warn('Status update failed:', chrome.runtime.lastError.message);
                }
            });
        });
    });
}

/**
 * Sync profile from dashboard's localStorage
 * @returns {Promise<Object>}
 */
async function syncFromDashboard() {
    try {
        // Find the dashboard tab
        const tabs = await chrome.tabs.query({ url: 'http://localhost:3000/*' });

        if (tabs.length === 0) {
            throw new Error('Dashboard not found. Please open the dashboard at http://localhost:3000');
        }

        // Execute script in dashboard tab to get localStorage data
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
                const profileData = localStorage.getItem('jobAutofillProfile');
                return profileData ? JSON.parse(profileData) : null;
            }
        });

        const profile = results[0]?.result;

        if (profile) {
            // Save to extension storage
            await chrome.storage.local.set({
                jobAutofillProfile: profile,
                jobAutofillLastSync: new Date().toISOString()
            });
            return profile;
        } else {
            throw new Error('No profile data found in dashboard');
        }
    } catch (error) {
        console.error('Error syncing from dashboard:', error);
        throw error;
    }
}

// Listen for tab updates to detect job application sites
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Check if it's a known job application site
        const jobSites = [
            'linkedin.com/jobs',
            'indeed.com',
            'workday.com',
            'greenhouse.io',
            'lever.co',
            'myworkdayjobs.com'
        ];

        const isJobSite = jobSites.some(site => tab.url.includes(site));

        if (isJobSite) {
            // Update extension icon to show it's active
            chrome.action.setBadgeText({ text: '✓', tabId });
            chrome.action.setBadgeBackgroundColor({ color: '#6366f1', tabId });
        }
    }
});
