// ─── Shared Types across the entire backend ───────────────────────────────────

export type ModuleId = 'sde' | 'resume' | 'govt' | 'teach' | 'freelance';
export type LocationKey = 'hyderabad' | 'remote' | 'bangalore' | 'pan_india' | 'global';
export type GovtStatus = 'ACTIVE' | 'UPCOMING' | 'CLOSED_RECENTLY' | 'NO_CURRENT_NOTIFICATION' | 'ERROR';

// ─── API Response wrapper ─────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  cachedAt?: string;
  fetchedAt?: string;
}

// ─── Location ─────────────────────────────────────────────────────────────────
export interface LocationConfig {
  label: string;
  naukri: string;
  linkedin: string;
  indeed: string;
}

// ─── Company (used in SDE + Resume modules) ───────────────────────────────────
export interface Company {
  name: string;
  apply: string;
  location: string;
  color?: string;
}

// ─── Platform link (Teaching + Freelance) ────────────────────────────────────
export interface PlatformLink {
  name: string;
  url: string;
  type: 'Official' | 'Register' | 'Jobs' | 'Guide' | 'Research' | 'Platform' | 'Gazette' | 'Tracker' | 'Exam Body' | 'Aggregator';
}

// ─── SDE / SWE / SE Job ───────────────────────────────────────────────────────
export interface SdeJob {
  id: string;
  title: string;
  keyword: string;
  roleType: 'SDE' | 'SWE' | 'SE';
  interviewType: 'DSA Heavy' | 'System Design' | 'Both DSA + SD' | 'Mostly SD';
  dsaFocus: string;
  sdFocus: string;
  rounds: string;
  ctc: string;
  score: number;
  companies: Company[];
  searchUrls: Record<string, string>;
}

// ─── Resume-matched Job ───────────────────────────────────────────────────────
export interface ResumeJob {
  id: string;
  title: string;
  keyword: string;
  stackFocus: string;
  skills: string[];
  ctc: string;
  score: number;
  companies: Company[];
  searchUrls: Record<string, string>;
}

// ─── Govt Job (AI-fetched) ────────────────────────────────────────────────────
export interface GovtOrgConfig {
  id: string;
  org: string;
  fullName: string;
  tags: string[];
  salary: string;
  searchQuery: string;
  officialUrl: string;
  portals: PlatformLink[];
}

export interface GovtFetchedData {
  status: GovtStatus;
  notificationTitle: string;
  vacancies: string | null;
  postName: string;
  applicationDates: { start: string | null; end: string | null };
  examDate: string | null;
  eligibility: { education: string; age: string; marks: string };
  salary: string;
  selectionProcess: string;
  syllabus: string;
  pdfLinks: string[];
  sourceUrl: string;
  lastUpdated: string | null;
  profileMatch: {
    score: number;
    reason: string;
    advantages: string[];
    gaps: string[];
  };
  actionRequired: string;
  importantNote: string;
}

export interface GovtJobResult {
  id: string;
  org: string;
  fullName: string;
  tags: readonly string[] | string[];
  salary: string;
  searchQuery: string;
  officialUrl: string;
  portals: PlatformLink[];
  fetched: GovtFetchedData | null;
  fetchedAt: string | null;
  error?: string;
}

// ─── Teaching Opportunity ─────────────────────────────────────────────────────
export interface TeachingOpportunity {
  id: string;
  title: string;
  platform: string;
  audience: string;
  earn: string;
  languages: string[];
  details: string;
  howToStart: string;
  demand: string;
  score: number;
  portals: PlatformLink[];
}

// ─── Freelance Opportunity ────────────────────────────────────────────────────
export interface FreelanceOpportunity {
  id: string;
  title: string;
  platform: string;
  clients: string;
  earn: string;
  stack: string[];
  details: string;
  howToStart: string;
  hotProjects: string[];
  demand: string;
  score: number;
  portals: PlatformLink[];
}

// ─── Module response types ────────────────────────────────────────────────────
export interface SdeModuleResponse {
  jobs: SdeJob[];
  total: number;
  location: LocationKey;
}

export interface ResumeModuleResponse {
  jobs: ResumeJob[];
  total: number;
  location: LocationKey;
}

export interface GovtModuleResponse {
  results: GovtJobResult[];
  total: number;
  scannedAt: string;
}

export interface TeachModuleResponse {
  opportunities: TeachingOpportunity[];
  total: number;
}

export interface FreelanceModuleResponse {
  opportunities: FreelanceOpportunity[];
  total: number;
}
