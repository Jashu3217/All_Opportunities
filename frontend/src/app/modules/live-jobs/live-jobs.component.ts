import { Component, OnInit, signal, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ResumeUploadComponent, ParsedProfile } from '../../shared/components/resume-upload/resume-upload.component';

interface LiveJob {
  id:          string;
  title:       string;
  company:     string;
  location:    string;
  salary:      string;
  experience:  string;
  skills:      string[];
  postedDate:  string;
  applyUrl:    string;
  sourceUrl:   string;
  source:      string;
  description: string;
  matchScore:  number;
  matchReason: string;
  isActive:    boolean;
  deadline:    string | null;
  interviewProcess: string;
}

@Component({
  selector: 'app-live-jobs',
  standalone: true,
  imports: [CommonModule, ResumeUploadComponent],
  template: `
    <div class="live-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <span class="module-icon">{{ icon }}</span>
          <div>
            <h1>{{ title }}</h1>
            <p>{{ jobs().length }} live jobs · AI scans real job boards · Updated {{ lastScanned() }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="scan-btn" (click)="scan(false)" [disabled]="scanning()">
            <span *ngIf="!scanning()">🔍 Scan Live Jobs</span>
            <span *ngIf="scanning()">⏳ Scanning...</span>
          </button>
          <button class="refresh-btn" (click)="scan(true)" [disabled]="scanning()">🔄 Fresh Scan</button>
        </div>
      </div>

      <!-- Resume upload -->
      <app-resume-upload (profileParsed)="onProfileParsed($event)" />

      <!-- Scan log -->
      <div class="scan-log" *ngIf="logs().length > 0 && scanning()">
        <div class="log-header"><span class="spin">⟳</span> LIVE SCANNING JOB BOARDS...</div>
        <div *ngFor="let log of logs()" class="log-line"
             [class.ok]="log.startsWith('✓')"
             [class.warn]="log.startsWith('!')">{{ log }}</div>
      </div>

      <!-- No results -->
      <div class="no-results" *ngIf="!scanning() && jobs().length === 0 && hasScanned()">
        <div class="no-icon">🔍</div>
        <div class="no-title">No live jobs found</div>
        <div class="no-sub">Try uploading your resume for better results or click Fresh Scan</div>
        <button class="scan-btn" (click)="scan(true)">🔍 Try Again</button>
      </div>

      <!-- Idle state -->
      <div class="idle-state" *ngIf="!scanning() && jobs().length === 0 && !hasScanned()">
        <div class="idle-icon">{{ icon }}</div>
        <div class="idle-title">Ready to scan live {{ title }}</div>
        <div class="idle-sub">Upload your resume first for personalized results, then click Scan</div>
        <button class="scan-btn" (click)="scan(false)">🔍 Scan Live Jobs Now</button>
      </div>

      <!-- Job cards -->
      <div *ngFor="let job of jobs(); let i = index"
           class="job-card fade-in"
           [style.animation-delay]="i * 50 + 'ms'">

        <!-- Card top -->
        <div class="card-top">
          <div class="card-info">
            <div class="job-title-row">
              <span class="live-badge">🟢 LIVE</span>
              <span class="job-title">{{ job.title }}</span>
              <span class="source-badge">{{ job.source }}</span>
            </div>
            <div class="company-row">
              <span class="company-name">🏢 {{ job.company }}</span>
              <span class="job-location">📍 {{ job.location }}</span>
              <span class="posted-date">🕒 {{ job.postedDate }}</span>
            </div>
            <div class="job-salary" *ngIf="job.salary">💰 {{ job.salary }}</div>
            <div class="job-exp">👤 {{ job.experience }}</div>
          </div>
          <div class="match-score-wrap">
            <div class="match-circle" [style.--score]="job.matchScore">
              <span class="score-num">{{ job.matchScore }}%</span>
              <span class="score-label">match</span>
            </div>
          </div>
        </div>

        <!-- Skills -->
        <div class="skills-row" *ngIf="job.skills?.length">
          <span *ngFor="let s of job.skills.slice(0,6)" class="skill-tag">{{ s }}</span>
        </div>

        <!-- Description -->
        <div class="job-desc">{{ job.description }}</div>

        <!-- Match reason -->
        <div class="match-reason" *ngIf="job.matchReason">
          💡 {{ job.matchReason }}
        </div>

        <!-- Deadline -->
        <div class="deadline" *ngIf="job.deadline">
          ⏰ Apply by: <strong>{{ job.deadline }}</strong>
        </div>

        <!-- Action buttons -->
        <div class="card-actions">
          <!-- Apply button -->
          <a [href]="job.applyUrl" target="_blank" rel="noopener" class="apply-btn">
            🚀 Apply Now ↗
          </a>

          <!-- AI action buttons (only if resume uploaded) -->
          <ng-container *ngIf="profile()">
            <button class="action-btn cv-btn"
                    (click)="openTailorCV(job)"
                    [disabled]="loadingDoc() === 'cv_' + job.id">
              {{ loadingDoc() === 'cv_' + job.id ? '⏳' : '📄' }} Tailor My CV
            </button>
            <button class="action-btn letter-btn"
                    (click)="openCoverLetter(job)"
                    [disabled]="loadingDoc() === 'cl_' + job.id">
              {{ loadingDoc() === 'cl_' + job.id ? '⏳' : '✉️' }} Cover Letter
            </button>
            <button class="action-btn prep-btn"
                    (click)="openInterviewPrep(job)"
                    [disabled]="loadingDoc() === 'ip_' + job.id">
              {{ loadingDoc() === 'ip_' + job.id ? '⏳' : '🎤' }} Interview Prep
            </button>
          <button class="action-btn save-btn"
                  (click)="saveToTracker(job)"
                  [disabled]="savedJobs()[job.id]">
            {{ savedJobs()[job.id] ? '✅ Saved' : '📋 Save to Tracker' }}
          </button>
          </ng-container>
        </div>
      </div>

      <!-- ── DOCUMENT MODAL ── -->
      <div class="modal-overlay" *ngIf="modalData()" (click)="closeModal()">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <span class="modal-title">{{ modalData()!.title }}</span>
            <button class="modal-close" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">

            <!-- Tailored CV -->
            <ng-container *ngIf="modalData()!.type === 'cv'">
              <div class="cv-ats">ATS Score: <strong>{{ modalData()!.data.atsScore }}%</strong></div>
              <div class="cv-section">
                <div class="cv-label">TAILORED SUMMARY</div>
                <div class="cv-text">{{ modalData()!.data.summary }}</div>
              </div>
              <div class="cv-section">
                <div class="cv-label">TOP SKILLS (reordered for this job)</div>
                <div class="skills-row">
                  <span *ngFor="let s of modalData()!.data.skills?.slice(0,10)" class="skill-tag">{{ s }}</span>
                </div>
              </div>
              <div class="cv-section" *ngIf="modalData()!.data.keywordsAdded?.length">
                <div class="cv-label">KEYWORDS ADDED FROM JOB DESCRIPTION</div>
                <div class="skills-row">
                  <span *ngFor="let k of modalData()!.data.keywordsAdded" class="keyword-tag">+{{ k }}</span>
                </div>
              </div>
              <div class="cv-section" *ngIf="modalData()!.data.tips?.length">
                <div class="cv-label">TIPS TO IMPROVE</div>
                <div *ngFor="let t of modalData()!.data.tips" class="tip-item">💡 {{ t }}</div>
              </div>
            </ng-container>

            <!-- Cover Letter -->
            <ng-container *ngIf="modalData()!.type === 'cl'">
              <div class="letter-subject">Subject: {{ modalData()!.data.subject }}</div>
              <div class="letter-body">{{ modalData()!.data.fullText }}</div>
            </ng-container>

            <!-- Interview Prep -->
            <ng-container *ngIf="modalData()!.type === 'ip'">
              <div class="prep-section">
                <div class="prep-label">📚 LIKELY INTERVIEW TOPICS</div>
                <div class="topics-row">
                  <span *ngFor="let t of modalData()!.data.likelyTopics" class="topic-tag">{{ t }}</span>
                </div>
              </div>
              <div class="prep-section" *ngFor="let star of modalData()!.data.starAnswers">
                <div class="prep-label">⭐ {{ star.question }}</div>
                <div class="star-item"><span class="star-key">Situation:</span> {{ star.situation }}</div>
                <div class="star-item"><span class="star-key">Task:</span> {{ star.task }}</div>
                <div class="star-item"><span class="star-key">Action:</span> {{ star.action }}</div>
                <div class="star-item"><span class="star-key">Result:</span> {{ star.result }}</div>
              </div>
              <div class="prep-section" *ngIf="modalData()!.data.technicalQs?.length">
                <div class="prep-label">💻 TECHNICAL QUESTIONS</div>
                <div *ngFor="let q of modalData()!.data.technicalQs" class="tech-q">
                  <div class="tech-question">Q: {{ q.question }}</div>
                  <div class="tech-answer">A: {{ q.answer }}</div>
                </div>
              </div>
              <div class="prep-section" *ngIf="modalData()!.data.questionsToAsk?.length">
                <div class="prep-label">🙋 QUESTIONS TO ASK INTERVIEWER</div>
                <div *ngFor="let q of modalData()!.data.questionsToAsk" class="ask-q">→ {{ q }}</div>
              </div>
              <div class="prep-section" *ngIf="modalData()!.data.salaryAdvice">
                <div class="prep-label">💰 SALARY ADVICE</div>
                <div class="salary-advice">{{ modalData()!.data.salaryAdvice }}</div>
              </div>
            </ng-container>
          </div>
          <div class="modal-footer">
            <button class="copy-btn" (click)="copyContent()">📋 Copy Content</button>
            <button class="modal-close-btn" (click)="closeModal()">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; gap:12px; flex-wrap:wrap; }
    .header-left { display:flex; align-items:center; gap:12px; }
    .module-icon { font-size:28px; }
    h1 { font-size:20px; font-weight:800; color:#e8f4ff; margin:0 0 4px; }
    h1+p { font-size:12px; color:#4a7098; margin:0; }
    .header-actions { display:flex; gap:8px; flex-wrap:wrap; }
    .scan-btn { background:linear-gradient(135deg,#00d4ff,#00a8cc); color:#040d1a; border:none; border-radius:10px; padding:9px 18px; font-size:13px; font-weight:700; cursor:pointer; font-family:'Outfit',sans-serif; }
    .scan-btn:disabled { opacity:0.5; cursor:not-allowed; }
    .refresh-btn { background:rgba(0,212,255,0.1); border:1px solid rgba(0,212,255,0.4); color:#00d4ff; border-radius:10px; padding:9px 14px; font-size:12px; font-weight:700; cursor:pointer; font-family:'Outfit',sans-serif; }
    .refresh-btn:disabled { opacity:0.5; }
    .scan-log { background:#040d1a; border:1px solid #1a3560; border-radius:12px; padding:14px 18px; margin-bottom:14px; max-height:160px; overflow-y:auto; }
    .log-header { font-size:11px; color:#00d4ff; font-weight:700; font-family:'Space Mono',monospace; margin-bottom:8px; display:flex; align-items:center; gap:6px; }
    .spin { display:inline-block; animation:spin 1s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .log-line { font-size:11px; font-family:'Space Mono',monospace; color:#4a7098; padding:2px 0; }
    .log-line.ok { color:#00e676; } .log-line.warn { color:#ffb800; }
    .idle-state,.no-results { text-align:center; padding:48px 20px; }
    .idle-icon,.no-icon { font-size:48px; margin-bottom:12px; animation:float 3s ease-in-out infinite; }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
    .idle-title,.no-title { font-size:18px; font-weight:800; color:#e8f4ff; margin-bottom:8px; }
    .idle-sub,.no-sub { font-size:13px; color:#4a7098; margin-bottom:20px; }
    .job-card { background:#071428; border:1px solid #1a3560; border-radius:16px; padding:18px 20px; margin-bottom:10px; animation:fadeUp 0.4s ease both; border-left:3px solid #00d4ff; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    .card-top { display:flex; justify-content:space-between; gap:12px; margin-bottom:10px; }
    .card-info { flex:1; }
    .job-title-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:5px; }
    .live-badge { font-size:9px; color:#00e676; background:rgba(0,230,118,0.15); border:1px solid rgba(0,230,118,0.4); padding:2px 7px; border-radius:20px; font-weight:700; animation:pulse 2s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
    .job-title { font-size:15px; font-weight:800; color:#e8f4ff; }
    .source-badge { font-size:10px; color:#7c4dff; background:rgba(124,77,255,0.15); border:1px solid rgba(124,77,255,0.4); padding:2px 7px; border-radius:20px; font-weight:700; }
    .company-row { display:flex; gap:12px; font-size:12px; color:#8aafd4; margin-bottom:4px; flex-wrap:wrap; }
    .company-name { font-weight:700; color:#e8f4ff; }
    .job-location,.posted-date { color:#4a7098; }
    .job-salary { font-size:13px; color:#00e676; font-weight:700; margin-bottom:3px; }
    .job-exp { font-size:11px; color:#4a7098; margin-bottom:6px; }
    .match-score-wrap { flex-shrink:0; }
    .match-circle { width:56px; height:56px; border-radius:50%; background:conic-gradient(#00d4ff calc(var(--score) * 1%),#1a3560 0); display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; }
    .match-circle::before { content:''; position:absolute; width:44px; height:44px; border-radius:50%; background:#071428; }
    .score-num { font-size:13px; font-weight:800; color:#00d4ff; position:relative; z-index:1; line-height:1; }
    .score-label { font-size:8px; color:#4a7098; position:relative; z-index:1; }
    .skills-row { display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px; }
    .skill-tag { font-size:10px; color:#00d4ff; background:rgba(0,212,255,0.1); border:1px solid rgba(0,212,255,0.3); padding:2px 7px; border-radius:20px; font-weight:700; }
    .job-desc { font-size:12px; color:#8aafd4; line-height:1.7; margin-bottom:6px; }
    .match-reason { font-size:11px; color:#00e676; background:rgba(0,230,118,0.08); border:1px solid rgba(0,230,118,0.2); border-radius:6px; padding:6px 10px; margin-bottom:6px; }
    .deadline { font-size:11px; color:#ff4081; margin-bottom:8px; }
    .card-actions { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
    .apply-btn { display:inline-flex; align-items:center; gap:5px; background:linear-gradient(135deg,#00d4ff,#00a8cc); color:#040d1a; font-size:12px; font-weight:800; padding:7px 16px; border-radius:8px; text-decoration:none; border:none; cursor:pointer; font-family:'Outfit',sans-serif; }
    .action-btn { font-size:11px; font-weight:700; padding:6px 12px; border-radius:8px; cursor:pointer; border:1px solid; font-family:'Outfit',sans-serif; transition:all 0.15s; }
    .action-btn:disabled { opacity:0.5; cursor:not-allowed; }
    .cv-btn { color:#7c4dff; border-color:rgba(124,77,255,0.4); background:rgba(124,77,255,0.1); }
    .letter-btn { color:#ffb800; border-color:rgba(255,184,0,0.4); background:rgba(255,184,0,0.1); }
    .prep-btn { color:#00e676; border-color:rgba(0,230,118,0.4); background:rgba(0,230,118,0.1); }
    .save-btn { color:#f59e0b; border-color:rgba(245,158,11,0.4); background:rgba(245,158,11,0.1); }
    /* Modal */
    .modal-overlay { position:fixed; inset:0; background:rgba(4,13,26,0.85); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
    .modal-box { background:#071428; border:1px solid #2a4f80; border-radius:16px; width:100%; max-width:680px; max-height:85vh; display:flex; flex-direction:column; }
    .modal-header { display:flex; justify-content:space-between; align-items:center; padding:16px 20px; border-bottom:1px solid #1a3560; }
    .modal-title { font-size:15px; font-weight:800; color:#e8f4ff; }
    .modal-close { background:none; border:none; color:#4a7098; font-size:18px; cursor:pointer; }
    .modal-body { flex:1; overflow-y:auto; padding:16px 20px; }
    .modal-footer { display:flex; gap:8px; padding:12px 20px; border-top:1px solid #1a3560; }
    .copy-btn { background:rgba(0,212,255,0.1); border:1px solid rgba(0,212,255,0.4); color:#00d4ff; border-radius:8px; padding:7px 14px; font-size:12px; font-weight:700; cursor:pointer; font-family:'Outfit',sans-serif; }
    .modal-close-btn { background:rgba(255,255,255,0.05); border:1px solid #2a4f80; color:#8aafd4; border-radius:8px; padding:7px 14px; font-size:12px; font-weight:700; cursor:pointer; font-family:'Outfit',sans-serif; }
    .cv-ats { font-size:14px; color:#00e676; font-weight:700; margin-bottom:12px; padding:8px 12px; background:rgba(0,230,118,0.08); border-radius:8px; }
    .cv-section { margin-bottom:14px; }
    .cv-label { font-size:10px; color:#4a7098; font-family:'Space Mono',monospace; font-weight:700; letter-spacing:0.08em; margin-bottom:6px; }
    .cv-text { font-size:13px; color:#e8f4ff; line-height:1.7; }
    .keyword-tag { font-size:10px; color:#00e676; background:rgba(0,230,118,0.1); border:1px solid rgba(0,230,118,0.3); padding:2px 7px; border-radius:20px; font-weight:700; }
    .tip-item { font-size:12px; color:#ffb800; margin-bottom:4px; padding:5px 8px; background:rgba(255,184,0,0.08); border-radius:6px; }
    .letter-subject { font-size:12px; color:#7c4dff; font-weight:700; margin-bottom:12px; }
    .letter-body { font-size:13px; color:#e8f4ff; line-height:1.9; white-space:pre-wrap; }
    .prep-section { margin-bottom:16px; }
    .prep-label { font-size:10px; color:#ffb800; font-family:'Space Mono',monospace; font-weight:700; letter-spacing:0.08em; margin-bottom:8px; }
    .topics-row { display:flex; flex-wrap:wrap; gap:4px; }
    .topic-tag { font-size:11px; color:#7c4dff; background:rgba(124,77,255,0.1); border:1px solid rgba(124,77,255,0.3); padding:3px 9px; border-radius:20px; font-weight:700; }
    .star-item { font-size:12px; color:#8aafd4; margin-bottom:4px; line-height:1.6; }
    .star-key { color:#00e676; font-weight:700; }
    .tech-q { margin-bottom:10px; padding:10px 12px; background:#040d1a; border-radius:8px; border:1px solid #1a3560; }
    .tech-question { font-size:12px; color:#00d4ff; font-weight:700; margin-bottom:4px; }
    .tech-answer { font-size:12px; color:#8aafd4; line-height:1.6; }
    .ask-q { font-size:12px; color:#ffb800; margin-bottom:4px; }
    .salary-advice { font-size:13px; color:#00e676; line-height:1.7; }
    .fade-in { animation:fadeUp 0.4s ease both; }
  `],
})
export class LiveJobsComponent implements OnInit {
  @Input() moduleId = 'sde';
  @Input() title    = 'SDE / SWE / SE Jobs';
  @Input() icon     = '⚡';

  jobs       = signal<LiveJob[]>([]);
  scanning   = signal(false);
  hasScanned = signal(false);
  logs       = signal<string[]>([]);
  lastScanned= signal('never');
  profile    = signal<ParsedProfile | null>(null);
  loadingDoc = signal<string>('');
  modalData  = signal<{ type: string; title: string; data: any } | null>(null);
  savedJobs  = signal<Record<string, boolean>>({});

  private route = inject(ActivatedRoute);
  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Read module config from route data
    const data = this.route.snapshot.data;
    if (data['moduleId']) this.moduleId = data['moduleId'];
    if (data['title'])    this.title    = data['title'];
    if (data['icon'])     this.icon     = data['icon'];
    // Load saved profile
    const saved = localStorage.getItem('oos_resume_profile');
    if (saved) { try { this.profile.set(JSON.parse(saved)); } catch { /**/ } }
  }

  onProfileParsed(p: ParsedProfile) {
    this.profile.set(p);
    // Auto-scan with new profile
    this.scan(true);
  }

  scan(forceRefresh: boolean) {
    this.scanning.set(true);
    this.logs.set([]);
    this.hasScanned.set(true);

    const p = this.profile();
    let url = `${environment.apiUrl}/scan/${this.moduleId}?location=hyderabad&refresh=${forceRefresh}`;
    if (p) url += `&profile=${encodeURIComponent(JSON.stringify(p))}`;

    this.http.get<{ success: boolean; data: any }>(url).subscribe({
      next: (res) => {
        this.scanning.set(false);
        if (res.success && res.data) {
          this.jobs.set(res.data.jobs || []);
          this.logs.set(res.data.logs || []);
          this.lastScanned.set(new Date().toLocaleTimeString('en-IN'));
        }
      },
      error: (err) => {
        this.scanning.set(false);
        this.logs.set([`! Error: ${err.message}`]);
      },
    });
  }

  openTailorCV(job: LiveJob) {
    const p = this.profile();
    if (!p) return;
    this.loadingDoc.set('cv_' + job.id);
    this.http.post<{ success: boolean; data: any }>(
      `${environment.apiUrl}/documents/tailor-cv`, { profile: p, job }
    ).subscribe({
      next: (res) => {
        this.loadingDoc.set('');
        if (res.success) this.modalData.set({ type: 'cv', title: `📄 Tailored CV — ${job.company}`, data: res.data });
      },
      error: () => this.loadingDoc.set(''),
    });
  }

  openCoverLetter(job: LiveJob) {
    const p = this.profile();
    if (!p) return;
    this.loadingDoc.set('cl_' + job.id);
    this.http.post<{ success: boolean; data: any }>(
      `${environment.apiUrl}/documents/cover-letter`, { profile: p, job }
    ).subscribe({
      next: (res) => {
        this.loadingDoc.set('');
        if (res.success) this.modalData.set({ type: 'cl', title: `✉️ Cover Letter — ${job.company}`, data: res.data });
      },
      error: () => this.loadingDoc.set(''),
    });
  }

  openInterviewPrep(job: LiveJob) {
    const p = this.profile();
    if (!p) return;
    this.loadingDoc.set('ip_' + job.id);
    this.http.post<{ success: boolean; data: any }>(
      `${environment.apiUrl}/documents/interview-prep`, { profile: p, job }
    ).subscribe({
      next: (res) => {
        this.loadingDoc.set('');
        if (res.success) this.modalData.set({ type: 'ip', title: `🎤 Interview Prep — ${job.company}`, data: res.data });
      },
      error: () => this.loadingDoc.set(''),
    });
  }

  saveToTracker(job: LiveJob) {
    this.http.post<any>(`${environment.apiUrl}/tracker`, {
      jobId:      job.id,
      jobTitle:   job.title,
      company:    job.company,
      location:   job.location,
      salary:     job.salary,
      applyUrl:   job.applyUrl,
      sourceUrl:  job.sourceUrl,
      source:     job.source,
      skills:     job.skills,
      matchScore: job.matchScore,
      moduleId:   this.moduleId,
    }).subscribe({
      next: (r) => {
        this.savedJobs.update(s => ({ ...s, [job.id]: true }));
        console.log('Saved:', r.message);
      },
      error: (e) => console.error('Save failed:', e),
    });
  }

  closeModal() { this.modalData.set(null); }

  copyContent() {
    const d = this.modalData();
    if (!d) return;
    let text = '';
    if (d.type === 'cl') text = d.data.fullText || '';
    else if (d.type === 'cv') text = `TAILORED CV\n\nSummary: ${d.data.summary}\n\nSkills: ${d.data.skills?.join(', ')}\n\nATS Score: ${d.data.atsScore}%`;
    else if (d.type === 'ip') text = d.data.starAnswers?.map((s: any) => `Q: ${s.question}\nS: ${s.situation}\nT: ${s.task}\nA: ${s.action}\nR: ${s.result}`).join('\n\n') || '';
    navigator.clipboard.writeText(text).catch(() => {});
  }
}
