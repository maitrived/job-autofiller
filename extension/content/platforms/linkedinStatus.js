/**
 * LinkedIn Status Scraper - Extracts application status from LinkedIn's applied jobs page
 */

const LinkedInStatusScraper = {
    scrapeStatus() {
        // LinkedIn's "Applied Jobs" page typically uses these selectors
        const jobCards = document.querySelectorAll('.jobs-search-results-list__item, .jobs-items-container-item');
        const statusUpdates = [];

        jobCards.forEach(card => {
            try {
                const titleElement = card.querySelector('.job-card-list__title, .artdeco-entity-lockup__title');
                const companyElement = card.querySelector('.job-card-container__company-name, .artdeco-entity-lockup__subtitle');
                const statusElement = card.querySelector('.job-card-container__footer-item, .jobs-applied-info');

                if (titleElement && companyElement) {
                    const statusText = statusElement ? statusElement.textContent.trim().toLowerCase() : 'applied';
                    let normalizedStatus = 'applied';

                    if (statusText.includes('viewed')) {
                        normalizedStatus = 'viewed';
                    } else if (statusText.includes('rejected') || statusText.includes('no longer')) {
                        normalizedStatus = 'rejected';
                    } else if (statusText.includes('interview')) {
                        normalizedStatus = 'interviewing';
                    }

                    statusUpdates.push({
                        title: titleElement.textContent.trim(),
                        company: companyElement.textContent.trim().replace(/\n/g, '').trim(),
                        status: normalizedStatus,
                        rawStatus: statusText
                    });
                }
            } catch (error) {
                console.error('Error scraping LinkedIn status card:', error);
            }
        });

        return statusUpdates;
    }
};

// Auto-run if on LinkedIn Applied Jobs page
if (window.location.hostname.includes('linkedin.com') && window.location.pathname.includes('/my-items/posted-jobs')) {
    console.log('LinkedIn Applied Jobs page detected. Starting status scraper...');

    setTimeout(() => {
        const updates = LinkedInStatusScraper.scrapeStatus();
        if (updates.length > 0) {
            console.log(`Found ${updates.length} application statuses on LinkedIn.`);
            chrome.runtime.sendMessage({ action: 'statusUpdatesDiscovered', updates, platform: 'LinkedIn' });

            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('auto_close') === 'true') {
                window.close();
            }
        }
    }, 3000);
}
