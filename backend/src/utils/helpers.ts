import { LocationKey } from '../types';
import { LOCATIONS } from '../config/app.config';

export function buildSearchUrls(keyword: string, locationKey: LocationKey): Record<string, string> {
  const loc  = LOCATIONS[locationKey];
  const k    = encodeURIComponent(keyword);
  const slug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return {
    naukri:   `https://www.naukri.com/${slug}-jobs-in-${loc.naukri}`,
    linkedin: `https://www.linkedin.com/jobs/search/?keywords=${k}&location=${loc.linkedin}&f_TPR=r604800&sortBy=DD`,
    indeed:   `https://in.indeed.com/jobs?q=${k}&l=${loc.indeed}&sort=date`,
    cutshort: `https://cutshort.io/jobs?q=${k}`,
    wellfound:`https://wellfound.com/jobs?q=${k}`,
    instahyre:`https://www.instahyre.com/search-jobs/?q=${k}`,
    google:   `https://www.google.com/search?q=${k}+jobs+${loc.label}`,
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function sanitizeJson(raw: string): string {
  return raw.replace(/```json|```/g, '').trim();
}

export function extractJson(text: string): unknown | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}
