// ─── All frontend models matching backend types ────────────────────────────────

export type ModuleId = 'sde' | 'resume' | 'govt' | 'teach' | 'freelance' | 'tracker' | 'alerts';
export type LocationKey = 'hyderabad' | 'remote' | 'bangalore' | 'pan_india' | 'global';
export type GovtStatus = 'ACTIVE' | 'UPCOMING' | 'CLOSED_RECENTLY' | 'NO_CURRENT_NOTIFICATION' | 'ERROR';

export interface ApiResponse<T> {
  success: boolean;
  data?:   T;
  error?:  string;
  cached?: boolean;
}

export interface LocationConfig {
  label: string;
  key:   LocationKey;
}

export interface Company {
  name:     string;
  apply:    string;
  location: string;
  color?:   string;
}

export interface PlatformLink {
  name: string;
  url:  string;
  type: string;
}

// ─── Module configs (drives the sidebar + routing) ────────────────────────────
export interface ModuleConfig {
  id:        ModuleId;
  icon:      string;
  label:     string;
  shortLabel:string;
  color:     string;
  dimColor:  string;
  badge:     string;
  desc:      string;
  route:     string;
}

export const MODULE_CONFIGS: ModuleConfig[] = [
  { id:'sde',      icon:'⚡', label:'SDE / SWE / SE Jobs',  shortLabel:'Tech Jobs',  color:'#00d4ff', dimColor:'rgba(0,212,255,0.1)',  badge:'AI LIVE',  desc:'AI scans real job boards live — only currently hiring roles',         route:'/sde'      },
  { id:'resume',   icon:'🔧', label:'Resume Stack Jobs',     shortLabel:'Stack Match',color:'#00e676', dimColor:'rgba(0,230,118,0.1)',  badge:'AI LIVE',  desc:'AI finds live roles matching YOUR actual resume skills',               route:'/resume'   },
  { id:'govt',     icon:'🏛️', label:'Govt / PSU Jobs',      shortLabel:'Govt Jobs',  color:'#ffb800', dimColor:'rgba(255,184,0,0.1)',  badge:'AI LIVE',  desc:'AI reads official portals & PDFs — real vacancies and deadlines',     route:'/govt'     },
  { id:'teach',    icon:'🎓', label:'DSA Teaching',          shortLabel:'Teaching',   color:'#7c4dff', dimColor:'rgba(124,77,255,0.1)', badge:'AI LIVE',  desc:'AI finds live tutoring gigs on Codementor, Upwork, Chegg globally',   route:'/teach'    },
  { id:'freelance',icon:'🌐', label:'Web Freelance',         shortLabel:'Freelance',  color:'#ff4081', dimColor:'rgba(255,64,129,0.1)', badge:'AI LIVE',  desc:'AI scans Upwork, Toptal, Arc.dev for active MEAN/MERN projects',      route:'/freelance'},
  { id:'tracker',  icon:'📋', label:'Application Tracker',  shortLabel:'Tracker',    color:'#f59e0b', dimColor:'rgba(245,158,11,0.1)', badge:'NEW',      desc:'Track all your applications — pipeline, interviews, offers',          route:'/tracker'  },
  { id:'alerts',   icon:'🔔', label:'Job Alerts',            shortLabel:'Alerts',     color:'#a78bfa', dimColor:'rgba(167,139,250,0.1)',badge:'NEW',      desc:'Get daily live job digest to your email every morning at 9AM',        route:'/alerts'   },
];

// ─── SDE Job ──────────────────────────────────────────────────────────────────
export interface SdeJob {
  id:            string;
  title:         string;
  keyword:       string;
  roleType:      'SDE' | 'SWE' | 'SE';
  interviewType: string;
  dsaFocus:      string;
  sdFocus:       string;
  rounds:        string;
  ctc:           string;
  score:         number;
  companies:     Company[];
  searchUrls:    Record<string, string>;
}

export interface SdeModuleData {
  jobs:     SdeJob[];
  total:    number;
  location: LocationKey;
}

// ─── Resume Job ───────────────────────────────────────────────────────────────
export interface ResumeJob {
  id:         string;
  title:      string;
  keyword:    string;
  stackFocus: string;
  skills:     string[];
  ctc:        string;
  score:      number;
  companies:  Company[];
  searchUrls: Record<string, string>;
}

export interface ResumeModuleData {
  jobs:     ResumeJob[];
  total:    number;
  location: LocationKey;
}

// ─── Govt Job ─────────────────────────────────────────────────────────────────
export interface GovtFetchedData {
  status:            GovtStatus;
  notificationTitle: string;
  vacancies:         string | null;
  postName:          string;
  applicationDates:  { start: string | null; end: string | null };
  examDate:          string | null;
  eligibility:       { education: string; age: string; marks: string };
  salary:            string;
  selectionProcess:  string;
  syllabus:          string;
  pdfLinks:          string[];
  sourceUrl:         string;
  lastUpdated:       string | null;
  profileMatch:      { score: number; reason: string; advantages: string[]; gaps: string[] };
  actionRequired:    string;
  importantNote:     string;
}

export interface GovtJobResult {
  id:         string;
  org:        string;
  fullName:   string;
  tags:       string[];
  salary:     string;
  officialUrl:string;
  portals:    PlatformLink[];
  fetched:    GovtFetchedData | null;
  fetchedAt:  string | null;
  error?:     string;
}

export interface GovtModuleData {
  results:   GovtJobResult[];
  total:     number;
  scannedAt: string;
  logs?:     string[];
}

// ─── Teaching ─────────────────────────────────────────────────────────────────
export interface TeachingOpportunity {
  id:         string;
  title:      string;
  platform:   string;
  audience:   string;
  earn:       string;
  languages:  string[];
  details:    string;
  howToStart: string;
  demand:     string;
  score:      number;
  portals:    PlatformLink[];
}

export interface TeachModuleData {
  opportunities: TeachingOpportunity[];
  total:         number;
}

// ─── Freelance ────────────────────────────────────────────────────────────────
export interface FreelanceOpportunity {
  id:          string;
  title:       string;
  platform:    string;
  clients:     string;
  earn:        string;
  stack:       string[];
  details:     string;
  howToStart:  string;
  hotProjects: string[];
  demand:      string;
  score:       number;
  portals:     PlatformLink[];
}

export interface FreelanceModuleData {
  opportunities: FreelanceOpportunity[];
  total:         number;
}

// ─── Locations ────────────────────────────────────────────────────────────────
export const LOCATIONS: LocationConfig[] = [
  { label:'Hyderabad', key:'hyderabad' },
  { label:'Remote',    key:'remote'    },
  { label:'Bengaluru', key:'bangalore' },
  { label:'Pan India', key:'pan_india' },
  { label:'Global',    key:'global'    },
];
