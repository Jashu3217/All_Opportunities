import nodemailer from 'nodemailer';
import { ENV } from '../config/app.config';
import { AlertConfig } from '../models';
import { scanLiveJobs } from './live-scanner.service';

// ─── Email transporter ────────────────────────────────────────────────────────
function getTransporter() {
  return nodemailer.createTransport({
    host:   process.env['SMTP_HOST'] || 'smtp.gmail.com',
    port:   parseInt(process.env['SMTP_PORT'] || '587'),
    secure: false,
    auth: {
      user: process.env['SMTP_USER'] || '',
      pass: process.env['SMTP_PASS'] || '',
    },
  });
}

// ─── Build HTML email ─────────────────────────────────────────────────────────
function buildEmailHTML(jobs: any[], modules: string[], location: string): string {
  const jobCards = jobs.slice(0, 8).map(job => `
    <div style="background:#0a1c38;border:1px solid #2a4f80;border-radius:12px;padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <div>
          <div style="font-size:15px;font-weight:800;color:#e8f4ff;margin-bottom:4px;">${job.title}</div>
          <div style="font-size:12px;color:#8aafd4;">🏢 ${job.company} · 📍 ${job.location}</div>
        </div>
        <div style="background:#00d4ff20;border:1px solid #00d4ff50;border-radius:8px;padding:4px 10px;text-align:center;">
          <div style="font-size:14px;font-weight:800;color:#00d4ff;">${job.matchScore}%</div>
          <div style="font-size:9px;color:#4a7098;">match</div>
        </div>
      </div>
      ${job.salary ? `<div style="font-size:12px;color:#00e676;font-weight:700;margin-bottom:6px;">💰 ${job.salary}</div>` : ''}
      <div style="font-size:11px;color:#8aafd4;margin-bottom:10px;line-height:1.6;">${job.description || ''}</div>
      ${job.matchReason ? `<div style="font-size:11px;color:#00e676;background:#00e67610;border:1px solid #00e67630;border-radius:6px;padding:6px 10px;margin-bottom:10px;">💡 ${job.matchReason}</div>` : ''}
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        ${(job.skills || []).slice(0, 5).map((s: string) => `<span style="font-size:10px;color:#00d4ff;background:#00d4ff15;border:1px solid #00d4ff35;padding:2px 7px;border-radius:12px;font-weight:700;">${s}</span>`).join('')}
      </div>
      <a href="${job.applyUrl}" style="display:inline-block;margin-top:10px;background:linear-gradient(135deg,#00d4ff,#00a8cc);color:#040d1a;font-size:12px;font-weight:800;padding:7px 16px;border-radius:8px;text-decoration:none;">
        🚀 Apply Now →
      </a>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#040d1a;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:28px;font-weight:900;color:#e8f4ff;letter-spacing:-0.03em;">
        ⚡ OpportunityOS
      </div>
      <div style="font-size:13px;color:#4a7098;margin-top:4px;">
        Your daily job digest · ${new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
      </div>
    </div>

    <!-- Summary -->
    <div style="background:#071428;border:1px solid #1a3560;border-radius:12px;padding:16px 20px;margin-bottom:20px;text-align:center;">
      <div style="font-size:32px;font-weight:900;color:#00d4ff;">${jobs.length}</div>
      <div style="font-size:13px;color:#8aafd4;">new live jobs found today matching your profile</div>
      <div style="font-size:11px;color:#4a7098;margin-top:4px;">Location: ${location} · Modules: ${modules.join(', ')}</div>
    </div>

    <!-- Jobs -->
    ${jobCards}

    <!-- CTA -->
    <div style="text-align:center;margin-top:24px;margin-bottom:24px;">
      <a href="${process.env['CLIENT_ORIGIN'] || 'https://all-opportunities-ocncqj2q7-opp4.vercel.app'}" 
         style="background:linear-gradient(135deg,#00d4ff,#00a8cc);color:#040d1a;font-size:14px;font-weight:800;padding:12px 28px;border-radius:10px;text-decoration:none;display:inline-block;">
        🎯 Open OpportunityOS
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;font-size:11px;color:#4a7098;border-top:1px solid #1a3560;padding-top:16px;">
      OpportunityOS · Built for Jaswanth Chelemilla · SDE-2 · Hyderabad<br>
      <a href="${process.env['CLIENT_ORIGIN']}/alerts/unsubscribe" style="color:#4a7098;">Unsubscribe</a>
    </div>
  </div>
</body>
</html>`;
}

// ─── Send daily digest ────────────────────────────────────────────────────────
export async function sendDailyDigest(config: any): Promise<boolean> {
  if (!process.env['SMTP_USER'] || !process.env['SMTP_PASS']) {
    console.warn('⚠️  SMTP not configured — skipping email');
    return false;
  }

  try {
    const allJobs: any[] = [];
    const modules = config.modules || ['sde', 'resume'];

    for (const moduleId of modules) {
      const result = await scanLiveJobs(moduleId, config.location || 'hyderabad');
      const topJobs = result.jobs
        .filter(j => j.matchScore >= (config.minScore || 75))
        .slice(0, 4);
      allJobs.push(...topJobs);
    }

    if (allJobs.length === 0) return false;

    // Sort by match score
    allJobs.sort((a, b) => b.matchScore - a.matchScore);

    const transporter = getTransporter();
    await transporter.sendMail({
      from:    `"OpportunityOS" <${process.env['SMTP_USER']}>`,
      to:      config.email,
      subject: `⚡ ${allJobs.length} Live Jobs Found Today — OpportunityOS`,
      html:    buildEmailHTML(allJobs, modules, config.location),
    });

    // Update lastSentAt
    await AlertConfig.findByIdAndUpdate(config._id, { lastSentAt: new Date() });
    console.log(`✅ Daily digest sent to ${config.email} (${allJobs.length} jobs)`);
    return true;

  } catch (err) {
    console.error('❌ Email send failed:', err);
    return false;
  }
}

// ─── Setup / update alert ─────────────────────────────────────────────────────
export async function setupAlert(
  email: string,
  modules: string[],
  location: string,
  minScore: number
): Promise<any> {
  const config = await AlertConfig.findOneAndUpdate(
    { email },
    { email, enabled: true, modules, location, minScore, schedule: '0 9 * * *' },
    { upsert: true, new: true }
  );
  return config;
}

export async function getAllAlerts(): Promise<any[]> {
  return AlertConfig.find({ enabled: true });
}

export async function disableAlert(email: string): Promise<void> {
  await AlertConfig.findOneAndUpdate({ email }, { enabled: false });
}
