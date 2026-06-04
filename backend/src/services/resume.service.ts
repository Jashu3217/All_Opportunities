import Anthropic from '@anthropic-ai/sdk';
import * as pdfParseLib from 'pdf-parse';
const pdfParse = (pdfParseLib as any).default || pdfParseLib;
import { ENV } from '../config/app.config';

const client = new Anthropic({ apiKey: ENV.ANTHROPIC_API_KEY });

export interface ParsedProfile {
  name:         string;
  email:        string;
  phone:        string;
  location:     string;
  title:        string;
  experience:   string;
  education:    string;
  skills:       string[];
  achievements: string[];
  companies:    string[];
  rawText:      string;
  summary:      string;
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

export async function parseResumeWithAI(resumeText: string): Promise<ParsedProfile> {
  const systemPrompt = `You are a resume parser. Extract structured information from resume text.
Return ONLY valid JSON, no markdown, no backticks, no extra text.`;

  const userPrompt = `Parse this resume and extract all key information.

RESUME TEXT:
${resumeText.substring(0, 6000)}

Return this exact JSON structure:
{
  "name": "full name",
  "email": "email address or empty string",
  "phone": "phone number or empty string",
  "location": "city, state or empty string",
  "title": "current/target job title like SDE-2, Frontend Engineer etc",
  "experience": "X years or fresher",
  "education": "degree, college, year, CGPA if mentioned",
  "skills": ["skill1", "skill2"],
  "achievements": ["achievement1 with metrics if available"],
  "companies": ["company1", "company2"],
  "summary": "2-3 sentence professional summary based on resume",
  "rawText": ""
}

Extract ALL skills mentioned — frameworks, tools, cloud, databases, languages.`;

  const response = await client.messages.create({
    model:     'claude-sonnet-4-20250514',
    max_tokens: 1200,
    system:    systemPrompt,
    messages:  [{ role: 'user', content: userPrompt }],
  });

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('');

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse resume');

  const parsed = JSON.parse(jsonMatch[0]) as ParsedProfile;
  parsed.rawText = resumeText.substring(0, 2000);
  return parsed;
}

export function scoreJobAgainstProfile(jobSkills: string[], profile: ParsedProfile): number {
  if (!profile.skills || profile.skills.length === 0) return 75;
  const profileSkillsLower = profile.skills.map(s => s.toLowerCase());
  const matches = jobSkills.filter(s =>
    profileSkillsLower.some(ps => ps.includes(s.toLowerCase()) || s.toLowerCase().includes(ps))
  );
  return Math.min(95, 60 + Math.round((matches.length / Math.max(jobSkills.length, 1)) * 35));
}
