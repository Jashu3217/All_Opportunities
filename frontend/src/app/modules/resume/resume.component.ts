// ── Resume Component ──────────────────────────────────────────────────────────
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AppStateService } from '../../core/services/app-state.service';
import { ResumeJob } from '../../core/models';

@Component({
  selector: 'app-resume',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="module-page">
      <div class="module-header">
        <div class="module-title">
          <span class="module-icon">🔧</span>
          <div>
            <h1>Resume Stack Jobs</h1>
            <p>{{ total() }} roles · {{ state.locationLabel() }} · Matched to your exact skills</p>
          </div>
        </div>
        <button class="refresh-btn" (click)="load()" [disabled]="loading()">
          {{ loading() ? '⏳' : '🔄' }} Refresh
        </button>
      </div>

      <div class="filters" *ngIf="!loading()">
        <button class="filter-btn" [class.active]="scoreF==='all'"  (click)="scoreF='all'">All</button>
        <button class="filter-btn" [class.active]="scoreF==='top'"  (click)="scoreF='top'">🔥 90%+</button>
        <button class="filter-btn" [class.active]="scoreF==='good'" (click)="scoreF='good'">⭐ 80%+</button>
        <span class="sep">|</span>
        <button class="filter-btn" [class.active]="stackF==='all'"   (click)="stackF='all'">All Stack</button>
        <button class="filter-btn" [class.active]="stackF==='nodejs' " (click)="stackF='nodejs'">Node.js</button>
        <button class="filter-btn" [class.active]="stackF==='redis'"  (click)="stackF='redis'">Redis</button>
        <button class="filter-btn" [class.active]="stackF==='mean'"   (click)="stackF='mean'">MEAN</button>
        <button class="filter-btn" [class.active]="stackF==='micro'"  (click)="stackF='micro'">Microservices</button>
      </div>

      <ng-container *ngIf="loading()">
        <div *ngFor="let i of [1,2,3,4]" class="skeleton-card"></div>
      </ng-container>
      <div class="error-box" *ngIf="error()">⚠️ {{ error() }} <button (click)="load()">Retry</button></div>

      <div *ngFor="let job of filteredJobs(); let i = index"
           class="job-card fade-in"
           [style.animation-delay]="i * 40 + 'ms'">
        <div class="card-header">
          <div class="card-left">
            <div class="title-row">
              <span class="live-dot"></span>
              <span class="card-title">{{ job.title }}</span>
            </div>
            <div class="card-meta">
              <span class="stack-focus">⚙️ {{ job.stackFocus }}</span>
              <span class="ctc">💰 {{ job.ctc }}</span>
            </div>
            <div class="skill-tags">
              <span *ngFor="let s of job.skills" class="skill-tag" [style.color]="getSkillColor(s)" [style.border-color]="getSkillColor(s)">{{ s }}</span>
            </div>
          </div>
          <div class="score-wrap">
            <div class="score-track"><div class="score-fill" [style.width]="job.score + '%'"></div></div>
            <span class="score-val">{{ job.score }}%</span>
          </div>
        </div>

        <div class="section-label">DIRECT APPLY →</div>
        <div class="company-pills">
          <a *ngFor="let c of job.companies" [href]="c.apply" target="_blank" rel="noopener" class="company-pill">
            🏢 {{ c.name }} <small>· {{ c.location }}</small> ↗
          </a>
        </div>

        <div class="section-label" style="margin-top:10px">SEARCH LIVE →</div>
        <div class="platform-pills">
          <a *ngFor="let e of getPlatforms(job.searchUrls)" [href]="e.url" target="_blank" rel="noopener" class="platform-pill">{{ e.label }}</a>
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
    .refresh-btn { background:linear-gradient(135deg,#00e676,#00c853); color:#040d1a; border:none; border-radius:10px; padding:9px 16px; font-size:12px; font-weight:700; cursor:pointer; font-family:'Outfit',sans-serif; }
    .refresh-btn:disabled { opacity:0.5; cursor:not-allowed; }
    .filters { display:flex; gap:5px; flex-wrap:wrap; margin-bottom:14px; align-items:center; }
    .filter-btn { padding:4px 11px; border-radius:20px; border:1px solid #1a3560; background:transparent; color:#4a7098; font-size:11px; cursor:pointer; transition:all 0.15s; font-family:'Outfit',sans-serif; }
    .filter-btn.active { border-color:#00e676; background:rgba(0,230,118,0.12); color:#00e676; font-weight:700; }
    .sep { color:#2a4f80; }
    .skeleton-card { height:150px; background:linear-gradient(90deg,#071428 25%,#0a1c38 50%,#071428 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:16px; margin-bottom:10px; }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    .error-box { background:#1c0a0a; border:1px solid #7f1d1d; border-radius:12px; padding:16px; color:#fca5a5; font-size:13px; margin-bottom:12px; display:flex; align-items:center; gap:12px; }
    .error-box button { background:#7f1d1d; color:#fca5a5; border:none; border-radius:8px; padding:6px 14px; cursor:pointer; font-family:'Outfit',sans-serif; }
    .job-card { background:#071428; border:1px solid #1a3560; border-left:3px solid #00e676; border-radius:16px; padding:18px 20px; margin-bottom:10px; animation:fadeUp 0.4s ease both; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    .card-header { display:flex; justify-content:space-between; gap:12px; margin-bottom:10px; }
    .card-left { flex:1; }
    .title-row { display:flex; align-items:center; gap:8px; margin-bottom:5px; flex-wrap:wrap; }
    .live-dot { width:7px; height:7px; border-radius:50%; background:#00e676; box-shadow:0 0 6px #00e676; animation:pulse 2s infinite; flex-shrink:0; }
    .card-title { font-weight:800; font-size:15px; color:#e8f4ff; }
    .card-meta { display:flex; gap:10px; font-size:11px; color:#4a7098; flex-wrap:wrap; margin-bottom:7px; }
    .stack-focus { color:#00d4ff; font-weight:600; }
    .ctc { color:#00e676; font-weight:700; }
    .skill-tags { display:flex; flex-wrap:wrap; gap:4px; }
    .skill-tag { font-size:10px; padding:2px 7px; border-radius:20px; border:1px solid; background:transparent; font-weight:700; }
    .score-wrap { display:flex; align-items:center; gap:6px; flex-shrink:0; }
    .score-track { width:60px; height:3px; background:#1a3560; border-radius:2px; overflow:hidden; }
    .score-fill { height:100%; background:#00e676; border-radius:2px; transition:width 1s; }
    .score-val { font-size:10px; color:#00e676; font-weight:700; font-family:'Space Mono',monospace; }
    .section-label { font-size:10px; color:#4a7098; font-family:'Space Mono',monospace; margin:8px 0 5px; letter-spacing:0.05em; }
    .company-pills { display:flex; flex-wrap:wrap; gap:5px; }
    .company-pill { display:inline-flex; align-items:center; gap:5px; background:rgba(0,230,118,0.1); border:1px solid rgba(0,230,118,0.3); color:#00e676; font-size:11px; font-weight:700; padding:5px 11px; border-radius:8px; text-decoration:none; transition:all 0.15s; }
    .company-pill small { font-size:9px; opacity:0.65; font-weight:400; }
    .company-pill:hover { transform:translateY(-1px); }
    .platform-pills { display:flex; flex-wrap:wrap; gap:5px; }
    .platform-pill { font-size:11px; font-weight:700; color:#00d4ff; background:rgba(0,212,255,0.1); border:1px solid rgba(0,212,255,0.3); padding:4px 10px; border-radius:7px; text-decoration:none; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  `],
})
export class ResumeComponent implements OnInit {
  jobs   = signal<ResumeJob[]>([]);
  loading= signal(true);
  error  = signal<string | null>(null);
  total  = signal(0);
  scoreF = 'all';
  stackF = 'all';

  filteredJobs = computed(() => {
    const SMAP: Record<string,string[]> = { nodejs:['Node.js','Express.js'], redis:['Redis','BullMQ'], micro:['Microservices','Docker'], mean:['Angular','MongoDB'] };
    return this.jobs().filter(j => {
      const sc = this.scoreF==='top'?j.score>=90:this.scoreF==='good'?j.score>=80&&j.score<90:true;
      const sk = this.stackF==='all'?true:j.skills.some(s=>(SMAP[this.stackF]||[]).some(k=>s.includes(k)));
      return sc&&sk;
    });
  });

  private api = inject(ApiService);
  public state = inject(AppStateService);
  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true); this.error.set(null);
    this.api.getResumeJobs(this.state.location()).subscribe({
      next: d => { this.jobs.set(d.jobs); this.total.set(d.total); this.loading.set(false); },
      error: e => { this.error.set(e.message); this.loading.set(false); },
    });
  }

  SKILL_COLORS: Record<string,string> = { 'Node.js':'#68a063','TypeScript':'#3178c6','Redis':'#dc382d','MongoDB':'#47a248','AWS':'#ff9900','Docker':'#2496ed','Microservices':'#6366f1','Angular':'#dd0031','Express.js':'#68a063','PostgreSQL':'#336791','BullMQ':'#c0392b','JWT':'#f59e0b','React':'#61dafb' };
  getSkillColor(s: string): string { return this.SKILL_COLORS[s] || '#8aafd4'; }
  getPlatforms(urls: Record<string,string>): { label: string; url: string }[] {
    const L: Record<string,string> = { naukri:'🔵 Naukri', linkedin:'💼 LinkedIn', indeed:'🔍 Indeed', cutshort:'✂️ Cutshort', wellfound:'🚀 Wellfound', instahyre:'⚡ Instahyre' };
    return Object.entries(urls).filter(([k]) => k in L).map(([k,u]) => ({ label: L[k], url: u }));
  }
}
