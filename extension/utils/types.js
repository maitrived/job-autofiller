/**
 * Type definitions for user profile data
 * Mirrors the TypeScript types from dashboard/app/types/profile.ts
 */

/**
 * @typedef {Object} PersonalInfo
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} phone
 * @property {string} location
 * @property {string} [linkedin]
 * @property {string} [portfolio]
 * @property {string} [github]
 */

/**
 * @typedef {Object} Education
 * @property {string} id
 * @property {string} institution
 * @property {string} degree
 * @property {string} field
 * @property {string} startDate
 * @property {string} endDate
 * @property {string} [gpa]
 * @property {string[]} [achievements]
 */

/**
 * @typedef {Object} Experience
 * @property {string} id
 * @property {string} company
 * @property {string} position
 * @property {string} location
 * @property {string} startDate
 * @property {string} endDate
 * @property {boolean} current
 * @property {string} description
 * @property {string[]} achievements
 */

/**
 * @typedef {Object} Skill
 * @property {string} id
 * @property {string} name
 * @property {'technical'|'soft'|'language'|'tool'} category
 * @property {'beginner'|'intermediate'|'advanced'|'expert'} proficiency
 */

/**
 * @typedef {Object} QAPair
 * @property {string} id
 * @property {string} question
 * @property {string} answer
 * @property {string} category
 * @property {string[]} tags
 */

/**
 * @typedef {Object} Resume
 * @property {string} fileName
 * @property {string} fileUrl
 * @property {string} uploadDate
 * @property {string} [parsedText]
 */

/**
 * @typedef {Object} UserProfile
 * @property {PersonalInfo} personalInfo
 * @property {Education[]} education
 * @property {Experience[]} experience
 * @property {Skill[]} skills
 * @property {QAPair[]} qaBank
 * @property {Resume} [resume]
 * @property {string} lastUpdated
 */
