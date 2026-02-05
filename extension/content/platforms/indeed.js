/**
 * Indeed Scraper - Extracts job data from Indeed search results
 */

const IndeedScraper = {
    /**
     * Scrape job listings from the current Indeed search result page
     */
    scrapeSearchPage() {
        const jobCards = document.querySelectorAll('.job_seen_beacon');
        const jobs = [];

        jobCards.forEach(card => {
            try {
                const titleElement = card.querySelector('h2.jobTitle span[title]');
                const companyElement = card.querySelector('[data-testid="company-name"]');
                const locationElement = card.querySelector('[data-testid="text-location"]');
                const salaryElement = card.querySelector('.salary-snippet-container') || card.querySelector('.estimated-salary-container');
                const linkElement = card.querySelector('h2.jobTitle a');

                if (titleElement && companyElement && linkElement) {
                    jobs.push({
                        title: titleElement.textContent.trim(),
                        company: companyElement.textContent.trim(),
                        location: locationElement ? locationElement.textContent.trim() : 'Remote',
                        salary: salaryElement ? salaryElement.textContent.trim() : 'Not specified',
                        url: linkElement.href,
                        platform: 'Indeed',
                        easyApply: card.textContent.toLowerCase().includes('easily apply') || card.textContent.toLowerCase().includes('easy apply')
                    });
                }
            } catch (error) {
                console.error('Error scraping Indeed job card:', error);
            }
        });

        return jobs;
    }
};

// Auto-run if on Indeed search page
if (window.location.hostname.includes('indeed.com') && window.location.pathname.includes('/jobs')) {
    console.log('Indeed job search detected. Starting scraper...');

    // Wait for jobs to load
    setTimeout(() => {
        const jobs = IndeedScraper.scrapeSearchPage();
        if (jobs.length > 0) {
            console.log(`Scraped ${jobs.length} jobs from Indeed.`);
            chrome.runtime.sendMessage({ action: 'jobsDiscovered', jobs });
        }
    }, 2000);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = IndeedScraper;
}
