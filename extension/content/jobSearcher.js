/**
 * Job Search Orchestrator - Manages search across multiple platforms
 */

const JobSearcher = {
    isSearching: false,
    results: [],

    /**
     * Start a new job search based on user preferences
     * @param {Object} preferences - Search preferences from dashboard
     */
    async startSearch(preferences) {
        if (this.isSearching) return;
        this.isSearching = true;
        this.results = [];

        const { keywords, locations, platforms, remote, requiresSponsorship, maxExperience } = preferences;

        for (const platform of platforms) {
            try {
                console.log(`Starting search on ${platform}...`);
                let platformResults = [];

                // Enhance keywords with sponsorship focus if requested
                let searchKeywords = [...keywords];
                if (requiresSponsorship) {
                    searchKeywords = searchKeywords.map(kw => `${kw} sponsorship`);
                }

                if (platform === 'indeed') {
                    platformResults = await this.searchIndeed(searchKeywords, locations, remote, maxExperience);
                } else if (platform === 'linkedin') {
                    platformResults = await this.searchLinkedIn(searchKeywords, locations, remote, maxExperience);
                }

                this.results = [...this.results, ...platformResults];

                // Save intermediate results
                await this.saveJobs(this.results);

            } catch (error) {
                console.error(`Error searching on ${platform}:`, error);
            }
        }

        this.isSearching = false;
        return this.results;
    },

    /**
     * Search jobs on Indeed
     */
    async searchIndeed(keywords, locations, remote, maxExperience) {
        const keywordQuery = keywords.join(' ');
        const locationQuery = locations.join(' ');

        let url = `https://www.indeed.com/jobs?q=${encodeURIComponent(keywordQuery)}&l=${encodeURIComponent(locationQuery)}`;

        if (remote === 'remote') url += '&sc=0kf%3Aattr%28DS7MS%29%3B';
        if (maxExperience <= 2) url += '&explvl=entry_level';

        window.open(url, '_blank');
        return [];
    },

    /**
     * Search jobs on LinkedIn
     */
    async searchLinkedIn(keywords, locations, remote, maxExperience) {
        const keywordQuery = keywords.join(' ');
        const locationQuery = locations.join(' ');

        let url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywordQuery)}&location=${encodeURIComponent(locationQuery)}`;

        if (remote === 'remote') url += '&f_WT=2';

        // LinkedIn Experience Levels: 1=Internship, 2=Entry level, 3=Associate...
        if (maxExperience <= 1) {
            url += '&f_E=1%2C2'; // Internship and Entry Level
        } else if (maxExperience <= 3) {
            url += '&f_E=2%2C3'; // Entry and Associate
        }

        window.open(url, '_blank');
        return [];
    },

    /**
     * Save discovered jobs to Chrome storage
     */
    async saveJobs(jobs) {
        const result = await chrome.storage.local.get('discoveredJobs');
        const existingJobs = result.discoveredJobs || [];

        // Merge new jobs with existing ones, avoiding duplicates
        const combinedJobs = [...existingJobs];
        jobs.forEach(newJob => {
            if (!combinedJobs.find(j => j.url === newJob.url)) {
                combinedJobs.push({
                    ...newJob,
                    discoveredDate: new Date().toISOString(),
                    status: 'new'
                });
            }
        });

        await chrome.storage.local.set({ discoveredJobs: combinedJobs });
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JobSearcher;
}
