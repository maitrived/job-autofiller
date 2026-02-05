// Type definitions for user profile data

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string; // Street address
  city: string;
  state: string;
  zipCode: string;
  country: string;
  location: string; // Legacy field, can be used for "City, State"
  linkedin?: string;
  portfolio?: string;
  github?: string;
  hasPreferredName?: boolean;
  preferredFirstName?: string;
  preferredLastName?: string;
  dateOfBirth?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  achievements?: string[];
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements: string[];
}

export interface Skill {
  id: string;
  name: string;
  category: 'technical' | 'soft' | 'language' | 'tool';
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface QAPair {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

export interface Resume {
  fileName: string;
  fileUrl: string; // Blob URL or base64
  uploadDate: string;
  parsedText?: string;
  coverLetter?: string;
  coverLetterFormat?: string;
}

export interface WorkAuthorization {
  areYouAuthorized: boolean;
  requireSponsorship: boolean;
  currentVisaStatus: 'citizen' | 'green_card' | 'h1b' | 'opt' | 'cpt' | 'f1' | 'other';
  eadStart?: string;
  eadExpiration?: string;
  sponsorshipType?: 'h1b' | 'stem_opt' | 'both' | 'other';
}

export interface Demographics {
  gender?: string;
  race?: string[];
  veteranStatus?: string;
  disabilityStatus?: string;
}

export interface UserProfile {
  id: string;
  name: string; // e.g., "Software Engineer Profile", "Data Scientist Profile"
  personalInfo: PersonalInfo;
  education: Education[];
  experience: Experience[];
  skills: Skill[];
  workAuthorization: WorkAuthorization;
  demographics: Demographics;
  lastUpdated: string;
}

export interface JobBoard {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

export interface SearchConfig {
  keywords: string[];
  locations: string[];
  remote: 'remote' | 'hybrid' | 'onsite' | 'any';
  dailyLimit: number;
  requiresSponsorship: boolean;
  maxExperience: number;
  datePosted?: 'any' | 'past_24h' | 'past_week' | 'past_month';
}

export interface SearchProfile {
  id: string;
  name: string; // User-given name for this search (e.g., "Java Remote Jobs")
  targetProfileId: string; // Link to a UserProfile.id
  config: SearchConfig;
}

export interface AutoApplyStatus {
  searchProfileId: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  progress: {
    applicationsSubmitted: number;
    applicationsTarget: number;
    currentJobUrl?: string;
  };
  startedAt?: string;
  completedAt?: string;
  lastError?: string;
}

export interface AutoApplyHistory {
  id: string;
  searchProfileId: string;
  startedAt: string;
  completedAt: string;
  applicationsSubmitted: number;
  errors: string[];
}

export interface MasterProfile {
  profiles: UserProfile[];
  searchProfiles: SearchProfile[];
  jobBoards: JobBoard[]; // Global Job Boards
  qaBank: QAPair[]; // Global QA Bank
  resumes: Resume[]; // Global Resumes
  activeProfileId: string;
  activeSearchProfileId: string;
  autoApplyStatuses?: AutoApplyStatus[];
  autoApplyHistory?: AutoApplyHistory[];
}

export const defaultPersonalInfo: PersonalInfo = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  location: '',
  linkedin: '',
  portfolio: '',
  github: '',
};

export const defaultProfile = (id: string = 'default', name: string = 'Default Profile'): UserProfile => ({
  id,
  name,
  personalInfo: { ...defaultPersonalInfo, hasPreferredName: false },
  education: [],
  experience: [],
  skills: [],
  workAuthorization: {
    areYouAuthorized: true,
    requireSponsorship: false,
    currentVisaStatus: 'citizen'
  },
  demographics: {},
  lastUpdated: new Date().toISOString(),
});

export const defaultJobBoards: JobBoard[] = [
  { id: 'jb_1', name: 'LinkedIn', url: 'https://www.linkedin.com/jobs', enabled: true },
  { id: 'jb_2', name: 'Indeed', url: 'https://www.indeed.com/', enabled: true },
  { id: 'jb_3', name: 'Glassdoor', url: 'https://www.glassdoor.com/Job/index.htm', enabled: false },
];

export const defaultMasterProfile: MasterProfile = {
  profiles: [defaultProfile()],
  searchProfiles: [],
  jobBoards: defaultJobBoards,
  qaBank: [],
  resumes: [],
  activeProfileId: 'default',
  activeSearchProfileId: '',
  autoApplyStatuses: [],
  autoApplyHistory: [],
};
