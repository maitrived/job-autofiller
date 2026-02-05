/**
 * Status Scraper - Automatically checks application status on job portals
 */

const StatusScraper = {
    isChecking: false,

    /**
     * Start status check for all applied jobs
     */
    async checkAllStatuses() {
        if (this.isChecking) return;
        this.isChecking = true;

        try {
            const result = await chrome.storage.local.get('discoveredJobs');
            const jobs = result.discoveredJobs || [];
            const appliedJobs = jobs.filter(j => j.status === 'applied' || j.status === 'in_progress');

            if (appliedJobs.length === 0) {
                console.log('No applied jobs to check.');
                this.isChecking = false;
                return;
            }

            console.log(`Checking status for ${appliedJobs.length} jobs...`);

            // 1. Visit Indeed My Jobs
            await this.checkIndeedStatus();

            // 2. Visit LinkedIn Applied Jobs
            await this.checkLinkedInStatus();

        } catch (error) {
            console.error('Error in status check:', error);
        } finally {
            this.isChecking = false;
        }
    },

    /**
     * Check status on Indeed
     */
    async checkIndeedStatus() {
        if (!window.location.href.includes('indeed.com/myjobs/applied')) {
            console.log('Navigating to Indeed My Jobs...');
            window.open('https://www.indeed.com/myjobs/applied', '_blank');
            return;
        }

        console.log('Scraping Indeed applied jobs...');
        const updates = [];
        const jobCards = document.querySelectorAll('.jobCard');
        jobCards.forEach(card => {
            const title = card.querySelector('.jobTitle')?.textContent.trim();
            const company = card.querySelector('.companyName')?.textContent.trim();
            const status = card.querySelector('.statusTag')?.textContent.trim();

            if (title && company && status) {
                updates.push({ title, company, status: status.toLowerCase(), rawStatus: status });
            }
        });

        if (updates.length > 0) {
            chrome.runtime.sendMessage({
                action: 'statusUpdatesDiscovered',
                updates,
                platform: 'indeed'
            });
        }
    },

    /**
     * Check status on LinkedIn
     */
    async checkLinkedInStatus() {
        if (!window.location.href.includes('linkedin.com/my-items/posted-jobs')) {
            console.log('Navigating to LinkedIn Applied Jobs...');
            window.open('https://www.linkedin.com/my-items/posted-jobs/', '_blank');
            return;
        }

        console.log('Scraping LinkedIn applied jobs...');
        const updates = [];
        const entries = document.querySelectorAll('.entity-result');
        entries.forEach(entry => {
            const title = entry.querySelector('.entity-result__title')?.textContent.trim();
            const company = entry.querySelector('.entity-result__primary-subtitle')?.textContent.trim();
            const status = entry.querySelector('.entity-result__badge')?.textContent.trim();

            if (title && company && status) {
                updates.push({ title, company, status: status.toLowerCase(), rawStatus: status });
            }
        });

        if (updates.length > 0) {
            chrome.runtime.sendMessage({
                action: 'statusUpdatesDiscovered',
                updates,
                platform: 'linkedin'
            });
        }
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatusScraper;
}
