import Anthropic from '@anthropic-ai/sdk';
import { ENV, CANDIDATE_PROFILE, GOVT_ORGS } from '../config/app.config';
import { GovtFetchedData, GovtJobResult } from '../types';
import { extractJson, sleep } from '../utils/helpers';

const client = new Anthropic({ apiKey: ENV.ANTHROPIC_API_KEY });

// ─── System prompt for govt scanner ──────────────────────────────────────────
function buildGovtSystemPrompt(org: string, fullName: string): string {
  const profile = CANDIDATE_PROFILE;
  return `You are a government job research assistant for ${profile.name}.

CANDIDATE PROFILE:
- Education: ${profile.education}
- Experience: ${profile.experience} as ${profile.title}
- Location: ${profile.location}
- Skills: ${profile.skills.join(', ')}
- Key achievements: ${profile.achievements.join('; ')}

YOUR TASK: Search the web for REAL, CURRENT information about ${fullName} (${org}) recruitment notifications. Read their official pages and PDFs thoroughly.

RULES:
1. Search for MOST RECENT notification — 2024 or 2025
2. Extract EXACT details from official sources: post name, vacancies, dates, eligibility, salary
3. If notification is OPEN NOW — status = "ACTIVE"
4. If dates announced but not started — status = "UPCOMING"
5. If recently closed (within 3 months) — status = "CLOSED_RECENTLY"
6. If no current notification found — status = "NO_CURRENT_NOTIFICATION"
7. Extract direct PDF links if found in search results
8. Extract exam syllabus relevant to CS/IT candidates
9. Assess profile match for this specific candidate
10. NEVER fabricate data — if info unavailable, state so honestly

RESPONSE FORMAT — return ONLY this JSON, no markdown, no backticks:
{
  "status": "ACTIVE|UPCOMING|CLOSED_RECENTLY|NO_CURRENT_NOTIFICATION|ERROR",
  "notificationTitle": "exact title from official source or null",
  "vacancies": "number/range as string or null",
  "postName": "exact post name",
  "applicationDates": { "start": "date string or null", "end": "date string or null" },
  "examDate": "date string or null",
  "eligibility": { "education": "...", "age": "...", "marks": "..." },
  "salary": "pay scale",
  "selectionProcess": "written test, interview, etc.",
  "syllabus": "key CS topics from official syllabus",
  "pdfLinks": ["url1", "url2"],
  "sourceUrl": "actual URL where info was found",
  "lastUpdated": "publication date of the notification",
  "profileMatch": {
    "score": 0-100,
    "reason": "why this candidate matches or doesn't",
    "advantages": ["specific advantage 1", "specific advantage 2"],
    "gaps": ["gap 1", "gap 2"]
  },
  "actionRequired": "what the candidate should do right now",
  "importantNote": "critical info like age cutoff, GATE requirement, domicile etc"
}`;
}

// ─── Fetch one govt org ───────────────────────────────────────────────────────
export async function fetchGovtOrg(
  orgConfig: typeof GOVT_ORGS[number],
  onLog?: (msg: string) => void
): Promise<GovtJobResult> {
  const log = (msg: string) => { if (onLog) onLog(msg); };

  log(`⟳ Scanning ${orgConfig.org} from ${orgConfig.officialUrl}...`);

  if (!ENV.ANTHROPIC_API_KEY) {
    log(`! ${orgConfig.org} — ANTHROPIC_API_KEY not configured`);
    return buildErrorResult(orgConfig, 'API key not configured');
  }

  try {
    const response = await client.messages.create({
      model:     'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system:    buildGovtSystemPrompt(orgConfig.org, orgConfig.fullName),
      tools:     [{ type: 'web_search_20250305' as const, name: 'web_search' }],
      messages:  [{
        role:    'user',
        content: `Search for: "${orgConfig.searchQuery}"\n\nAlso check: ${orgConfig.officialUrl}\n\nFind the LATEST recruitment notification for ${orgConfig.org} for CS/IT candidates. Read the full notification or PDF if available. Extract all exact details.`,
      }],
    });

    // Collect all text from response (handles tool_use + text blocks)
    const allText = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('');

    const parsed = extractJson(allText) as GovtFetchedData | null;
    if (!parsed) throw new Error('No valid JSON in response');

    log(`✓ ${orgConfig.org} — ${parsed.status} · ${parsed.postName || 'data fetched'}`);

    return {
      ...orgConfig,
      portals: [...orgConfig.portals],
      fetched:   parsed,
      fetchedAt: new Date().toISOString(),
    };

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    log(`! ${orgConfig.org} — error: ${msg}`);
    return buildErrorResult(orgConfig, msg);
  }
}

// ─── Fetch all govt orgs sequentially ────────────────────────────────────────
export async function fetchAllGovtOrgs(
  onProgress?: (result: GovtJobResult, index: number) => void,
  onLog?: (msg: string) => void
): Promise<GovtJobResult[]> {
  const results: GovtJobResult[] = [];

  for (let i = 0; i < GOVT_ORGS.length; i++) {
    const org = GOVT_ORGS[i];
    const result = await fetchGovtOrg(org, onLog);
    results.push(result);
    if (onProgress) onProgress(result, i);

    // Polite delay between requests to avoid rate limiting
    if (i < GOVT_ORGS.length - 1) await sleep(800);
  }

  return results;
}

// ─── Error fallback ───────────────────────────────────────────────────────────
function buildErrorResult(
  orgConfig: typeof GOVT_ORGS[number],
  errorMsg: string
): GovtJobResult {
  return {
    ...orgConfig,
    portals: [...orgConfig.portals],
    fetched: {
      status:            'ERROR',
      notificationTitle: `${orgConfig.org} — Check official portal directly`,
      vacancies:         null,
      postName:          'Software Engineer / Technical Officer',
      applicationDates:  { start: null, end: null },
      examDate:          null,
      eligibility:       { education: 'B.Tech CS/IT', age: 'Check notification', marks: '60%+' },
      salary:            orgConfig.salary,
      selectionProcess:  'Written Test + Interview',
      syllabus:          'DSA, OS, Computer Networks, DBMS, Programming',
      pdfLinks:          [],
      sourceUrl:         orgConfig.officialUrl,
      lastUpdated:       null,
      profileMatch: {
        score:      75,
        reason:     'Strong CS background — verify eligibility on official portal',
        advantages: ['3+ years SDE-2 experience', 'CGPA 8.9/10', 'Strong DSA background'],
        gaps:       ['Could not verify current eligibility requirements'],
      },
      actionRequired: `Visit ${orgConfig.officialUrl} directly for latest notifications`,
      importantNote:  `Could not fetch live data (${errorMsg}). Always check official portal.`,
    },
    fetchedAt: new Date().toISOString(),
    error: errorMsg,
  };
}
