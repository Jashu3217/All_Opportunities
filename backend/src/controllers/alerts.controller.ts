import { Request, Response } from 'express';
import cron from 'node-cron';
import { setupAlert, sendDailyDigest, getAllAlerts, disableAlert } from '../services/alerts.service';

// ─── Setup job alerts ─────────────────────────────────────────────────────────
export async function createAlert(req: Request, res: Response) {
  try {
    const { email, modules, location, minScore } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });

    const config = await setupAlert(
      email,
      modules || ['sde', 'resume'],
      location || 'hyderabad',
      minScore || 75
    );

    res.json({
      success: true,
      data: config,
      message: `✅ Daily job alerts set up for ${email}. You'll receive emails at 9AM IST with live jobs.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed' });
  }
}

// ─── Unsubscribe ──────────────────────────────────────────────────────────────
export async function unsubscribeAlert(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });
    await disableAlert(email);
    res.json({ success: true, message: 'Unsubscribed from job alerts' });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed' });
  }
}

// ─── Send test email ──────────────────────────────────────────────────────────
export async function sendTestAlert(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });

    const config = await setupAlert(email, ['sde', 'resume'], 'hyderabad', 70);
    const sent = await sendDailyDigest(config);

    res.json({
      success: true,
      message: sent
        ? `✅ Test email sent to ${email}! Check your inbox.`
        : `⚠️ Email not sent — SMTP not configured on server. Add SMTP_USER and SMTP_PASS to Railway variables.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Failed' });
  }
}

// ─── Start cron scheduler ─────────────────────────────────────────────────────
export function startAlertScheduler() {
  // Run at 9:00 AM IST (3:30 AM UTC)
  cron.schedule('30 3 * * *', async () => {
    console.log('⏰ Running daily job alert cron...');
    try {
      const alerts = await getAllAlerts();
      console.log(`📧 Sending alerts to ${alerts.length} subscribers`);
      for (const alert of alerts) {
        await sendDailyDigest(alert);
      }
    } catch (err) {
      console.error('Cron error:', err);
    }
  }, { timezone: 'UTC' });

  console.log('✅ Alert scheduler started — daily at 9AM IST');
}
