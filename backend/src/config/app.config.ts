import dotenv from 'dotenv';
import { LocationConfig, LocationKey } from '../types';
dotenv.config();

// ─── Environment ──────────────────────────────────────────────────────────────
export const ENV = {
  PORT:             parseInt(process.env.PORT || '3000'),
  NODE_ENV:         process.env.NODE_ENV || 'development',
  CLIENT_ORIGIN:    process.env.CLIENT_ORIGIN || 'http://localhost:4200',
  MONGODB_URI:      process.env.MONGODB_URI || '',
  REDIS_URL:        process.env.REDIS_URL || '',
  ANTHROPIC_API_KEY:process.env.ANTHROPIC_API_KEY || '',

  // Cache TTLs (seconds)
  GOVT_CACHE_TTL:     parseInt(process.env.GOVT_CACHE_TTL     || '43200'),
  TECH_CACHE_TTL:     parseInt(process.env.TECH_CACHE_TTL     || '3600'),
  TEACH_CACHE_TTL:    parseInt(process.env.TEACH_CACHE_TTL    || '86400'),
  FREELANCE_CACHE_TTL:parseInt(process.env.FREELANCE_CACHE_TTL|| '86400'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  RATE_LIMIT_MAX:       parseInt(process.env.RATE_LIMIT_MAX        || '100'),
};

// ─── Location map ─────────────────────────────────────────────────────────────
export const LOCATIONS: Record<LocationKey, LocationConfig> = {
  hyderabad: {
    label:   'Hyderabad',
    naukri:  'hyderabad',
    linkedin:'Hyderabad%2C%20Telangana%2C%20India',
    indeed:  'Hyderabad+Telangana',
  },
  remote: {
    label:   'Remote',
    naukri:  'work-from-home',
    linkedin:'Remote',
    indeed:  'Remote',
  },
  bangalore: {
    label:   'Bengaluru',
    naukri:  'bangalore',
    linkedin:'Bengaluru%2C%20Karnataka%2C%20India',
    indeed:  'Bengaluru+Karnataka',
  },
  pan_india: {
    label:   'Pan India',
    naukri:  'india',
    linkedin:'India',
    indeed:  'India',
  },
  global: {
    label:   'Global',
    naukri:  'india',
    linkedin:'Worldwide',
    indeed:  'India',
  },
};

// ─── Candidate profile (used in AI prompts) ───────────────────────────────────
export const CANDIDATE_PROFILE = {
  name:       'Jaswanth Chelemilla',
  title:      'SDE-2',
  experience: '3+ years',
  location:   'Hyderabad',
  education:  'B.Tech IT, IARE Hyderabad, 2022, CGPA 8.9/10',
  skills: [
    'Node.js','TypeScript','Express.js','Angular','MongoDB','PostgreSQL',
    'Redis','AWS','Docker','GitHub Actions','BullMQ','JWT','OAuth2',
    'Microservices','MEAN Stack','MERN Stack',
  ],
  achievements: [
    '12K+ concurrent users with Redis SETNX distributed locking (0 collisions)',
    '45% infra cost reduction via EC2 ASG autoscaling',
    '5× leaderboard speedup using Redis Sorted Sets (800ms → 160ms)',
    '82% → 97% API success rate via idempotent workflows',
    '7K+ placement applications processed in 2 weeks (sub-150ms latency)',
  ],
};

// ─── Govt organisations to scan ───────────────────────────────────────────────
export const GOVT_ORGS = [
  {
    id: 'g1', org: 'NIC', fullName: 'National Informatics Centre',
    tags: ['Central Govt','IT','Permanent'], salary: '₹44,900–₹1,42,400/mo',
    searchQuery: 'NIC National Informatics Centre software engineer scientist B recruitment notification 2025 computer science IT',
    officialUrl: 'https://www.nic.in/careers/',
    portals: [
      { name:'NIC Careers',    url:'https://www.nic.in/careers/',    type:'Official'    },
      { name:'Employment News',url:'https://www.employmentnews.gov.in/', type:'Gazette' },
      { name:'Naukri Govt',    url:'https://www.naukri.com/government-jobs?keyword=NIC+software', type:'Aggregator' },
    ],
  },
  {
    id: 'g2', org: 'ISRO', fullName: 'Indian Space Research Organisation',
    tags: ['Central Govt','Scientist','High Prestige'], salary: '₹56,100–₹1,77,500/mo',
    searchQuery: 'ISRO scientist engineer SC ICRB recruitment notification 2025 computer science IT apply online',
    officialUrl: 'https://www.isro.gov.in/Careers.html',
    portals: [
      { name:'ISRO Careers', url:'https://www.isro.gov.in/Careers.html', type:'Official'   },
      { name:'ICRB Portal',  url:'https://www.icrb.gov.in/',             type:'Exam Body'  },
      { name:'Employment News',url:'https://www.employmentnews.gov.in/', type:'Gazette'    },
    ],
  },
  {
    id: 'g3', org: 'DRDO CEPTAM', fullName: 'Defence Research & Development Organisation',
    tags: ['Central Govt','Defence','Scientist'], salary: '₹56,100–₹1,77,500/mo',
    searchQuery: 'DRDO CEPTAM scientist B technician A recruitment notification 2025 computer science apply online',
    officialUrl: 'https://ceptam.drdo.gov.in/',
    portals: [
      { name:'CEPTAM Portal', url:'https://ceptam.drdo.gov.in/',       type:'Official'   },
      { name:'DRDO Careers',  url:'https://www.drdo.gov.in/careers',   type:'Official'   },
      { name:'Sarkari Result',url:'https://sarkarijob.com/?s=DRDO',    type:'Tracker'    },
    ],
  },
  {
    id: 'g4', org: 'TSPSC', fullName: 'Telangana State Public Service Commission',
    tags: ['State Govt','Telangana','Home Posting'], salary: '₹35,000–₹1,00,000/mo',
    searchQuery: 'TSPSC Telangana IT officer software engineer recruitment notification 2025 apply online',
    officialUrl: 'https://www.tspsc.gov.in/',
    portals: [
      { name:'TSPSC Official', url:'https://www.tspsc.gov.in/',        type:'Official'   },
      { name:'Naukri Govt',    url:'https://www.naukri.com/telangana-government-jobs', type:'Aggregator' },
      { name:'Employment News',url:'https://www.employmentnews.gov.in/', type:'Gazette'  },
    ],
  },
  {
    id: 'g5', org: 'ECIL', fullName: 'Electronics Corporation of India Ltd (PSU, Hyderabad HQ)',
    tags: ['PSU','Navratna','Hyderabad HQ'], salary: '₹40,000–₹1,40,000/mo',
    searchQuery: 'ECIL GET graduate engineer trainee technical officer recruitment 2025 computer science Hyderabad notification',
    officialUrl: 'https://www.ecil.co.in/careers/',
    portals: [
      { name:'ECIL Careers',   url:'https://www.ecil.co.in/careers/', type:'Official'   },
      { name:'Naukri Govt',    url:'https://www.naukri.com/ecil-jobs', type:'Aggregator' },
      { name:'Employment News',url:'https://www.employmentnews.gov.in/', type:'Gazette'  },
    ],
  },
  {
    id: 'g6', org: 'UPSC IES', fullName: 'UPSC Engineering Services Examination',
    tags: ['UPSC','Grade A Gazetted','High Prestige'], salary: '₹56,100–₹2,50,000/mo',
    searchQuery: 'UPSC IES ESE engineering services examination 2025 notification schedule computer engineering apply',
    officialUrl: 'https://upsc.gov.in/examinations/active-examinations',
    portals: [
      { name:'UPSC Active Exams', url:'https://upsc.gov.in/examinations/active-examinations', type:'Official' },
      { name:'UPSC Official',     url:'https://upsc.gov.in/',          type:'Official'   },
      { name:'Sarkari Result',    url:'https://sarkarijob.com/?s=UPSC+engineering+services', type:'Tracker' },
    ],
  },
  {
    id: 'g7', org: 'SSC CGL', fullName: 'Staff Selection Commission — Combined Graduate Level',
    tags: ['SSC','Central Govt','Grade B'], salary: '₹25,500–₹81,100/mo',
    searchQuery: 'SSC CGL 2025 notification schedule application date DEO computer science',
    officialUrl: 'https://ssc.nic.in/',
    portals: [
      { name:'SSC Official',     url:'https://ssc.nic.in/',            type:'Official'      },
      { name:'SSC Registration', url:'https://sscregistration.prv.nic.in/', type:'Register' },
      { name:'Sarkari Result',   url:'https://sarkarijob.com/?s=SSC+CGL', type:'Tracker'    },
    ],
  },
  {
    id: 'g8', org: 'UGC NET CS', fullName: 'NTA — UGC NET Computer Science & Applications',
    tags: ['Academic','JRF','Teaching'], salary: '₹57,700–₹1,82,400/mo',
    searchQuery: 'UGC NET computer science applications 2025 NTA notification exam date application form',
    officialUrl: 'https://ugcnet.nta.nic.in/',
    portals: [
      { name:'NTA UGC NET',    url:'https://ugcnet.nta.nic.in/',       type:'Official'   },
      { name:'UGC Official',   url:'https://www.ugc.gov.in/',          type:'Official'   },
      { name:'Academic Jobs',  url:'https://www.academicjobs.in/',     type:'Aggregator' },
    ],
  },
] as const;
