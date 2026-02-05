/**
 * Indeed Status Scraper - Extracts application status from Indeed's "My Jobs" page
 */

const IndeedStatusScraper = {
    scrapeStatus() {
        const appCards = document.querySelectorAll('.myjobs-appcard, [data-testid="app-card"]');
        const statusUpdates = [];

        appCards.forEach(card => {
            try {
                const titleElement = card.querySelector('.myjobs-appcard-title, [data-testid="app-card-title"]');
                const companyElement = card.querySelector('.myjobs-appcard-company, [data-testid="app-card-company"]');
                const statusElement = card.querySelector('.myjobs-appcard-status, [data-testid="app-card-status"]');

                if (titleElement && companyElement && statusElement) {
                    const statusText = statusElement.textContent.trim().toLowerCase();
                    let normalizedStatus = 'applied';

                    if (statusText.includes('rejected') || statusText.includes('not selected') || statusText.includes('no longer')) {
                        normalizedStatus = 'rejected';
                    } else if (statusText.includes('interview') || statusText.includes('invited')) {
                        normalizedStatus = 'interviewing';
                    } else if (statusText.includes('offer')) {
                        normalizedStatus = 'offer';
                    }

                    statusUpdates.push({
                        title: titleElement.textContent.trim(),
                        company: companyElement.textContent.trim(),
                        status: normalizedStatus,
                        rawStatus: statusElement.textContent.trim()
                    });
                }
            } catch (error) {
                console.error('Error scraping Indeed status card:', error);
            }
        });

        return statusUpdates;
    }
};

// Auto-run if on Indeed My Jobs page
if (window.location.hostname.includes('indeed.com') && window.location.pathname.includes('/myjobs')) {
    console.log('Indeed My Jobs page detected. Starting status scraper...');

    setTimeout(() => {
        const updates = IndeedStatusScraper.scrapeStatus();
        if (updates.length > 0) {
            console.log(`Found ${updates.length} application statuses on Indeed.`);
            chrome.runtime.sendMessage({ action: 'statusUpdatesDiscovered', updates, platform: 'Indeed' });

            // Close tab after successful scrape if it was auto-opened
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('auto_close') === 'true') {
                window.close();
            }
        }
    }, 3000);
}
