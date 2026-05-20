import { Request, Response } from 'express';
import { cacheGet, cacheSet, cacheDel } from '../config/redis';
import { fetchAllGovtOrgs, fetchGovtOrg } from '../services/ai.service';
import { getSdeJobs, getResumeJobs, getTeachingOpportunities, getFreelanceOpportunities } from '../services/data.service';
import { GovtCache, SearchHistory } from '../models';
import { GOVT_ORGS, ENV } from '../config/app.config';
import { LocationKey, ApiResponse } from '../types';

// ─── Helper ───────────────────────────────────────────────────────────────────
function loc(req: Request): LocationKey {
  const l = req.query.location as string;
  const valid: LocationKey[] = ['hyderabad','remote','bangalore','pan_india','global'];
  return valid.includes(l as LocationKey) ? (l as LocationKey) : 'hyderabad';
}

async function trackSearch(moduleId: string, location: string, count: number) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (SearchHistory as any).create({ moduleId, location, resultCount: count });
  } catch { /* non-critical */ }
}

// ─── SDE Module ───────────────────────────────────────────────────────────────
export async function getSdeModule(req: Request, res: Response) {
  const location = loc(req);
  const cacheKey = `sde:${location}`;

  const cached = await cacheGet(cacheKey);
  if (cached) {
    return res.json({ success:true, data:cached, cached:true } as ApiResponse<unknown>);
  }

  const jobs = getSdeJobs(location);
  await cacheSet(cacheKey, { jobs, total:jobs.length, location }, ENV.TECH_CACHE_TTL);
  await trackSearch('sde', location, jobs.length);

  res.json({ success:true, data:{ jobs, total:jobs.length, location }, cached:false } as ApiResponse<unknown>);
}

// ─── Resume Module ────────────────────────────────────────────────────────────
export async function getResumeModule(req: Request, res: Response) {
  const location = loc(req);
  const cacheKey = `resume:${location}`;

  const cached = await cacheGet(cacheKey);
  if (cached) {
    return res.json({ success:true, data:cached, cached:true } as ApiResponse<unknown>);
  }

  const jobs = getResumeJobs(location);
  await cacheSet(cacheKey, { jobs, total:jobs.length, location }, ENV.TECH_CACHE_TTL);
  await trackSearch('resume', location, jobs.length);

  res.json({ success:true, data:{ jobs, total:jobs.length, location }, cached:false } as ApiResponse<unknown>);
}

// ─── Govt Module — AI live fetch ──────────────────────────────────────────────
export async function getGovtModule(req: Request, res: Response) {
  const forceRefresh = req.query.refresh === 'true';
  const cacheKey = 'govt:all';

  if (!forceRefresh) {
    // 1. Check Redis
    const redisCache = await cacheGet(cacheKey);
    if (redisCache) {
      return res.json({ success:true, data:redisCache, cached:true } as ApiResponse<unknown>);
    }
    // 2. Check MongoDB
    try {
      const dbCached = await GovtCache.find().lean();
      if (dbCached.length === GOVT_ORGS.length) {
        const results = dbCached.map(d => ({
          ...GOVT_ORGS.find(o => o.id === d.orgId),
          fetched: d.fetched,
          fetchedAt: d.fetchedAt.toISOString(),
        }));
        const payload = { results, total:results.length, scannedAt: new Date().toISOString() };
        await cacheSet(cacheKey, payload, 3600); // re-cache in Redis for 1h
        return res.json({ success:true, data:payload, cached:true } as ApiResponse<unknown>);
      }
    } catch { /* fall through to fresh fetch */ }
  }

  // 3. Fresh AI fetch
  const logs: string[] = [];
  const results = await fetchAllGovtOrgs(
    undefined,
    (msg) => logs.push(msg)
  );

  // Persist to MongoDB
  try {
    for (const r of results) {
      if (r.fetched) {
        await GovtCache.findOneAndUpdate(
          { orgId: r.id },
          { orgId: r.id, org: r.org, fetched: r.fetched, fetchedAt: new Date() },
          { upsert: true, new: true }
        );
      }
    }
  } catch { /* non-critical */ }

  const payload = { results, total:results.length, scannedAt: new Date().toISOString(), logs };
  await cacheSet(cacheKey, payload, ENV.GOVT_CACHE_TTL);
  await trackSearch('govt', 'india', results.length);

  res.json({ success:true, data:payload, cached:false } as ApiResponse<unknown>);
}

// ─── Govt — single org refresh ────────────────────────────────────────────────
export async function refreshGovtOrg(req: Request, res: Response) {
  const { orgId } = req.params;
  const orgConfig = GOVT_ORGS.find(o => o.id === orgId);
  if (!orgConfig) {
    return res.status(404).json({ success:false, error:'Organisation not found' });
  }

  const logs: string[] = [];
  const result = await fetchGovtOrg(orgConfig, (msg) => logs.push(msg));

  // Update DB
  try {
    if (result.fetched) {
      await GovtCache.findOneAndUpdate(
        { orgId },
        { orgId, org: result.org, fetched: result.fetched, fetchedAt: new Date() },
        { upsert: true }
      );
    }
  } catch { /* non-critical */ }

  // Invalidate full cache
  await cacheDel('govt:all');

  res.json({ success:true, data:{ result, logs }, cached:false } as ApiResponse<unknown>);
}

// ─── Teaching Module ──────────────────────────────────────────────────────────
export async function getTeachModule(_req: Request, res: Response) {
  const cacheKey = 'teach:all';
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json({ success:true, data:cached, cached:true });

  const opportunities = getTeachingOpportunities();
  const payload = { opportunities, total: opportunities.length };
  await cacheSet(cacheKey, payload, ENV.TEACH_CACHE_TTL);
  await trackSearch('teach', 'global', opportunities.length);

  res.json({ success:true, data:payload, cached:false });
}

// ─── Freelance Module ─────────────────────────────────────────────────────────
export async function getFreelanceModule(_req: Request, res: Response) {
  const cacheKey = 'freelance:all';
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json({ success:true, data:cached, cached:true });

  const opportunities = getFreelanceOpportunities();
  const payload = { opportunities, total: opportunities.length };
  await cacheSet(cacheKey, payload, ENV.FREELANCE_CACHE_TTL);
  await trackSearch('freelance', 'global', opportunities.length);

  res.json({ success:true, data:payload, cached:false });
}

// ─── Health ───────────────────────────────────────────────────────────────────
export async function getHealth(_req: Request, res: Response) {
  res.json({ success:true, data:{ status:'ok', version:'1.0.0', timestamp: new Date().toISOString() } });
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export async function getStats(_req: Request, res: Response) {
  try {
    const stats = await SearchHistory.aggregate([
      { $group: { _id:'$moduleId', count:{ $sum:1 }, lastRun:{ $max:'$createdAt' } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success:true, data:{ modules: stats } });
  } catch {
    res.json({ success:true, data:{ modules:[] } });
  }
}
