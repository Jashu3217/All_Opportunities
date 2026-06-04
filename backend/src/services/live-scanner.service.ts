import Anthropic from '@anthropic-ai/sdk';
import { ENV, CANDIDATE_PROFILE } from '../config/app.config';
import { ParsedProfile } from './resume.service';

const client = new Anthropic({ apiKey: ENV.ANTHROPIC_API_KEY });

export interface LiveJob {
  id:          string;
  title:       string;
  company:     string;
  location:    string;
  salary:      string;
  experience:  string;
  skills:      string[];
  postedDate:  string;
  applyUrl:    string;
  sourceUrl:   string;
  source:      string;
  description: string;
  matchScore:  number;
  matchReason: string;
  isActive:    boolean;
  deadline:    string | null;
  interviewProcess: string;
}

export interface LiveScanResult {
  jobs:      LiveJob[];
  total:     number;
  scannedAt: string;
  query:     string;
  logs:      string[];
}

// ─── Build search query from profile ─────────────────────────────────────────
function buildSearchQuery(moduleId: string, location: string, profile?: ParsedProfile): string {
  const loc = location === 'remote' ? 'remote work from home' :
              location === 'bangalore' ? 'Bengaluru Bangalore' :
              location === 'pan_india' ? 'India' :
              location === 'global' ? '' : 'Hyderabad';

  if (profile && profile.skills && profile.skills.length > 0) {
    const topSkills = profile.skills.slice(0, 4).join(' ');
    const title = profile.title || 'Software Engineer';
    switch (moduleId) {
      case 'sde':      return `${title} ${topSkills} jobs ${loc} 2025 hiring now`;
      case 'resume':   return `${topSkills} developer engineer jobs ${loc} 2025 apply now`;
      case 'teach':    return `${topSkills} online tutor teacher freelance 2025 hiring`;
      case 'freelance':return `${topSkills} freelance developer projects 2025 upwork`;
      default:         return `${title} jobs ${loc} 2025`;
    }
  }

  // Default queries without profile
  switch (moduleId) {
    case 'sde':      return `SDE-2 SWE Node.js TypeScript backend engineer jobs ${loc} 2025 hiring now`;
    case 'resume':   return `Node.js MEAN stack Redis Microservices developer jobs ${loc} 2025`;
    case 'teach':    return `DSA programming online tutor teaching jobs 2025 codementor upwork`;
    case 'freelance':return `Node.js MEAN MERN freelance developer projects 2025 upwork hiring`;
    default:         return `software engineer jobs ${loc} 2025`;
  }
}

// ─── Build system prompt ──────────────────────────────────────────────────────
function buildScanSystemPrompt(moduleId: string, profile?: ParsedProfile): string {
  const candidateName = profile?.name || CANDIDATE_PROFILE.name;
  const skills        = profile?.skills?.join(', ') || CANDIDATE_PROFILE.skills.join(', ');
  const experience    = profile?.experience || CANDIDATE_PROFILE.experience;
  const education     = profile?.education  || CANDIDATE_PROFILE.education;
  const title         = profile?.title      || 'SDE-2';

  return `You are a live job search agent for ${candidateName}.

CANDIDATE PROFILE:
- Title: ${title}
- Experience: ${experience}
- Education: ${education}
- Skills: ${skills}

YOUR TASK: Search the web RIGHT NOW for LIVE, ACTIVE job openings that are currently hiring.

CRITICAL RULES:
1. Only return jobs that are CURRENTLY OPEN and accepting applications
2. Search multiple job boards: Naukri, LinkedIn, Indeed, Cutshort, Wellfound, Instahyre, company career pages
3. Extract REAL data from actual job postings — never fabricate
4. Focus on jobs posted in the last 30 days
5. Each job must have a real apply URL
6. Score each job 0-100 based on how well it matches the candidate profile
7. For module "${moduleId}": ${getModuleInstructions(moduleId)}

Return ONLY valid JSON array, no markdown:
[
  {
    "id": "unique_id",
    "title": "exact job title",
    "company": "company name",
    "location": "city/remote",
    "salary": "salary range or null",
    "experience": "required experience",
    "skills": ["skill1", "skill2"],
    "postedDate": "date posted or approximate",
    "applyUrl": "direct apply URL",
    "sourceUrl": "job listing URL",
    "source": "Naukri/LinkedIn/etc",
    "description": "2-3 sentence job description",
    "matchScore": 0-100,
    "matchReason": "why this matches the candidate",
    "isActive": true,
    "deadline": "application deadline or null",
    "interviewProcess": "known interview process or null"
  }
]

Return 8-12 real live jobs. Sort by matchScore descending.`;
}

function getModuleInstructions(moduleId: string): string {
  const map: Record<string, string> = {
    sde:      'Find SDE/SWE/SE backend engineering roles at product companies and startups',
    resume:   'Find roles matching the candidate stack (Node.js, TypeScript, Redis, MongoDB, AWS, Angular)',
    teach:    'Find online tutoring and teaching opportunities on Codementor, Upwork, Chegg, Udemy, Preply',
    freelance:'Find active freelance projects on Upwork, Freelancer, Toptal, Arc.dev, Turing',
  };
  return map[moduleId] || 'Find relevant job opportunities';
}

// ─── Main live scan function ──────────────────────────────────────────────────
export async function scanLiveJobs(
  moduleId: string,
  location: string,
  profile?: ParsedProfile,
  onLog?: (msg: string) => void
): Promise<LiveScanResult> {
  const log = (msg: string) => { if (onLog) onLog(msg); };
  const query = buildSearchQuery(moduleId, location, profile);
  const logs: string[] = [];

  const addLog = (msg: string) => { logs.push(msg); log(msg); };

  addLog(`⟳ Starting live scan for ${moduleId} jobs...`);
  addLog(`⟳ Search query: "${query}"`);
  addLog(`⟳ Searching Naukri, LinkedIn, Cutshort, Wellfound, Instahyre...`);

  if (!ENV.ANTHROPIC_API_KEY) {
    addLog('! ANTHROPIC_API_KEY not configured');
    return { jobs: [], total: 0, scannedAt: new Date().toISOString(), query, logs };
  }

  try {
    const response = await client.messages.create({
      model:     'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system:    buildScanSystemPrompt(moduleId, profile),
      tools:     [{ type: 'web_search_20250305' as const, name: 'web_search' }],
      messages:  [{
        role:    'user',
        content: `Search for LIVE job openings right now using this query: "${query}"
        
Also search these specific sources:
- site:naukri.com ${query}
- site:linkedin.com/jobs ${query}  
- site:cutshort.io ${query}
- site:wellfound.com ${query}

Find real, currently open positions. Extract all details from the actual job postings.
Return the JSON array of 8-12 live jobs sorted by match score.`,
      }],
    });

    const allText = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('');

    // Extract JSON array
    const jsonMatch = allText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No job data in response');

    const jobs = JSON.parse(jsonMatch[0]) as LiveJob[];

    // Add unique IDs if missing
    const processedJobs = jobs.map((j, i) => ({
      ...j,
      id: j.id || `live_${moduleId}_${i}_${Date.now()}`,
      matchScore: Math.min(100, Math.max(0, j.matchScore || 75)),
      isActive: true,
    })).sort((a, b) => b.matchScore - a.matchScore);

    addLog(`✓ Found ${processedJobs.length} live ${moduleId} jobs`);
    addLog(`✓ Top match: ${processedJobs[0]?.company} — ${processedJobs[0]?.title} (${processedJobs[0]?.matchScore}%)`);

    return {
      jobs:      processedJobs,
      total:     processedJobs.length,
      scannedAt: new Date().toISOString(),
      query,
      logs,
    };

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Scan failed';
    addLog(`! Error: ${msg}`);
    return { jobs: [], total: 0, scannedAt: new Date().toISOString(), query, logs };
  }
}
