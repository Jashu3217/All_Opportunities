import { Request, Response } from 'express';
import { Application, AppStatus } from '../models';

// ─── Add job to tracker ───────────────────────────────────────────────────────
export async function addApplication(req: Request, res: Response) {
  try {
    const { jobId, jobTitle, company, location, salary, applyUrl, sourceUrl, source, skills, matchScore, moduleId } = req.body;

    if (!jobId || !jobTitle || !company) {
      return res.status(400).json({ success: false, error: 'jobId, jobTitle and company required' });
    }

    // Upsert — if already exists, just return it
    const existing = await Application.findOne({ jobId });
    if (existing) {
      return res.json({ success: true, data: existing, message: 'Already in tracker' });
    }

    const app = await Application.create({
      jobId, jobTitle, company, location: location || '',
      salary: salary || '', applyUrl: applyUrl || '',
      sourceUrl: sourceUrl || '', source: source || '',
      skills: skills || [], matchScore: matchScore || 0,
      moduleId: moduleId || 'sde', status: 'saved',
    });

    res.json({ success: true, data: app, message: 'Added to tracker' });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed' });
  }
}

// ─── Get all applications ─────────────────────────────────────────────────────
export async function getApplications(req: Request, res: Response) {
  try {
    const { status, moduleId } = req.query;
    const filter: Record<string, unknown> = {};
    if (status && status !== 'all') filter['status'] = status;
    if (moduleId && moduleId !== 'all') filter['moduleId'] = moduleId;

    const apps = await Application.find(filter).sort({ updatedAt: -1 });
    res.json({ success: true, data: { applications: apps, total: apps.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed' });
  }
}

// ─── Update application status / notes ───────────────────────────────────────
export async function updateApplication(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, notes, nextAction, interviewAt, appliedAt } = req.body;

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (status)      update['status']      = status;
    if (notes !== undefined) update['notes'] = notes;
    if (nextAction !== undefined) update['nextAction'] = nextAction;
    if (interviewAt) update['interviewAt'] = new Date(interviewAt);
    if (appliedAt)   update['appliedAt']   = new Date(appliedAt);

    // Auto-set appliedAt when status changes to applied
    if (status === 'applied' && !appliedAt) update['appliedAt'] = new Date();

    const app = await Application.findByIdAndUpdate(id, update, { new: true });
    if (!app) return res.status(404).json({ success: false, error: 'Application not found' });

    res.json({ success: true, data: app });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed' });
  }
}

// ─── Delete application ───────────────────────────────────────────────────────
export async function deleteApplication(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await Application.findByIdAndDelete(id);
    res.json({ success: true, message: 'Removed from tracker' });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed' });
  }
}

// ─── Get tracker stats ────────────────────────────────────────────────────────
export async function getTrackerStats(req: Request, res: Response) {
  try {
    const statuses: AppStatus[] = ['saved', 'applied', 'interview', 'offer', 'rejected', 'ghosted'];
    const counts: Record<string, number> = {};

    for (const s of statuses) {
      counts[s] = await Application.countDocuments({ status: s });
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const recentApps = await Application.find({ status: 'applied' })
      .sort({ appliedAt: -1 }).limit(5);
    const upcomingInterviews = await Application.find({
      status: 'interview',
      interviewAt: { $gte: new Date() },
    }).sort({ interviewAt: 1 }).limit(5);

    // Response rate
    const applied     = counts['applied'] + counts['interview'] + counts['offer'] + counts['rejected'];
    const responded   = counts['interview'] + counts['offer'] + counts['rejected'];
    const responseRate = applied > 0 ? Math.round((responded / applied) * 100) : 0;

    res.json({
      success: true,
      data: {
        counts, total, responseRate,
        recentApps, upcomingInterviews,
        pipeline: [
          { stage: 'Saved',     count: counts['saved'],     color: '#8aafd4' },
          { stage: 'Applied',   count: counts['applied'],   color: '#00d4ff' },
          { stage: 'Interview', count: counts['interview'], color: '#ffb800' },
          { stage: 'Offer',     count: counts['offer'],     color: '#00e676' },
          { stage: 'Rejected',  count: counts['rejected'],  color: '#ff4081' },
          { stage: 'Ghosted',   count: counts['ghosted'],   color: '#4a7098' },
        ],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed' });
  }
}
