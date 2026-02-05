/**
 * Safety Manager - Ensures the automation acts like a human to avoid detection and bans
 */

const SafetyManager = {
    /**
     * Wait for a random duration (human-like delay)
     * @param {number} min - Minimum wait time in ms
     * @param {number} max - Maximum wait time in ms
     */
    async humanWait(min = 1000, max = 3000) {
        const delay = Math.floor(Math.random() * (max - min + 1) + min);
        return new Promise(resolve => setTimeout(resolve, delay));
    },

    /**
     * Slowly scroll to an element like a human reader
     */
    async scrollToElement(element) {
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const targetY = rect.top + window.pageYOffset - (window.innerHeight / 2);

        window.scrollTo({
            top: targetY,
            behavior: 'smooth'
        });

        await this.humanWait(500, 1500);
    },

    /**
     * Type text with random delays between characters
     */
    async humanType(element, text) {
        if (!element) return;

        element.focus();
        element.value = '';

        for (const char of text) {
            element.value += char;
            // Trigger input event for each char (some forms validation)
            element.dispatchEvent(new Event('input', { bubbles: true }));

            const charDelay = Math.random() * 100 + 50; // 50-150ms per char
            await new Promise(resolve => setTimeout(resolve, charDelay));
        }

        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.blur();
    },

    /**
     * Check if we are exceeding safe application limits
     */
    async canApplyToday() {
        const result = await chrome.storage.local.get('dailyApplicationCount');
        const today = new Date().toDateString();

        const stats = result.dailyApplicationCount || { date: today, count: 0 };

        if (stats.date !== today) {
            return true; // Reset for new day
        }

        const LIMIT = 50; // Safe daily limit
        return stats.count < LIMIT;
    },

    /**
     * Record a successful application
     */
    async recordApplication() {
        const today = new Date().toDateString();
        const result = await chrome.storage.local.get('dailyApplicationCount');
        const stats = result.dailyApplicationCount || { date: today, count: 0 };

        if (stats.date === today) {
            stats.count++;
        } else {
            stats.count = 1;
            stats.date = today;
        }

        await chrome.storage.local.set({ dailyApplicationCount: stats });
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SafetyManager;
}
