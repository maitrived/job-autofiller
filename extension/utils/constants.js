/**
 * Field mapping constants and patterns for form detection
 */

const FIELD_PATTERNS = {
    // Personal Information
    firstName: [
        'firstname', 'first-name', 'first_name', 'fname', 'given-name', 'givenname',
        'forename', 'prenom', 'given name'
    ],
    lastName: [
        'lastname', 'last-name', 'last_name', 'lname', 'surname', 'family-name',
        'familyname', 'family name', 'nom'
    ],
    fullName: [
        'fullname', 'full-name', 'full_name', 'name', 'your-name', 'yourname',
        'applicant-name', 'candidate-name', 'completename'
    ],
    email: [
        'email', 'e-mail', 'emailaddress', 'email-address', 'email_address',
        'mail', 'your-email', 'youremail', 'contact-email'
    ],
    phone: [
        'phone', 'telephone', 'mobile', 'phonenumber', 'phone-number', 'phone_number',
        'tel', 'cell', 'contact-number', 'contactnumber', 'contact number'
    ],
    address: [
        'address', 'street', 'line 1', 'line 2', 'mailing-address', 'residential-address'
    ],
    city: [
        'city', 'town', 'municipality', 'ville'
    ],
    state: [
        'state', 'province', 'region', 'territory', 'state/province'
    ],
    zipCode: [
        'zip', 'postal', 'postcode', 'pincode', 'zip code'
    ],
    country: [
        'country', 'nation', 'pays'
    ],
    location: [
        'location', 'residence', 'current-location',
        'your-location', 'where-are-you-located', 'geographic-location'
    ],
    linkedin: [
        'linkedin', 'linkedin-url', 'linkedin-profile', 'linkedinprofile',
        'linkedin_url', 'linkedin profile'
    ],
    portfolio: [
        'portfolio', 'website', 'personal-website', 'portfoliourl', 'portfolio-url',
        'portfolio_url', 'personal website', 'your website'
    ],
    github: [
        'github', 'github-url', 'github-profile', 'githubprofile', 'github_url',
        'github profile', 'git'
    ],

    // Experience
    company: [
        'company', 'employer', 'organization', 'company-name', 'companyname',
        'current-company', 'most-recent-employer', 'employer name'
    ],
    position: [
        'position', 'title', 'job-title', 'jobtitle', 'job_title', 'role',
        'current-position', 'current-role', 'job title', 'your title'
    ],

    // Education
    school: [
        'school', 'university', 'college', 'institution', 'education',
        'school-name', 'university-name', 'educational-institution'
    ],
    degree: [
        'degree', 'education-level', 'highest-degree', 'qualification',
        'degree-type', 'education level'
    ],
    major: [
        'major', 'field', 'field-of-study', 'fieldofstudy', 'field_of_study',
        'study', 'concentration', 'specialization', 'field of study'
    ],
    gpa: [
        'gpa', 'grade', 'grades', 'grade-point-average', 'gradepoint'
    ],

    // Work Authorization
    areYouAuthorized: [
        'authorized', 'legal-right', 'right-to-work', 'legally-authorized'
    ],
    requireSponsorship: [
        'sponsorship', 'visa', 'h1b', 'require-sponsorship', 'sponsorship-now-or-future'
    ],
    visaStatus: [
        'visa-status', 'visa-type', 'current-visa', 'immigration-status'
    ],

    // Demographics
    gender: [
        'gender', 'sex', 'identify-as-gender'
    ],
    race: [
        'race', 'ethnicity', 'background', 'hispanic'
    ],
    veteran: [
        'veteran', 'military', 'protected-veteran'
    ],
    disability: [
        'disability', 'handicap', 'physical-mental-impairment'
    ],

    // Date Components
    startMonth: ['start-month', 'started-month', 'beginning-month'],
    startYear: ['start-year', 'started-year', 'beginning-year'],
    endMonth: ['end-month', 'ended-month', 'completion-month'],
    endYear: ['end-year', 'ended-year', 'completion-year'],

    // Additional fields
    coverLetter: [
        'cover-letter', 'coverletter', 'cover_letter', 'letter', 'motivation',
        'motivation-letter', 'why-do-you-want', 'why-are-you-interested'
    ],
    resume: [
        'resume', 'cv', 'curriculum-vitae', 'upload-resume', 'attach-resume',
        'resume-upload', 'cv-upload'
    ],
    yearsOfExperience: [
        'years-of-experience', 'yearsofexperience', 'years_of_experience',
        'experience-years', 'total-experience', 'work-experience'
    ]
};

// Platform-specific selectors
const PLATFORM_SELECTORS = {
    linkedin: {
        formContainer: '.jobs-easy-apply-content, .jobs-apply-form, .jobs-easy-apply-modal__content, div[role="dialog"], .artdeco-modal__content',
        submitButton: 'button[aria-label*="Submit"], button[aria-label*="Submit application"], button[type="submit"], button.artdeco-button--primary',
        nextButton: 'button[aria-label*="Next"], button[aria-label*="Continue"], button[aria-label*="Review"], button[aria-label="Continue to next step"], button[aria-label="Review your application"], button.artdeco-button--primary'
    },
    indeed: {
        formContainer: '.ia-BasePage-content, .jobsearch-JobComponent',
        submitButton: 'button[type="submit"], .ia-continueButton'
    },
    workday: {
        formContainer: '[data-automation-id="compositeContainer"]',
        submitButton: 'button[data-automation-id="bottom-navigation-next-button"]'
    },
    greenhouse: {
        formContainer: '#application_form, .application-form',
        submitButton: 'input[type="submit"], button[type="submit"]'
    },
    lever: {
        formContainer: '.application-form, .posting-apply',
        submitButton: '.template-btn-submit, button[type="submit"]'
    }
};

// Input types to handle
const INPUT_TYPES = {
    text: ['text', 'search', 'tel', 'url'],
    email: ['email'],
    textarea: ['textarea'],
    select: ['select-one', 'select-multiple'],
    date: ['date', 'month'],
    file: ['file']
};

// Storage keys
const STORAGE_KEYS = {
    profile: 'jobAutofillProfile',
    settings: 'jobAutofillSettings',
    lastSync: 'jobAutofillLastSync'
};

// Default settings
const DEFAULT_SETTINGS = {
    autoDetect: true,
    showNotifications: true,
    keyboardShortcut: true,
    confirmBeforeFill: false
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FIELD_PATTERNS,
        PLATFORM_SELECTORS,
        INPUT_TYPES,
        STORAGE_KEYS,
        DEFAULT_SETTINGS
    };
}
