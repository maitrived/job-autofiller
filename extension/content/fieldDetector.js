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
            // Skip hidden, disabled, and readonly fields
            if (element.type === 'hidden' ||
                element.disabled ||
                element.readOnly ||
                !this.isVisible(element)) {
                return;
            }

            // Explicitly skip LinkedIn top-bar search if root is document
            if (isLinkedIn && root === document && element.closest(searchSelectors)) {
                return;
            }

            const fieldInfo = this.analyzeField(element);

            if (fieldInfo.type !== 'unknown') {
                fields.push({
                    element,
                    ...fieldInfo
                });
            }
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
        // Try to find label by 'for' attribute
        if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) {
                return label.textContent.trim();
            }
        }

        // Try to find parent label
        const parentLabel = element.closest('label');
        if (parentLabel) {
            return parentLabel.textContent.trim();
        }

        // Try to find nearby label (previous sibling)
        let sibling = element.previousElementSibling;
        while (sibling) {
            if (sibling.tagName === 'LABEL') {
                return sibling.textContent.trim();
            }
            sibling = sibling.previousElementSibling;
        }

        // Try aria-labelledby
        const labelledBy = element.getAttribute('aria-labelledby');
        if (labelledBy) {
            const labelElement = document.getElementById(labelledBy);
            if (labelElement) {
                return labelElement.textContent.trim();
            }
        }

        return '';
    },

    /**
     * Check if element is visible
     * @param {HTMLElement} element
     * @returns {boolean}
     */
    isVisible(element) {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            element.offsetParent !== null;
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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FieldDetector;
}
