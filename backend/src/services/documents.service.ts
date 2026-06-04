import Anthropic from '@anthropic-ai/sdk';
import { ENV } from '../config/app.config';
import { ParsedProfile } from './resume.service';
import { LiveJob } from './live-scanner.service';

const client = new Anthropic({ apiKey: ENV.ANTHROPIC_API_KEY });

export interface TailoredCV {
  candidateName:  string;
  targetRole:     string;
  company:        string;
  summary:        string;
  skills:         string[];
  experience:     { title: string; company: string; duration: string; bullets: string[] }[];
  education:      string;
  achievements:   string[];
  keywordsAdded:  string[];
  atsScore:       number;
  tips:           string[];
}

export interface CoverLetter {
  subject:    string;
  greeting:   string;
  opening:    string;
  body:       string;
  closing:    string;
  signature:  string;
  fullText:   string;
}

export interface InterviewPrep {
  jobTitle:    string;
  company:     string;
  likelyTopics:string[];
  starAnswers: { question: string; situation: string; task: string; action: string; result: string }[];
  technicalQs: { question: string; answer: string }[];
  companyResearch: string;
  salaryAdvice:string;
  questionsToAsk: string[];
}

// ─── Tailor CV for a specific job ────────────────────────────────────────────
export async function tailorCV(profile: ParsedProfile, job: LiveJob): Promise<TailoredCV> {
  const prompt = `You are an expert CV writer. Tailor this candidate's CV for the specific job below.

CANDIDATE PROFILE:
Name: ${profile.name}
Title: ${profile.title}
Experience: ${profile.experience}
Education: ${profile.education}
Skills: ${profile.skills.join(', ')}
Achievements: ${profile.achievements?.join('; ')}
Companies: ${profile.companies?.join(', ')}
Summary: ${profile.summary}

TARGET JOB:
Title: ${job.title}
Company: ${job.company}
Required Skills: ${job.skills?.join(', ')}
Description: ${job.description}
Match Reason: ${job.matchReason}

TASK: Create a tailored CV that:
1. Rewrites the summary to target this specific role at ${job.company}
2. Reorders skills to put most relevant ones first
3. Rewrites experience bullets to emphasize skills matching this job
4. Highlights achievements most relevant to this role
5. Adds keywords from the job description naturally
6. Calculates ATS match score

Return ONLY valid JSON, no markdown:
{
  "candidateName": "${profile.name}",
  "targetRole": "${job.title}",
  "company": "${job.company}",
  "summary": "tailored 3-sentence professional summary",
  "skills": ["reordered skills list with job-relevant ones first"],
  "experience": [
    {
      "title": "job title",
      "company": "company name", 
      "duration": "dates",
      "bullets": ["tailored bullet 1", "tailored bullet 2", "tailored bullet 3"]
    }
  ],
  "education": "education string",
  "achievements": ["most relevant achievements for this job"],
  "keywordsAdded": ["keywords from job description added to CV"],
  "atsScore": 85,
  "tips": ["tip to further improve this application"]
}`;

  const response = await client.messages.create({
    model:     'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages:  [{ role: 'user', content: prompt }],
  });

  const text = response.content.filter(b => b.type === 'text').map(b => (b as any).text).join('');
  const json = text.match(/\{[\s\S]*\}/);
  if (!json) throw new Error('Failed to generate CV');
  return JSON.parse(json[0]) as TailoredCV;
}

// ─── Generate cover letter ────────────────────────────────────────────────────
export async function generateCoverLetter(profile: ParsedProfile, job: LiveJob): Promise<CoverLetter> {
  const prompt = `You are an expert cover letter writer. Write a compelling cover letter.

CANDIDATE:
Name: ${profile.name}
Title: ${profile.title}  
Experience: ${profile.experience}
Top Skills: ${profile.skills.slice(0, 6).join(', ')}
Key Achievement: ${profile.achievements?.[0] || 'Strong technical background'}
Summary: ${profile.summary}

JOB:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description: ${job.description}
Required Skills: ${job.skills?.join(', ')}

Write a professional, authentic cover letter that:
1. Opens with a strong hook (NOT "I am applying for...")
2. Connects candidate's specific achievements to this role
3. Shows genuine interest in ${job.company} specifically
4. Uses metrics and specifics from the candidate's background
5. Is concise — max 4 paragraphs
6. Ends with a confident call to action

Return ONLY valid JSON:
{
  "subject": "Application for ${job.title} at ${job.company}",
  "greeting": "Dear Hiring Team at ${job.company},",
  "opening": "strong opening paragraph",
  "body": "2 middle paragraphs showing fit",
  "closing": "closing paragraph with call to action",
  "signature": "Best regards,\\n${profile.name}",
  "fullText": "complete formatted cover letter"
}`;

  const response = await client.messages.create({
    model:     'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages:  [{ role: 'user', content: prompt }],
  });

  const text = response.content.filter(b => b.type === 'text').map(b => (b as any).text).join('');
  const json = text.match(/\{[\s\S]*\}/);
  if (!json) throw new Error('Failed to generate cover letter');
  return JSON.parse(json[0]) as CoverLetter;
}

// ─── Generate interview prep ──────────────────────────────────────────────────
export async function generateInterviewPrep(profile: ParsedProfile, job: LiveJob): Promise<InterviewPrep> {
  const prompt = `You are an expert interview coach. Prepare this candidate for an interview.

CANDIDATE:
Name: ${profile.name}
Experience: ${profile.experience}
Skills: ${profile.skills.join(', ')}
Achievements: ${profile.achievements?.join('; ')}
Companies worked at: ${profile.companies?.join(', ')}

JOB:
Title: ${job.title}
Company: ${job.company}
Required Skills: ${job.skills?.join(', ')}
Description: ${job.description}
Interview Process: ${job.interviewProcess || 'Standard tech interview'}

Generate comprehensive interview prep. Return ONLY valid JSON:
{
  "jobTitle": "${job.title}",
  "company": "${job.company}",
  "likelyTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "starAnswers": [
    {
      "question": "Tell me about a time you improved system performance",
      "situation": "specific situation from candidate's experience",
      "task": "what they needed to do",
      "action": "specific actions they took using their skills",
      "result": "quantified result"
    }
  ],
  "technicalQs": [
    {
      "question": "likely technical question for this role",
      "answer": "ideal answer based on candidate's background"
    }
  ],
  "companyResearch": "key things to know about ${job.company}",
  "salaryAdvice": "salary negotiation advice for this role and experience level",
  "questionsToAsk": ["smart question to ask interviewer 1", "question 2", "question 3"]
}

Generate 3 STAR answers and 5 technical questions highly specific to this role.`;

  const response = await client.messages.create({
    model:     'claude-sonnet-4-20250514',
    max_tokens: 2500,
    messages:  [{ role: 'user', content: prompt }],
  });

  const text = response.content.filter(b => b.type === 'text').map(b => (b as any).text).join('');
  const json = text.match(/\{[\s\S]*\}/);
  if (!json) throw new Error('Failed to generate interview prep');
  return JSON.parse(json[0]) as InterviewPrep;
}
