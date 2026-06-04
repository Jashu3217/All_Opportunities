import { Request, Response } from 'express';
import { extractTextFromPDF, parseResumeWithAI, ParsedProfile, scoreJobAgainstProfile } from '../services/resume.service';
import { cacheGet, cacheSet } from '../config/redis';
import { getSdeJobs, getResumeJobs, getTeachingOpportunities, getFreelanceOpportunities } from '../services/data.service';
import { buildSearchUrls } from '../utils/helpers';
import { GOVT_ORGS } from '../config/app.config';

// ── Upload + parse resume ─────────────────────────────────────────────────────
export async function uploadResume(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { buffer, mimetype, originalname } = req.file;

    // Extract text
    let resumeText = '';
    if (mimetype === 'application/pdf' || originalname.endsWith('.pdf')) {
      resumeText = await extractTextFromPDF(buffer);
    } else {
      return res.status(400).json({ success: false, error: 'Only PDF files are supported' });
    }

    if (!resumeText || resumeText.trim().length < 100) {
      return res.status(400).json({ success: false, error: 'Could not extract text from PDF. Please ensure it is not a scanned image.' });
    }

    // Parse with AI
    const profile = await parseResumeWithAI(resumeText);

    res.json({
      success: true,
      data: { profile, charCount: resumeText.length },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to parse resume';
    res.status(500).json({ success: false, error: msg });
  }
}

// ── Get personalized jobs based on parsed profile ────────────────────────────
export async function getPersonalizedJobs(req: Request, res: Response) {
  try {
    const { profile, moduleId, location = 'hyderabad' } = req.body as {
      profile:  ParsedProfile;
      moduleId: string;
      location: string;
    };

    if (!profile || !profile.skills) {
      return res.status(400).json({ success: false, error: 'Profile data required' });
    }

    const loc = location as 'hyderabad' | 'remote' | 'bangalore' | 'pan_india' | 'global';

    if (moduleId === 'sde' || moduleId === 'all') {
      const jobs = getSdeJobs(loc).map(job => ({
        ...job,
        score: scoreJobAgainstProfile(
          [job.roleType, ...job.dsaFocus.split(', ')],
          profile
        ),
        personalizedTip: buildPersonalizedTip(job.title, profile),
      })).sort((a, b) => b.score - a.score);

      return res.json({ success: true, data: { jobs, total: jobs.length, location: loc } });
    }

    if (moduleId === 'resume') {
      const jobs = getResumeJobs(loc).map(job => ({
        ...job,
        score: scoreJobAgainstProfile(job.skills, profile),
        personalizedTip: buildPersonalizedTip(job.title, profile),
      })).sort((a, b) => b.score - a.score);

      return res.json({ success: true, data: { jobs, total: jobs.length, location: loc } });
    }

    if (moduleId === 'govt') {
      const govtJobs = GOVT_ORGS.map(org => ({
        ...org,
        portals: [...org.portals],
        profileMatch: {
          score: scoreGovtJob(org.tags, profile),
          reason: `Based on your profile: ${profile.education}`,
          advantages: profile.skills.slice(0, 3).map(s => `${s} experience`),
          gaps: ['Check age eligibility', 'Verify domicile requirements'],
        },
      }));
      return res.json({ success: true, data: { results: govtJobs, total: govtJobs.length } });
    }

    if (moduleId === 'teach') {
      const opps = getTeachingOpportunities().map(opp => ({
        ...opp,
        score: scoreTeachingOpp(opp.languages, profile),
        personalizedTip: `Your ${profile.experience} of experience makes you credible for teaching ${opp.platform}.`,
      })).sort((a, b) => b.score - a.score);

      return res.json({ success: true, data: { opportunities: opps, total: opps.length } });
    }

    if (moduleId === 'freelance') {
      const opps = getFreelanceOpportunities().map(opp => ({
        ...opp,
        score: scoreJobAgainstProfile(opp.stack, profile),
        personalizedTip: `Match ${opp.platform} with your ${profile.skills.slice(0, 3).join(', ')} skills.`,
      })).sort((a, b) => b.score - a.score);

      return res.json({ success: true, data: { opportunities: opps, total: opps.length } });
    }

    res.status(400).json({ success: false, error: `Unknown moduleId: ${moduleId}` });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to personalize';
    res.status(500).json({ success: false, error: msg });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildPersonalizedTip(jobTitle: string, profile: ParsedProfile): string {
  const matchedSkills = profile.skills.slice(0, 3).join(', ');
  return `Your ${matchedSkills} skills are directly relevant to this ${jobTitle} role.`;
}

function scoreGovtJob(tags: readonly string[], profile: ParsedProfile): number {
  const text = (profile.education + ' ' + profile.skills.join(' ')).toLowerCase();
  let score = 60;
  if (text.includes('b.tech') || text.includes('be ') || text.includes('computer')) score += 15;
  if (text.includes('cs') || text.includes('it ') || text.includes('information')) score += 10;
  if (profile.experience && !profile.experience.includes('fresher')) score += 5;
  return Math.min(90, score);
}

function scoreTeachingOpp(langs: string[], profile: ParsedProfile): number {
  return scoreJobAgainstProfile(langs, profile);
}
