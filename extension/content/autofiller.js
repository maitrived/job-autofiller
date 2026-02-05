/**
 * Autofiller - Maps profile data to form fields and fills them
 */

const Autofiller = {
    /**
     * Fill form fields with profile data
     * @param {UserProfile} profile
     * @param {Array<Object>} fields
     * @returns {Object} Results of the autofill operation
     */
    async fillFields(profile, fields) {
        if (!profile) {
            throw new Error('No profile data available');
        }

        const results = {
            filled: 0,
            skipped: 0,
            errors: 0,
            fields: [],
            qaLog: [] // Store captured Q&A for logging
        };

        for (const field of fields) {
            try {
                // Human-like delay between fields
                await SafetyManager.humanWait(300, 800);
                let value = null;
                let success = false;

                // SPECIAL LOGIC: Prioritize 'mved1@asu.edu' for email select fields
                if (field.inputType === 'select' && (field.label.toLowerCase().includes('email') || (field.name && field.name.toLowerCase().includes('email')))) {
                    // Try to pick the preferred email first
                    success = await this.fillField(field.element, 'mved1@asu.edu', field.inputType, true); // true = force fuzzy match
                    if (success) {
                        // Record for logging
                        results.qaLog.push({
                            question: field.label || field.type,
                            answer: value
                        });
                    } else {
                        results.skipped++;
                    }
                } else {
                    results.skipped++;
                }
            } catch (error) {
                console.error(`Error filling field ${field.type}:`, error);
                results.errors++;
            }
        }

        return results;
    },

    /**
     * Get the appropriate value from profile for a field type
     * @param {string} fieldType
     * @param {UserProfile} profile
     * @param {string} label - The actual question text (optional)
     * @returns {Promise<string|any|null>}
     */
    async getValueForField(fieldType, profile, label = '') {
        const { personalInfo, experience, education, skills, workAuthorization, demographics } = profile;
        const labelLower = (label || '').toLowerCase();

        // 1. Personal information
        if (fieldType === 'firstName') return personalInfo.firstName;
        if (fieldType === 'lastName') return personalInfo.lastName;
        if (fieldType === 'email') return personalInfo.email;
        if (fieldType === 'phone') return personalInfo.phone;
        if (fieldType === 'address') return personalInfo.address || personalInfo.location;
        if (fieldType === 'city') return personalInfo.city;
        if (fieldType === 'state') return personalInfo.state;
        if (fieldType === 'zipCode') return personalInfo.zipCode;
        if (fieldType === 'country') return personalInfo.country;
        if (fieldType === 'location') return personalInfo.location || `${personalInfo.city}, ${personalInfo.state}`;
        if (fieldType === 'linkedin') return personalInfo.linkedin || '';
        if (fieldType === 'portfolio') return personalInfo.portfolio || '';
        if (fieldType === 'github') return personalInfo.github || '';

        // 2. Work Authorization
        if (fieldType === 'areYouAuthorized') return workAuthorization.areYouAuthorized ? 'Yes' : 'No';
        if (fieldType === 'requireSponsorship') return workAuthorization.requireSponsorship ? 'Yes' : 'No';
        if (fieldType === 'visaStatus') return workAuthorization.currentVisaStatus;

        // 3. Demographics
        if (fieldType === 'gender') return demographics.gender;
        if (fieldType === 'race') return demographics.race?.[0]; // Usually radio/select takes one
        if (fieldType === 'veteran') return demographics.veteranStatus;
        if (fieldType === 'disability') return demographics.disabilityStatus;

        // 4. Dates & DOB
        if (fieldType === 'date' || labelLower.includes('birth')) {
            return personalInfo.dateOfBirth || '';
        }

        // --- Multi-entry Education/Experience Matching ---

        // Education (Default to first, or match by level)
        if (['school', 'degree', 'major', 'gpa'].includes(fieldType) && education.length > 0) {
            let edu = education[0];
            // If label mentions "Master" or "Graduate", find corresponding degree
            if (labelLower.includes('master') || labelLower.includes('graduate')) {
                edu = education.find(e => e.degree.toLowerCase().includes('master')) || edu;
            } else if (labelLower.includes('bachelor') || labelLower.includes('undergraduate')) {
                edu = education.find(e => e.degree.toLowerCase().includes('bachelor')) || edu;
            }

            if (fieldType === 'school') return edu.institution;
            if (fieldType === 'degree') return edu.degree;
            if (fieldType === 'major') return edu.field;
            if (fieldType === 'gpa') return edu.gpa || '';
        }

        // Experience (Default to most recent)
        if (['company', 'position', 'yearsOfExperience'].includes(fieldType) && experience.length > 0) {
            if (fieldType === 'company') return experience[0].company;
            if (fieldType === 'position') return experience[0].position;
            if (fieldType === 'yearsOfExperience') {
                return this.calculateYearsOfExperience(experience).toString();
            }
        }

        // Date Components (Month/Year)
        if (fieldType.includes('Month') || fieldType.includes('Year')) {
            const isEnd = fieldType.startsWith('end');
            const entry = labelLower.includes('education') || labelLower.includes('school')
                ? education[0] : experience[0];

            if (entry) {
                const dateStr = isEnd ? (entry.current ? new Date().toISOString() : entry.endDate) : entry.startDate;
                if (dateStr) {
                    const date = new Date(dateStr);
                    return fieldType.toLowerCase().includes('month') ? (date.getMonth() + 1).toString() : date.getFullYear().toString();
                }
            }
        }

        // Full name
        if (fieldType === 'fullName') {
            return `${personalInfo.firstName} ${personalInfo.lastName}`.trim();
        }

        // 5. Files (Resume/Cover Letter)
        if (fieldType === 'coverLetter') {
            const hasPdf = profile.resume?.coverLetterFile;
            if (hasPdf) {
                return {
                    type: 'file',
                    dataUrl: profile.resume.coverLetterFile,
                    fileName: profile.resume.coverLetterFileName || 'Cover_Letter.pdf',
                    text: profile.resume.coverLetter || this.generateCoverLetter(profile)
                };
            }
            return profile.resume?.coverLetter || this.generateCoverLetter(profile);
        }

        if (fieldType === 'resume') {
            if (profile.resume?.fileUrl) {
                return {
                    type: 'file',
                    dataUrl: profile.resume.fileUrl,
                    fileName: profile.resume.fileName || 'Resume.pdf'
                };
            }
        }

        // --- AI Fallback for Unknown Questions ---
        if (label && label.length > 3) {
            const qaMatch = profile.qaBank?.find(q =>
                labelLower.includes(q.question.toLowerCase()) ||
                q.question.toLowerCase().includes(labelLower)
            );
            if (qaMatch) return qaMatch.answer;

            try {
                const pageText = document.body.innerText.substring(0, 5000);
                const aiAnswer = await AIAnalyzer.generateAnswer(label, profile, pageText);
                if (aiAnswer) return aiAnswer;
            } catch (e) {
                console.error('AI generation failed silently:', e);
            }
        }

        return null;
    },

    /**
     * Fill a single field with a value
     * @param {HTMLElement} element
     * @param {string} value
     * @param {string} inputType
     * @returns {Promise<boolean>}
     */
    async fillField(element, value, inputType, forceMatch = false) {
        if (!element || !value) return false;

        try {
            await SafetyManager.simulateFocus(element);

            if (inputType === 'file') return this.fillFileUpload(element, value);

            if (inputType === 'select' || inputType === 'select-one') {
                return this.fillSelect(element, value, forceMatch);
            }

            if (inputType === 'radio') {
                return this.fillRadioGroup(element, value);
            }

            if (inputType === 'checkbox') {
                const isChecked = typeof value === 'boolean' ? value :
                    (value?.toString().toLowerCase() === 'yes' || value === '1' || value === 1);
                element.checked = isChecked;
                this.triggerEvents(element);
                return true;
            }

            if (inputType === 'textarea' || element.tagName === 'TEXTAREA') {
                return this.fillTextarea(element, value);
            }

            // Default: text input
            await SafetyManager.scrollToElement(element);
            await SafetyManager.humanType(element, value);
            this.addFillAnimation(element);
            return true;
        } catch (error) {
            console.error('Error filling field:', error);
            return false;
        }
    },

    /**
     * Fill a radio button group
     */
    fillRadioGroup(radio, value) {
        const name = radio.name;
        if (!name) {
            // If no name, check single item
            if (radio.value?.toLowerCase() === value?.toString().toLowerCase()) {
                radio.checked = true;
                this.triggerEvents(radio);
                return true;
            }
            return false;
        }

        const radios = document.querySelectorAll(`input[type="radio"][name="${name}"]`);
        const valueLower = value?.toString().toLowerCase();

        for (let r of radios) {
            const rValue = r.value?.toLowerCase();
            const rLabel = this.getRadioLabel(r).toLowerCase();

            if (rValue === valueLower || rLabel === valueLower ||
                rLabel.includes(valueLower) || valueLower.includes(rLabel)) {
                r.checked = true;
                this.triggerEvents(r);
                return true;
            }
        }
        return false;
    },

    /**
     * Helper to get radio button label
     */
    getRadioLabel(radio) {
        // Try label[for]
        if (radio.id) {
            const label = document.querySelector(`label[for="${radio.id}"]`);
            if (label) return label.textContent.trim();
        }
        // Try parent label
        const parentLabel = radio.closest('label');
        if (parentLabel) return parentLabel.textContent.trim();

        // Try next sibling text
        if (radio.nextSibling && radio.nextSibling.nodeType === 3) {
            return radio.nextSibling.textContent.trim();
        }

        return '';
    },

    /**
     * Fill a select dropdown with intelligent matching
     * @param {HTMLSelectElement} select
     * @param {string} value
     * @returns {boolean}
     */
    fillSelect(select, value) {
        if (!value) return false;
        const valLower = value.toString().toLowerCase();

        // 1. Try exact match (Value or Text)
        for (let option of select.options) {
            if (option.value === value || option.text === value) {
                select.value = option.value;
                this.triggerEvents(select);
                return true;
            }
        }

        // 2. Try normalized partial match
        // Normalizations for common categories
        const DegreeMap = { 'bachelors': ['bs', 'ba', 'undergrad'], 'masters': ['ms', 'ma', 'grad'], 'doctorate': ['phd'] };
        const VisaMap = { 'citizen': ['us citizen', 'permanent resident'], 'f1': ['student', 'opt', 'cpt'] };

        for (let option of select.options) {
            const optText = option.text.toLowerCase();
            const optVal = option.value.toLowerCase();

            // Direct partial match
            if (optText.includes(valLower) || valLower.includes(optText)) {
                select.value = option.value;
                this.triggerEvents(select);
                return true;
            }

            // Category match (if profile value is "bachelors", check if opt text contains "BS")
            for (let [cat, aliases] of Object.entries({ ...DegreeMap, ...VisaMap })) {
                if (valLower.includes(cat)) {
                    if (aliases.some(alias => optText.includes(alias))) {
                        select.value = option.value;
                        this.triggerEvents(select);
                        return true;
                    }
                }
            }
        }

        // 3. Fallback for Boolean (Yes/No)
        if (valLower === 'yes' || valLower === 'no') {
            for (let option of select.options) {
                const t = option.text.toLowerCase();
                if (t === valLower || t.startsWith(valLower[0])) {
                    select.value = option.value;
                    this.triggerEvents(select);
                    return true;
                }
            }
        }

        return false;
    },

    /**
     * Fill a textarea with typing animation
     * @param {HTMLTextAreaElement} textarea
     * @param {string} value
     * @returns {Promise<boolean>}
     */
    async fillTextarea(textarea, value) {
        textarea.value = value;
        this.triggerEvents(textarea);
        this.addFillAnimation(textarea);
        return true;
    },

    /**
     * Trigger necessary events after filling a field
     * @param {HTMLElement} element
     */
    triggerEvents(element) {
        // Trigger input event
        element.dispatchEvent(new Event('input', { bubbles: true }));

        // Trigger change event
        element.dispatchEvent(new Event('change', { bubbles: true }));

        // Trigger blur event (some forms validate on blur)
        element.dispatchEvent(new Event('blur', { bubbles: true }));

        // For React/Vue apps, trigger additional events
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
        )?.set;

        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(element, element.value);
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }
    },

    /**
     * Add visual animation to filled field
     * @param {HTMLElement} element
     */
    addFillAnimation(element) {
        element.style.transition = 'background-color 0.3s ease';
        element.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';

        setTimeout(() => {
            element.style.backgroundColor = '';
        }, 1000);
    },

    /**
     * Calculate total years of experience
     * @param {Array<Experience>} experiences
     * @returns {number}
     */
    calculateYearsOfExperience(experiences) {
        let totalMonths = 0;

        experiences.forEach(exp => {
            const start = new Date(exp.startDate);
            const end = exp.current ? new Date() : new Date(exp.endDate);
            const months = (end.getFullYear() - start.getFullYear()) * 12 +
                (end.getMonth() - start.getMonth());
            totalMonths += months;
        });

        return Math.round(totalMonths / 12);
    },

    /**
     * Generate a cover letter from Q&A bank
     * @param {UserProfile} profile
     * @returns {string}
     */
    generateCoverLetter(profile) {
        // Look for relevant Q&A pairs
        const relevantQA = profile.qaBank.find(qa =>
            qa.question.toLowerCase().includes('cover letter') ||
            qa.question.toLowerCase().includes('why do you want') ||
            qa.question.toLowerCase().includes('why are you interested')
        );

        if (relevantQA) {
            return relevantQA.answer;
        }

        // Generate basic cover letter
        const { personalInfo, experience, education } = profile;
        const latestExp = experience[0];
        const latestEdu = education[0];

        let letter = `Dear Hiring Manager,\n\n`;
        letter += `I am writing to express my interest in this position. `;

        if (latestExp) {
            letter += `I currently work as a ${latestExp.position} at ${latestExp.company}, where ${latestExp.description} `;
        }

        if (latestEdu) {
            letter += `I hold a ${latestEdu.degree} in ${latestEdu.field} from ${latestEdu.institution}. `;
        }

        letter += `\n\nI am excited about the opportunity to contribute to your team.\n\n`;
        letter += `Best regards,\n${personalInfo.firstName} ${personalInfo.lastName}`;

        return letter;
    },

    /**
     * Handle multi-step application forms (e.g., LinkedIn Easy Apply)
     * @param {UserProfile} profile
     * @returns {Promise<void>}
     */
    async handleMultiStep(profile) {
        if (!(await SafetyManager.canApplyToday())) {
            showNotification('Daily application limit reached. Safety first!', 'warning');
            return;
        }

        // Check for sponsorship denial before starting
        const shouldSkip = await this.checkSponsorshipEnforcement();
        if (shouldSkip) {
            console.log('Skipping application: Explicit sponsorship denial found.');
            showNotification('Application skipped: Company explicitly does not sponsor visas.', 'warning');
            return;
        }

        console.log('Starting multi-step application flow...');
        const platform = FieldDetector.detectPlatform();
        let isComplete = false;
        let stepsTaken = 0;
        const MAX_STEPS = 15;
        const fullQaLog = [];

        while (!isComplete && stepsTaken < MAX_STEPS) {
            console.log(`Autofiller: Starting step ${stepsTaken + 1}...`);

            // Find the active form container to restrict focus
            const container = FieldDetector.findFormContainer() || document;

            // 1. Fill current visible fields within container only
            const fields = FieldDetector.detectFields(container);
            console.log(`Autofiller: Detected ${fields.length} fields in container.`);

            const stepResults = await this.fillFields(profile, fields);
            console.log(`Autofiller: Filled ${stepResults.filled} fields.`);

            // Collect Q&A for the final log
            if (stepResults.qaLog) {
                fullQaLog.push(...stepResults.qaLog);
            }

            // 2. Look for Next/Continue/Submit button with POLLING
            let nextButton = null;
            let attempts = 0;
            while (!nextButton && attempts < 5) {
                nextButton = this.findNextButton();
                if (!nextButton) {
                    console.log(`Autofiller: No button found. Retrying (${attempts + 1}/5)...`);
                    await new Promise(r => setTimeout(r, 1000));
                    attempts++;
                }
            }

            if (nextButton) {
                const btnText = (nextButton.textContent || nextButton.value || '').trim();
                console.log(`Autofiller: Found button: "${btnText}"`);

                // If it's the final Submit button, we stop
                const text = btnText.toLowerCase();
                const ariaLabel = (nextButton.getAttribute('aria-label') || '').toLowerCase();
                const isSubmit = text.includes('submit') || ariaLabel.includes('submit');

                await SafetyManager.scrollToElement(nextButton);

                // If button is disabled, try to find missed fields one more time
                if (nextButton.disabled) {
                    console.warn('Autofiller: Button found but disabled. Scanning for missed fields...');
                    const extraFields = FieldDetector.detectFields();
                    if (extraFields.length > 0) {
                        await this.fillFields(profile, extraFields);
                    }
                }

                if (!nextButton.disabled) {
                    console.log(`Autofiller: Clicking ${btnText}...`);
                    nextButton.click();
                    stepsTaken++;

                    if (isSubmit) {
                        console.log('Autofiller: Submit clicked. Finish.');
                        isComplete = true;
                        await SafetyManager.recordApplication();

                        // Notify background to update job status AND log to Excel
                        chrome.runtime.sendMessage({
                            action: 'applicationSubmitted',
                            url: window.location.href,
                            platform: platform,
                            qaLog: fullQaLog // Send the accumulated history
                        });
                        return true;
                    } else {
                        // Human-like wait for next step
                        console.log('Autofiller: Waiting for next step UI to load...');
                        await SafetyManager.humanWait(2500, 4500);
                    }
                } else {
                    console.error('Autofiller: Button remains disabled after retries. Stopping.');
                    isComplete = true;
                    return false;
                }
            } else {
                console.error('Autofiller: No Next/Submit button found after retries!');
                isComplete = true;
                return false;
            }
        }
        return false;
    },

    /**
     * Find the Next/Continue/Submit button on the page
     * @returns {HTMLElement|null}
     */
    findNextButton() {
        const platform = FieldDetector.detectPlatform();
        const selectors = PLATFORM_SELECTORS[platform];

        if (selectors) {
            if (selectors.submitButton) {
                const btn = document.querySelector(selectors.submitButton);
                if (btn && this.isVisible(btn)) return btn;
            }
            if (selectors.nextButton) {
                const btn = document.querySelector(selectors.nextButton);
                if (btn && this.isVisible(btn)) return btn;
            }
        }

        // Fallback: search by text
        const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn, a.button, .artdeco-button'));
        const nextTexts = ['next', 'continue', 'submit', 'review', 'proceed', 'apply', 'done'];

        console.log(`Autofiller: Found ${buttons.length} potential buttons.`);

        let match = buttons.find(btn => {
            const text = (btn.textContent || btn.value || '').toLowerCase().trim();
            const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
            const isVisible = this.isVisible(btn);
            const isMatch = nextTexts.some(t => text.includes(t) || ariaLabel.includes(t));

            // Verbose log for potential candidates
            if (isMatch) {
                console.log(`Autofiller: Candidate button "${text}" - Visible: ${isVisible}, Disabled: ${btn.disabled}`);
            }

            return isVisible && isMatch && !btn.disabled;
        });

        if (match) return match;

        // Final Fallback: LinkedIn's Primary Artdeco Button (often "Next" or "Review")
        if (platform === 'linkedin') {
            console.log('Autofiller: Trying specific LinkedIn primary button fallback...');
            const artdecoBtn = document.querySelector('.artdeco-button--primary');
            if (artdecoBtn && this.isVisible(artdecoBtn)) {
                const text = artdecoBtn.innerText.toLowerCase();
                console.log(`Autofiller: Found Primary Artdeco Button: "${text}"`);
                // Ensure it's not a "Save" or "Follow" button
                if (!text.includes('save') && !text.includes('follow') && !text.includes('dismiss')) {
                    return artdecoBtn;
                }
            }
        }

        return null;
    },

    /**
     * Check if the job explicitly denies sponsorship
     * @returns {Promise<boolean>} True if it should be skipped
     */
    async checkSponsorshipEnforcement() {
        const prefRes = await chrome.storage.local.get('jobSearchPreferences');
        const prefs = prefRes.jobSearchPreferences ? JSON.parse(prefRes.jobSearchPreferences) : {};

        if (!prefs.requiresSponsorship) return false;

        const bodyText = document.body.innerText.toLowerCase();

        // Keywords that usually indicate NO sponsorship
        const denialKeywords = [
            'no sponsorship',
            'not provide sponsorship',
            'no visa sponsorship',
            'sponsorship is not available',
            'legal right to work in the us without sponsorship',
            'must be a us citizen',
            'citizenship is required',
            'cannot sponsor visa',
            'does not offer sponsorship'
        ];

        const explicitlyDenies = denialKeywords.some(keyword => bodyText.includes(keyword));

        // Also check if they explicitly mention they DO sponsor
        const positiveKeywords = ['sponsorship available', 'h1b sponsorship', 'opt candidates', 'willing to sponsor'];
        const explicitlySponsors = positiveKeywords.some(keyword => bodyText.includes(keyword));

        // If it explicitly denies, we skip. 
        // If it explicitly sponsors, we definitely don't skip.
        // If neither, we proceed (user didn't say skip if unknown, just skip if written "do not sponsor")
        return explicitlyDenies && !explicitlySponsors;
    },

    /**
     * Handle file uploads using DataTransfer API
     * @param {HTMLInputElement} element 
     * @param {Object} fileData 
     */
    async fillFileUpload(element, fileData) {
        try {
            if (!fileData || !fileData.dataUrl) return false;

            console.log(`Uploading file: ${fileData.fileName}`);

            // Convert dataURL to File object
            const response = await fetch(fileData.dataUrl);
            const blob = await response.blob();
            const file = new File([blob], fileData.fileName, { type: blob.type });

            // Create DataTransfer to populate input.files
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            element.files = dataTransfer.files;

            this.triggerEvents(element);
            this.addFillAnimation(element);
            return true;
        } catch (error) {
            console.error('File upload failed:', error);
            return false;
        }
    },

    /**
     * Handle site login, specifically Google Sign-in
     * @param {UserProfile} profile 
     */
    async handleLogin(profile) {
        const platform = FieldDetector.detectPlatform();
        const bodyText = document.body.innerText.toLowerCase();

        // 1. Detect "Sign in with Google" or similar
        const googleBtn = Array.from(document.querySelectorAll('button, div, span, a')).find(el => {
            const text = (el.textContent || '').toLowerCase();
            return (text.includes('sign in with google') || text.includes('continue with google')) &&
                this.isVisible(el);
        });

        if (googleBtn) {
            console.log('Detected Google Sign-in option.');
            // Attempt to use the account provided (mved1@asu.edu)
            // In a real browser context, this might just trigger the Google popup.
            // We'll click it and wait.
            googleBtn.click();
            await SafetyManager.humanWait(2000, 4000);
            return;
        }

        // 2. Check for standard login fields
        const loginFields = document.querySelectorAll('input[type="password"]');
        if (loginFields.length > 0) {
            // Check if we have credentials
            const hasCreds = profile.personalInfo.email === 'mved1@asu.edu' || profile.personalInfo.email === 'maitrideepakved@gmail.com';

            if (!hasCreds) {
                // Trigger manual intervention
                await this.triggerManualIntervention(platform);
            }
        }
    },

    /**
     * Show a popup and send an email when manual intervention is needed
     */
    async triggerManualIntervention(siteName) {
        // Send email notification via background -> dashboard API
        chrome.runtime.sendMessage({
            action: 'needManualIntervention',
            type: 'missing_account',
            siteName: siteName
        });

        // Inject Popup
        const popup = document.createElement('div');
        popup.id = 'autofiller-intervention-popup';
        popup.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            background: #1e1b4b;
            color: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            z-index: 999999;
            border: 1px solid #4f46e5;
            font-family: sans-serif;
            text-align: center;
        `;
        popup.innerHTML = `
            <h3 style="margin-top:0; color:#818cf8;">Login Required</h3>
            <p style="font-size:14px; line-height:1.5;">I couldn't find a saved account for <b>${siteName}</b>. I've sent you an email alert.</p>
            <p style="font-size:13px; color:#cbd5e1;">Please sign in or create an account, then click below to continue.</p>
            <button id="autofiller-continue-btn" style="
                background: #4f46e5;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                width: 100%;
                margin-top: 10px;
            ">Continue Applying</button>
        `;

        document.body.appendChild(popup);

        return new Promise((resolve) => {
            document.getElementById('autofiller-continue-btn').addEventListener('click', () => {
                popup.remove();
                resolve(true);
            });
        });
    },

    /**
     * Check if element is visible
     * @param {HTMLElement} element
     */
    isVisible(element) {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && element.offsetParent !== null;
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Autofiller;
}
