/**
 * LinkedIn Scraper - Extracts job data from LinkedIn search results
 */

const LinkedInScraper = {
    /**
     * Scrape job listings from the current LinkedIn search result page
     */
    scrapeSearchPage() {
        const jobCards = document.querySelectorAll('.jobs-search-results__list-item, .job-card-container');
        const jobs = [];

        jobCards.forEach(card => {
            try {
                const titleElement = card.querySelector('.job-card-list__title, .job-card-container__link');
                const companyElement = card.querySelector('.job-card-container__primary-description, .job-card-container__company-name');
                const locationElement = card.querySelector('.job-card-container__metadata-item');
                const linkElement = card.querySelector('a.job-card-list__title, a.job-card-container__link');

                if (titleElement && companyElement && linkElement) {
                    jobs.push({
                        title: titleElement.textContent.trim(),
                        company: companyElement.textContent.trim(),
                        location: locationElement ? locationElement.textContent.trim() : 'Remote',
                        salary: 'See description',
                        url: linkElement.href.split('?')[0], // Clean URL
                        platform: 'LinkedIn',
                        easyApply: card.textContent.toLowerCase().includes('easy apply')
                    });
                }
            } catch (error) {
                console.error('Error scraping LinkedIn job card:', error);
            }
        });

        return jobs;
    }
};

// Auto-run if on LinkedIn search page
if (window.location.hostname.includes('linkedin.com') && window.location.pathname.includes('/jobs/search')) {
    console.log('LinkedIn job search detected. Starting scraper...');

    // Wait for jobs to load
    setTimeout(() => {
        const jobs = LinkedInScraper.scrapeSearchPage();
        if (jobs.length > 0) {
            console.log(`Scraped ${jobs.length} jobs from LinkedIn.`);
            chrome.runtime.sendMessage({ action: 'jobsDiscovered', jobs });
        }
    }, 3000);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LinkedInScraper;
}
