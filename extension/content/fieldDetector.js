/**
 * Field Detector - Intelligently detects and categorizes form fields
 */

const FieldDetector = {
    detectFields(root = document) {
        const fields = [];

        // Safety: If we're on LinkedIn and searching globally, avoid the top-nav search bar
        const isLinkedIn = window.location.hostname.includes('linkedin.com');
        const searchSelectors = [
            '.search-global-typeahead',
            '.global-nav__search',
            '#global-nav-search',
            '.jobs-search-box', // Added
            '[role="search"]', // Added generic
            '.search-global-typeahead__input', // Added
            '#jobs-search-box-keyword-id', // Added
            '#jobs-search-box-location-id' // Added
        ].join(', ');

        // Get all input, textarea, and select elements within the root
        const inputs = root.querySelectorAll('input, textarea, select');

        inputs.forEach((element) => {
            const isVisible = this.isVisible(element);

            // Skip hidden, disabled, and readonly fields
            if (element.type === 'hidden' ||
                element.disabled ||
                element.readOnly) {
                return;
            }

            // For external sites, sometimes we need to be more aggressive with visibility
            if (!isVisible && !['radio', 'checkbox', 'file'].includes(element.type)) {
                return;
            }

            // Explicitly skip LinkedIn top-bar search if root is document
            if (isLinkedIn && root === document && element.closest(searchSelectors)) {
                return;
            }

            const fieldInfo = this.analyzeField(element);

            // CHANGED: Include 'unknown' fields so Autofiller can try AI/QA Bank on them
            fields.push({
                element,
                ...fieldInfo
            });
        });

        return fields;
    },

    /**
     * Analyze a field to determine its type and purpose
     * @param {HTMLElement} element
     * @returns {Object} Field metadata
     */
    analyzeField(element) {
        const name = (element.name || '').toLowerCase();
        const id = (element.id || '').toLowerCase();
        const placeholder = (element.placeholder || '').toLowerCase();
        const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase();
        const type = element.type || element.tagName.toLowerCase();

        // Get associated label text
        const labelText = this.getLabelText(element).toLowerCase();

        // Combine all text for matching
        const combinedText = `${name} ${id} ${placeholder} ${ariaLabel} ${labelText}`;

        // Determine field type based on patterns
        const fieldType = this.matchFieldType(combinedText, type);

        return {
            type: fieldType,
            inputType: type,
            name: element.name,
            id: element.id,
            placeholder: element.placeholder,
            label: labelText,
            required: element.required || element.getAttribute('aria-required') === 'true'
        };
    },

    /**
     * Match field type based on text patterns
     * @param {string} text
     * @param {string} inputType
     * @returns {string} Field type
     */
    matchFieldType(text, inputType) {
        // Email is easy to detect
        if (inputType === 'email' || this.matchesAny(text, FIELD_PATTERNS.email)) {
            return 'email';
        }

        // Phone
        if (inputType === 'tel' || this.matchesAny(text, FIELD_PATTERNS.phone)) {
            return 'phone';
        }

        // Check for specific patterns
        for (const [fieldType, patterns] of Object.entries(FIELD_PATTERNS)) {
            if (this.matchesAny(text, patterns)) {
                return fieldType;
            }
        }

        // Special handling for file inputs
        if (inputType === 'file') {
            if (this.matchesAny(text, FIELD_PATTERNS.resume)) {
                return 'resume';
            }
            return 'file';
        }

        // Date inputs
        if (inputType === 'date' || inputType === 'month') {
            return 'date';
        }

        return 'unknown';
    },

    /**
     * Check if text matches any pattern in the array
     * @param {string} text
     * @param {Array<string>} patterns
     * @returns {boolean}
     */
    matchesAny(text, patterns) {
        return patterns.some(pattern => text.includes(pattern));
    },

    /**
     * Get label text associated with an input element
     * @param {HTMLElement} element
     * @returns {string}
     */
    getLabelText(element) {
        let text = '';

        // 1. Try to find label by 'for' attribute
        if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) text = label.innerText || label.textContent;
        }

        // 2. Try to find parent label
        if (!text.trim()) {
            const parentLabel = element.closest('label');
            if (parentLabel) text = parentLabel.innerText || parentLabel.textContent;
        }

        // 3. Try aria-labelledby or aria-label
        if (!text.trim()) {
            const labelledBy = element.getAttribute('aria-labelledby');
            if (labelledBy) {
                const labelElement = document.getElementById(labelledBy);
                if (labelElement) text = labelElement.innerText || labelElement.textContent;
            }
            if (!text.trim()) text = element.getAttribute('aria-label') || '';
        }

        // 4. DEEP SCAN: Try nearby DOM nodes (Common in modern frameworks)
        if (!text.trim()) {
            const container = element.parentElement;
            if (container) {
                // Check all children that aren't inputs
                const siblings = Array.from(container.children).filter(c => c !== element && !['INPUT', 'SELECT', 'TEXTAREA'].includes(c.tagName));
                if (siblings.length > 0) {
                    text = siblings.map(s => s.innerText).join(' ');
                }
            }
        }

        // 5. UPWARD SCAN: Check predecessors
        if (!text.trim()) {
            let prev = element.previousElementSibling;
            while (prev && !text.trim()) {
                if (['SPAN', 'DIV', 'LABEL', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(prev.tagName)) {
                    text = prev.innerText;
                }
                prev = prev.previousElementSibling;
            }
        }

        return text.trim();
    },

    /**
     * Check if element is visible
     * @param {HTMLElement} element
     * @returns {boolean}
     */
    isVisible(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        
        // Explicitly hidden by display/visibility
        if (style.display === 'none' || style.visibility === 'hidden') return false;

        const rect = element.getBoundingClientRect();
        const hasZeroSize = rect.width === 0 || rect.height === 0;
        const hasZeroOpacity = style.opacity === '0';

        // Custom styled inputs (checkbox, radio, file) often hide the real input
        if (hasZeroOpacity || hasZeroSize) {
            const type = (element.type || '').toLowerCase();
            if (['radio', 'checkbox', 'file'].includes(type)) {
                // Return true if its nearest label or parent is visible
                const parent = element.closest('label') || element.parentElement;
                if (parent) {
                    const parentStyle = window.getComputedStyle(parent);
                    if (parentStyle.display !== 'none' && parentStyle.visibility !== 'hidden') {
                        return true;
                    }
                }
            }
            if (hasZeroOpacity) return false;
        }

        // Use rect check to handle fixed/absolute positioned elements (modals)
        return rect.width > 0 || rect.height > 0 || element.getClientRects().length > 0;
    },

    /**
     * Detect the platform/job site
     * @returns {string} Platform name
     */
    detectPlatform() {
        const url = window.location.hostname.toLowerCase();

        if (url.includes('linkedin.com')) return 'linkedin';
        if (url.includes('indeed.com')) return 'indeed';
        if (url.includes('workday.com') || url.includes('myworkdayjobs.com')) return 'workday';
        if (url.includes('greenhouse.io')) return 'greenhouse';
        if (url.includes('lever.co')) return 'lever';

        return 'generic';
    },

    /**
     * Find the main form container
     * @returns {HTMLElement|null}
     */
    findFormContainer() {
        const platform = this.detectPlatform();
        const selectors = PLATFORM_SELECTORS[platform];

        if (selectors && selectors.formContainer) {
            return document.querySelector(selectors.formContainer);
        }

        // Fallback: find the first form element
        return document.querySelector('form');
    }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.FieldDetector = FieldDetector;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FieldDetector;
}
