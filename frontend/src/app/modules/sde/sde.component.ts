import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AppStateService } from '../../core/services/app-state.service';
import { SdeJob } from '../../core/models';
import { ResumeUploadComponent, ParsedProfile } from '../../shared/components/resume-upload/resume-upload.component';

@Component({
  selector: 'app-sde',
  standalone: true,
  imports: [CommonModule, FormsModule, ResumeUploadComponent],
  template: `
    <div class="module-page">
      <div class="module-header">
        <div class="module-title">
          <span class="module-icon">⚡</span>
          <div>
            <h1>SDE / SWE / SE Jobs</h1>
            <p>{{ total() }} roles · {{ state.locationLabel() }} · {{ profile() ? 'Personalized to your resume' : 'Direct company apply links' }}</p>
          </div>
        </div>
        <button class="refresh-btn" (click)="load()" [disabled]="loading()">
          {{ loading() ? '⏳ Loading...' : '🔄 Refresh' }}
        </button>
      </div>

      <!-- Resume upload -->
      <app-resume-upload (profileParsed)="onProfileParsed($event)" />

      <div class="filters" *ngIf="!loading()">
        <div class="filter-group">
          <button class="filter-btn" [class.active]="scoreFilter==='all'"  (click)="scoreFilter='all'">All</button>
          <button class="filter-btn" [class.active]="scoreFilter==='top'"  (click)="scoreFilter='top'">🔥 90%+</button>
          <button class="filter-btn" [class.active]="scoreFilter==='good'" (click)="scoreFilter='good'">⭐ 80%+</button>
        </div>
        <div class="filter-sep">|</div>
        <div class="filter-group">
          <button class="filter-btn" [class.active]="roleFilter==='all'" (click)="roleFilter='all'">All Roles</button>
          <button class="filter-btn" [class.active]="roleFilter==='SDE'" (click)="roleFilter='SDE'">SDE</button>
          <button class="filter-btn" [class.active]="roleFilter==='SWE'" (click)="roleFilter='SWE'">SWE</button>
          <button class="filter-btn" [class.active]="roleFilter==='SE'"  (click)="roleFilter='SE'">SE</button>
        </div>
      </div>

      <ng-container *ngIf="loading()">
        <div *ngFor="let i of [1,2,3,4]" class="skeleton-card"></div>
      </ng-container>
      <div class="error-box" *ngIf="error()">⚠️ {{ error() }} <button (click)="load()">Retry</button></div>

      <div *ngFor="let job of filteredJobs(); let i = index"
           class="job-card fade-in"
           [style.--card-color]="getRoleColor(job.roleType)"
           [style.animation-delay]="i * 40 + 'ms'">

        <div class="card-header">
          <div class="card-left">
            <div class="card-title-row">
              <span class="live-dot" [style.background]="getRoleColor(job.roleType)"></span>
              <span class="card-title">{{ job.title }}</span>
              <span class="role-badge" [style.color]="getRoleColor(job.roleType)" [style.border-color]="getRoleColor(job.roleType)">{{ job.roleType }}</span>
            </div>
            <div class="card-meta">
              <span>💰 {{ job.ctc }}</span>
              <span class="iv-badge" [style.color]="getIvColor(job.interviewType)">{{ getIvIcon(job.interviewType) }} {{ job.interviewType }}</span>
            </div>
            <!-- Personalized tip -->
            <div class="personalized-tip" *ngIf="profile() && getTip(job)">
              💡 {{ getTip(job) }}
            </div>
          </div>
          <div class="score-bar-wrap">
            <div class="score-bar-track"><div class="score-bar-fill" [style.width]="job.score + '%'" [style.background]="getRoleColor(job.roleType)"></div></div>
            <span class="score-val" [style.color]="getRoleColor(job.roleType)">{{ job.score }}%</span>
          </div>
        </div>

        <div class="section-label">DIRECT APPLY →</div>
        <div class="company-pills">
          <a *ngFor="let c of job.companies" [href]="c.apply" target="_blank" rel="noopener"
             class="company-pill" [style.--cc]="getRoleColor(job.roleType)">
            🏢 {{ c.name }} <small>· {{ c.location }}</small> ↗
          </a>
        </div>

        <details class="details-block">
          <summary>▼ Show interview breakdown</summary>
          <div class="details-content">
            <div><span class="dl">🧠 DSA:</span> {{ job.dsaFocus }}</div>
            <div><span class="dl">🏗️ System Design:</span> {{ job.sdFocus }}</div>
            <div><span class="dl">📋 Rounds:</span> {{ job.rounds }}</div>
          </div>
        </details>

        <div class="section-label" style="margin-top:10px">SEARCH LIVE →</div>
        <div class="platform-pills">
          <a *ngFor="let entry of getPlatformEntries(job.searchUrls)" [href]="entry.url" target="_blank" rel="noopener" class="platform-pill">{{ entry.label }}</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; }
    .module-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; gap:12px; flex-wrap:wrap; }
    .module-title { display:flex; align-items:center; gap:12px; }
    .module-icon { font-size:28px; }
    h1 { font-size:20px; font-weight:800; color:#e8f4ff; margin:0 0 4px; }
    h1+p { font-size:12px; color:#4a7098; margin:0; }
    .refresh-btn { background:linear-gradient(135deg,#00d4ff,#00a8cc); color:#040d1a; border:none; border-radius:10px; padding:9px 18px; font-size:13px; font-weight:700; cursor:pointer; font-family:'Outfit',sans-serif; }
    .refresh-btn:disabled { opacity:0.5; cursor:not-allowed; }
    .filters { display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-bottom:14px; }
    .filter-group { display:flex; gap:4px; }
    .filter-btn { padding:4px 12px; border-radius:20px; border:1px solid #1a3560; background:transparent; color:#4a7098; font-size:11px; cursor:pointer; transition:all 0.15s; font-family:'Outfit',sans-serif; }
    .filter-btn.active { border-color:#00d4ff; background:rgba(0,212,255,0.15); color:#00d4ff; font-weight:700; }
    .filter-sep { color:#2a4f80; }
    .skeleton-card { height:160px; background:linear-gradient(90deg,#071428 25%,#0a1c38 50%,#071428 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:16px; margin-bottom:10px; }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    .error-box { background:#1c0a0a; border:1px solid #7f1d1d; border-radius:12px; padding:16px; color:#fca5a5; font-size:13px; margin-bottom:12px; display:flex; align-items:center; gap:12px; }
    .error-box button { background:#7f1d1d; color:#fca5a5; border:none; border-radius:8px; padding:6px 14px; cursor:pointer; }
    .job-card { background:#071428; border:1px solid #1a3560; border-left:3px solid var(--card-color,#00d4ff); border-radius:16px; padding:18px 20px; margin-bottom:10px; animation:fadeUp 0.4s ease both; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    .card-header { display:flex; justify-content:space-between; gap:12px; margin-bottom:12px; }
    .card-left { flex:1; }
    .card-title-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:6px; }
    .live-dot { width:7px; height:7px; border-radius:50%; display:inline-block; flex-shrink:0; animation:pulse 2s infinite; }
    .card-title { font-weight:800; font-size:15px; color:#e8f4ff; }
    .role-badge { font-size:10px; font-weight:700; padding:2px 7px; border-radius:20px; border:1px solid; }
    .card-meta { display:flex; gap:12px; font-size:11px; color:#4a7098; flex-wrap:wrap; margin-bottom:4px; }
    .iv-badge { font-weight:600; }
    .personalized-tip { font-size:11px; color:#00e676; margin-top:5px; background:rgba(0,230,118,0.08); border:1px solid rgba(0,230,118,0.2); border-radius:6px; padding:5px 10px; }
    .score-bar-wrap { display:flex; align-items:center; gap:6px; flex-shrink:0; }
    .score-bar-track { width:60px; height:3px; background:#1a3560; border-radius:2px; overflow:hidden; }
    .score-bar-fill { height:100%; border-radius:2px; transition:width 1s; }
    .score-val { font-size:10px; font-weight:700; font-family:'Space Mono',monospace; min-width:32px; }
    .section-label { font-size:10px; color:#4a7098; font-family:'Space Mono',monospace; margin:10px 0 5px; letter-spacing:0.05em; }
    .company-pills { display:flex; flex-wrap:wrap; gap:5px; }
    .company-pill { display:inline-flex; align-items:center; gap:5px; background:rgba(0,212,255,0.1); border:1px solid rgba(0,212,255,0.3); color:var(--cc,#00d4ff); font-size:11px; font-weight:700; padding:5px 11px; border-radius:8px; text-decoration:none; transition:all 0.15s; }
    .company-pill small { font-size:9px; opacity:0.65; font-weight:400; }
    .company-pill:hover { transform:translateY(-1px); }
    details.details-block { margin-top:10px; }
    details summary { font-size:11px; color:#00d4ff; font-weight:700; cursor:pointer; list-style:none; }
    .details-content { background:#040d1a; border-radius:10px; padding:12px 14px; margin-top:8px; border:1px solid #1a3560; font-size:12px; color:#8aafd4; display:flex; flex-direction:column; gap:5px; }
    .dl { font-size:10px; font-weight:700; font-family:'Space Mono',monospace; margin-right:5px; }
    .platform-pills { display:flex; flex-wrap:wrap; gap:5px; }
    .platform-pill { font-size:11px; font-weight:700; color:#00d4ff; background:rgba(0,212,255,0.1); border:1px solid rgba(0,212,255,0.3); padding:4px 10px; border-radius:7px; text-decoration:none; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  `],
})
export class SdeComponent implements OnInit {
  jobs        = signal<SdeJob[]>([]);
  loading     = signal(true);
  error       = signal<string | null>(null);
  total       = signal(0);
  profile     = signal<ParsedProfile | null>(null);
  scoreFilter = 'all';
  roleFilter  = 'all';

  private api   = inject(ApiService);
  public  state = inject(AppStateService);

  filteredJobs = computed(() =>
    this.jobs().filter(j => {
      const sc = this.scoreFilter==='top'?j.score>=90:this.scoreFilter==='good'?j.score>=80&&j.score<90:true;
      return sc && (this.roleFilter==='all'||j.roleType===this.roleFilter);
    })
  );

  ngOnInit() {
    // Load saved profile from localStorage
    const saved = localStorage.getItem('oos_resume_profile');
    if (saved) { try { this.profile.set(JSON.parse(saved)); } catch { /**/ } }
    this.load();
  }

  onProfileParsed(p: ParsedProfile) {
    this.profile.set(p);
    this.load();
  }

  load() {
    this.loading.set(true); this.error.set(null);
    const p = this.profile();
    const obs = p
      ? this.api.getPersonalizedJobs(p, 'sde', this.state.location())
      : this.api.getSdeJobs(this.state.location());
    obs.subscribe({
      next: (d: any) => { this.jobs.set(d.jobs); this.total.set(d.total); this.loading.set(false); },
      error: (e: any) => { this.error.set(e.message); this.loading.set(false); },
    });
  }

  getRoleColor(role: string) { return role==='SDE'?'#00d4ff':role==='SWE'?'#7c4dff':'#00e676'; }
  getIvColor(iv: string) { const m:Record<string,string>={'DSA Heavy':'#ffb800','System Design':'#7c4dff','Both DSA + SD':'#00e676','Mostly SD':'#00d4ff'}; return m[iv]||'#8aafd4'; }
  getIvIcon(iv: string) { const m:Record<string,string>={'DSA Heavy':'🧠','System Design':'🏗️','Both DSA + SD':'⚡','Mostly SD':'📐'}; return m[iv]||'💼'; }
  getTip(job: any): string { return job['personalizedTip'] || ''; }
  getPlatformEntries(urls: Record<string,string>) {
    const L:Record<string,string>={naukri:'🔵 Naukri',linkedin:'💼 LinkedIn',indeed:'🔍 Indeed',cutshort:'✂️ Cutshort',wellfound:'🚀 Wellfound',instahyre:'⚡ Instahyre'};
    return Object.entries(urls).filter(([k])=>k in L).map(([k,u])=>({label:L[k],url:u}));
  }
}
