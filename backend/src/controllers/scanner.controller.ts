import { Request, Response } from 'express';
import { scanLiveJobs } from '../services/live-scanner.service';
import { tailorCV, generateCoverLetter, generateInterviewPrep } from '../services/documents.service';
import { cacheGet, cacheSet } from '../config/redis';
import { ParsedProfile } from '../services/resume.service';

function getStr(val: unknown, fallback = ''): string {
  if (typeof val === 'string') return val;
  if (Array.isArray(val) && typeof val[0] === 'string') return val[0];
  return fallback;
}

export async function scanModule(req: Request, res: Response) {
  const moduleId     = getStr(req.params['moduleId'], 'sde');
  const location     = getStr(req.query['location'], 'hyderabad');
  const forceRefresh = req.query['refresh'] === 'true';

  let profile: ParsedProfile | undefined;
  try {
    const raw = getStr(req.query['profile']);
    if (raw) profile = JSON.parse(decodeURIComponent(raw));
  } catch { /* no profile */ }

  const cacheKey = `live:${moduleId}:${location}:${profile?.name || 'default'}`;

  if (!forceRefresh) {
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });
  }

  const logs: string[] = [];
  const result = await scanLiveJobs(moduleId, location, profile, (msg) => logs.push(msg));
  await cacheSet(cacheKey, result, 7200);
  res.json({ success: true, data: result, cached: false });
}

export async function tailorCVForJob(req: Request, res: Response) {
  const { profile, job } = req.body as { profile: ParsedProfile; job: any };
  if (!profile || !job) return res.status(400).json({ success: false, error: 'profile and job required' });
  try {
    const cv = await tailorCV(profile, job);
    res.json({ success: true, data: cv });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed' });
  }
}

export async function generateCoverLetterForJob(req: Request, res: Response) {
  const { profile, job } = req.body as { profile: ParsedProfile; job: any };
  if (!profile || !job) return res.status(400).json({ success: false, error: 'profile and job required' });
  try {
    const letter = await generateCoverLetter(profile, job);
    res.json({ success: true, data: letter });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed' });
  }
}

export async function generateInterviewPrepForJob(req: Request, res: Response) {
  const { profile, job } = req.body as { profile: ParsedProfile; job: any };
  if (!profile || !job) return res.status(400).json({ success: false, error: 'profile and job required' });
  try {
    const prep = await generateInterviewPrep(profile, job);
    res.json({ success: true, data: prep });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed' });
  }
}
