import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { GovtJobResult, GovtFetchedData } from '../../core/models';

@Component({
  selector: 'app-govt',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="module-page">
      <!-- Header -->
      <div class="module-header">
        <div class="module-title">
          <span class="module-icon">🏛️</span>
          <div>
            <h1>Government & PSU Jobs</h1>
            <p>AI reads official portals & PDFs live — real vacancies, deadlines, syllabus</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="refresh-btn" (click)="load(false)" [disabled]="loading()">
            {{ loading() ? '⏳ Scanning...' : '🔄 Refresh Cache' }}
          </button>
          <button class="refresh-btn force-btn" (click)="load(true)" [disabled]="loading()">
            🤖 Re-scan PDFs
          </button>
        </div>
      </div>

      <!-- AI Notice -->
      <div class="ai-notice">
        <span>🤖</span>
        <span><strong>AI reads official govt portals and PDFs in real time.</strong> Each card shows live notification status, vacancies, deadlines fetched from official sources. Always verify on the official portal before applying.</span>
      </div>

      <!-- Logs (shown during scan) -->
      <div class="log-panel" *ngIf="logs().length > 0 && loading()">
        <div class="log-title">LIVE SCAN LOG</div>
        <div *ngFor="let log of logs()" class="log-line"
             [class.log-ok]="log.startsWith('✓')"
             [class.log-warn]="log.startsWith('!')">
          {{ log }}
        </div>
      </div>

      <!-- Skeleton cards while loading -->
      <ng-container *ngIf="loading()">
        <div *ngFor="let i of [1,2,3,4,5,6,7,8]" class="skeleton-card"></div>
      </ng-container>

      <!-- Error -->
      <div class="error-box" *ngIf="error()">⚠️ {{ error() }} <button (click)="load(false)">Retry</button></div>

      <!-- Govt job cards -->
      <div *ngFor="let org of results(); let i = index"
           class="gov-card fade-in"
           [style.animation-delay]="i * 50 + 'ms'">

        <!-- Status badge -->
        <div class="card-top">
          <div class="card-left">
            <div class="org-name-row">
              <span class="live-dot" [style.background]="getStatusColor(org.fetched?.status)" [style.box-shadow]="'0 0 6px ' + getStatusColor(org.fetched?.status)"></span>
              <span class="org-name">{{ org.org }}</span>
              <span class="full-name">{{ org.fullName }}</span>
            </div>
            <div class="status-badge" *ngIf="org.fetched"
                 [style.background]="getStatusBg(org.fetched.status)"
                 [style.color]="getStatusColor(org.fetched.status)"
                 [style.border-color]="getStatusColor(org.fetched.status) + '50'">
              {{ getStatusLabel(org.fetched.status) }}
            </div>
            <div class="org-tags">
              <span *ngFor="let tag of org.tags" class="org-tag">{{ tag }}</span>
            </div>
          </div>
          <div class="profile-score" *ngIf="org.fetched?.profileMatch">
            <div class="score-bar-track">
              <div class="score-bar-fill" [style.width]="(org.fetched?.profileMatch?.score ?? 0) + '%'"></div>
            </div>
            <span class="score-val">{{ org.fetched?.profileMatch?.score }}%</span>
          </div>
        </div>

        <!-- Live data (shown when fetched) -->
        <ng-container *ngIf="org.fetched as f">
          <div class="notif-block">
            <div class="block-title">📄 NOTIFICATION — READ FROM OFFICIAL SOURCE</div>

            <div class="notif-row" *ngIf="f.notificationTitle">
              <span class="nl">TITLE</span> {{ f.notificationTitle }}
            </div>
            <div class="notif-row" *ngIf="f.postName">
              <span class="nl">POST</span>
              <span class="hl-green">{{ f.postName }}</span>
            </div>
            <div class="notif-row" *ngIf="f.vacancies">
              <span class="nl">VACANCIES</span>
              <span class="hl-cyan">{{ f.vacancies }}</span>
            </div>
            <div class="notif-row" *ngIf="f.salary">
              <span class="nl">SALARY</span>
              <span class="hl-green">{{ f.salary }}</span>
            </div>
            <div class="notif-row deadline-row" *ngIf="f.applicationDates?.end">
              <span class="nl">DEADLINE</span>
              <span class="deadline-badge">⏰ {{ f.applicationDates.end }}</span>
            </div>
            <div class="notif-row" *ngIf="f.applicationDates?.start">
              <span class="nl">OPENS</span> {{ f.applicationDates.start }}
            </div>
            <div class="notif-row" *ngIf="f.examDate">
              <span class="nl">EXAM DATE</span>
              <span class="hl-amber">{{ f.examDate }}</span>
            </div>
            <div class="notif-row" *ngIf="f.selectionProcess">
              <span class="nl">SELECTION</span> {{ f.selectionProcess }}
            </div>
            <div class="notif-row" *ngIf="f.sourceUrl">
              <span class="nl">SOURCE</span>
              <a [href]="f.sourceUrl" target="_blank" rel="noopener" class="source-link">🔗 {{ f.sourceUrl | slice:0:60 }}...</a>
            </div>

            <!-- PDF links -->
            <div *ngIf="f.pdfLinks && f.pdfLinks.length > 0">
              <div class="block-title" style="margin-top:8px">📋 OFFICIAL PDFs</div>
              <a *ngFor="let pdf of f.pdfLinks" [href]="pdf" target="_blank" rel="noopener" class="pdf-link">📄 {{ pdf }}</a>
            </div>
          </div>

          <!-- Expandable details -->
          <details class="details-block">
            <summary>▼ Show eligibility, syllabus & profile match</summary>
            <div class="details-content">

              <div *ngIf="f.eligibility" class="detail-section">
                <div class="detail-section-title">ELIGIBILITY</div>
                <div>📚 {{ f.eligibility.education }}</div>
                <div>🎂 Age: {{ f.eligibility.age }}</div>
                <div>📊 Marks: {{ f.eligibility.marks }}</div>
              </div>

              <div *ngIf="f.syllabus" class="detail-section">
                <div class="detail-section-title" style="color:#7c4dff">EXAM SYLLABUS (CS TOPICS)</div>
                <div>{{ f.syllabus }}</div>
              </div>

              <div *ngIf="f.profileMatch" class="detail-section">
                <div class="detail-section-title" style="color:#00e676">PROFILE MATCH — JASWANTH</div>
                <div style="margin-bottom:6px">{{ f.profileMatch?.reason }}</div>
                <div *ngFor="let a of f.profileMatch?.advantages" class="advantage-row">✓ {{ a }}</div>
                <div *ngFor="let g of f.profileMatch?.gaps" class="gap-row">⚠ {{ g }}</div>
              </div>

              <div *ngIf="f.actionRequired" class="action-box">
                <div class="detail-section-title" style="color:#ffb800">ACTION REQUIRED</div>
                <div>{{ f.actionRequired }}</div>
              </div>

              <div *ngIf="f.importantNote" class="note-box">⚠️ {{ f.importantNote }}</div>
            </div>
          </details>
        </ng-container>

        <!-- Portal links -->
        <div class="section-label" style="margin-top:12px">OFFICIAL PORTALS →</div>
        <div class="portal-pills">
          <a *ngFor="let p of org.portals" [href]="p.url" target="_blank" rel="noopener"
             class="portal-pill" [class.official]="p.type === 'Official' || p.type === 'Official Exam'">
            {{ getPortalIcon(p.type) }} {{ p.name }} ↗
          </a>
        </div>

        <!-- Per-org refresh -->
        <button class="org-refresh-btn" (click)="refreshOrg(org.id)">
          🔄 Re-scan {{ org.org }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .module-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; gap:12px; flex-wrap:wrap; }
    .module-title { display:flex; align-items:center; gap:12px; }
    .module-icon { font-size:28px; }
    h1 { font-size:20px; font-weight:800; color:#e8f4ff; margin:0 0 4px; }
    h1+p { font-size:12px; color:#4a7098; margin:0; }
    .header-actions { display:flex; gap:8px; flex-wrap:wrap; }
    .refresh-btn { background:linear-gradient(135deg,#ffb800,#ff9500); color:#040d1a; border:none; border-radius:10px; padding:9px 16px; font-size:12px; font-weight:700; cursor:pointer; font-family:'Outfit',sans-serif; }
    .force-btn { background:linear-gradient(135deg,#7c4dff,#6033cc); color:#fff; }
    .refresh-btn:disabled { opacity:0.5; cursor:not-allowed; }
    .ai-notice { background:rgba(255,184,0,0.08); border:1px solid rgba(255,184,0,0.3); border-radius:10px; padding:10px 14px; margin-bottom:14px; font-size:12px; color:#fbbf24; display:flex; gap:8px; line-height:1.6; }
    .log-panel { background:#040d1a; border:1px solid #1a3560; border-radius:12px; padding:14px 18px; margin-bottom:14px; max-height:180px; overflow-y:auto; }
    .log-title { font-size:10px; color:#00d4ff; font-weight:700; font-family:'Space Mono',monospace; letter-spacing:0.08em; margin-bottom:8px; }
    .log-line { font-size:12px; font-family:'Space Mono',monospace; color:#4a7098; padding:2px 0; }
    .log-ok { color:#00e676; } .log-warn { color:#ffb800; }
    .skeleton-card { height:140px; background:linear-gradient(90deg,#071428 25%,#0a1c38 50%,#071428 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:16px; margin-bottom:10px; }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    .error-box { background:#1c0a0a; border:1px solid #7f1d1d; border-radius:12px; padding:16px; color:#fca5a5; font-size:13px; margin-bottom:12px; display:flex; align-items:center; gap:12px; }
    .error-box button { background:#7f1d1d; color:#fca5a5; border:none; border-radius:8px; padding:6px 14px; cursor:pointer; font-family:'Outfit',sans-serif; }
    .gov-card { background:#071428; border:1px solid #1a3560; border-left:3px solid #ffb800; border-radius:16px; padding:18px 20px; margin-bottom:10px; animation:fadeUp 0.4s ease both; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    .card-top { display:flex; justify-content:space-between; gap:12px; margin-bottom:10px; }
    .card-left { flex:1; }
    .org-name-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:6px; }
    .live-dot { width:7px; height:7px; border-radius:50%; display:inline-block; flex-shrink:0; animation:pulse 2s infinite; }
    .org-name { font-weight:800; font-size:16px; color:#e8f4ff; }
    .full-name { font-size:11px; color:#4a7098; }
    .status-badge { display:inline-block; font-size:12px; font-weight:700; padding:4px 12px; border-radius:8px; border:1px solid; margin-bottom:8px; }
    .org-tags { display:flex; gap:5px; flex-wrap:wrap; }
    .org-tag { font-size:10px; color:#ffb800; background:rgba(255,184,0,0.1); border:1px solid rgba(255,184,0,0.3); padding:2px 8px; border-radius:20px; font-weight:700; }
    .profile-score { display:flex; align-items:center; gap:6px; flex-shrink:0; }
    .score-bar-track { width:60px; height:3px; background:#1a3560; border-radius:2px; overflow:hidden; }
    .score-bar-fill { height:100%; background:#ffb800; border-radius:2px; transition:width 1s; }
    .score-val { font-size:10px; color:#ffb800; font-weight:700; font-family:'Space Mono',monospace; }
    .notif-block { background:#040d1a; border-radius:10px; padding:12px 14px; margin-bottom:10px; border:1px solid rgba(255,184,0,0.2); }
    .block-title { font-size:10px; color:#ffb800; font-weight:700; font-family:'Space Mono',monospace; margin-bottom:8px; }
    .notif-row { font-size:12px; color:#8aafd4; margin-bottom:5px; display:flex; align-items:baseline; gap:6px; }
    .nl { font-size:9px; color:#4a7098; font-family:'Space Mono',monospace; font-weight:700; min-width:70px; flex-shrink:0; }
    .hl-green { color:#00e676; font-weight:700; }
    .hl-cyan  { color:#00d4ff; font-weight:700; }
    .hl-amber { color:#ffb800; font-weight:700; }
    .deadline-badge { background:rgba(255,64,129,0.15); border:1px solid rgba(255,64,129,0.4); color:#ff4081; font-size:12px; font-weight:700; padding:2px 10px; border-radius:6px; }
    .source-link { color:#00d4ff; font-size:11px; word-break:break-all; }
    .pdf-link { display:block; color:#ff4081; font-size:11px; margin-bottom:3px; word-break:break-all; }
    details.details-block { margin-top:8px; }
    details summary { font-size:11px; color:#ffb800; font-weight:700; cursor:pointer; list-style:none; }
    .details-content { background:#040d1a; border-radius:10px; padding:12px 14px; margin-top:8px; border:1px solid #1a3560; font-size:12px; color:#8aafd4; }
    .detail-section { margin-bottom:12px; display:flex; flex-direction:column; gap:4px; }
    .detail-section-title { font-size:10px; font-weight:700; font-family:'Space Mono',monospace; color:#ffb800; margin-bottom:4px; }
    .advantage-row { color:#4ade80; } .gap-row { color:#fca5a5; }
    .action-box { background:rgba(255,184,0,0.08); border:1px solid rgba(255,184,0,0.3); border-radius:8px; padding:10px 12px; margin-bottom:8px; }
    .note-box { background:rgba(255,64,129,0.08); border:1px solid rgba(255,64,129,0.3); border-radius:8px; padding:10px 12px; color:#ff4081; font-size:12px; }
    .section-label { font-size:10px; color:#4a7098; font-family:'Space Mono',monospace; margin-bottom:5px; letter-spacing:0.05em; }
    .portal-pills { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:10px; }
    .portal-pill { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:700; padding:5px 11px; border-radius:8px; text-decoration:none; transition:all 0.15s; background:rgba(139,170,212,0.1); border:1px solid rgba(139,170,212,0.3); color:#8aafd4; }
    .portal-pill.official { background:rgba(255,184,0,0.12); border-color:rgba(255,184,0,0.4); color:#ffb800; }
    .portal-pill:hover { transform:translateY(-1px); }
    .org-refresh-btn { background:none; border:1px solid #1a3560; color:#4a7098; border-radius:8px; padding:5px 14px; font-size:11px; cursor:pointer; font-family:'Outfit',sans-serif; transition:all 0.15s; }
    .org-refresh-btn:hover { border-color:#ffb800; color:#ffb800; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  `],
})
export class GovtComponent implements OnInit {
  results = signal<GovtJobResult[]>([]);
  loading = signal(true);
  error   = signal<string | null>(null);
  logs    = signal<string[]>([]);

  private api = inject(ApiService);

  ngOnInit() { this.load(false); }

  load(forceRefresh: boolean) {
    this.loading.set(true); this.error.set(null); this.logs.set([]);
    this.api.getGovtJobs(forceRefresh).subscribe({
      next: d => {
        this.results.set(d.results);
        if (d.logs) this.logs.set(d.logs);
        this.loading.set(false);
      },
      error: e => { this.error.set(e.message); this.loading.set(false); },
    });
  }

  refreshOrg(orgId: string) {
    this.api.refreshGovtOrg(orgId).subscribe({
      next: d => {
        this.results.update(prev =>
          prev.map(r => r.id === orgId ? d.result : r)
        );
      },
      error: e => console.error('Org refresh failed:', e),
    });
  }

  getStatusColor(status?: string): string {
    const m: Record<string,string> = { 'ACTIVE':'#00e676','UPCOMING':'#ffb800','CLOSED_RECENTLY':'#ff4081','NO_CURRENT_NOTIFICATION':'#8aafd4','ERROR':'#4a7098' };
    return m[status||'ERROR'] || '#4a7098';
  }
  getStatusBg(status: string): string {
    const m: Record<string,string> = { 'ACTIVE':'#052e16','UPCOMING':'#1c1917','CLOSED_RECENTLY':'#1c0a0a','NO_CURRENT_NOTIFICATION':'#0a1628','ERROR':'#0a1628' };
    return m[status] || '#0a1628';
  }
  getStatusLabel(status: string): string {
    const m: Record<string,string> = { 'ACTIVE':'🟢 ACTIVE — Apply Now','UPCOMING':'🟡 UPCOMING','CLOSED_RECENTLY':'🔴 Recently Closed','NO_CURRENT_NOTIFICATION':'⚪ No Current Notification','ERROR':'⚠️ Check Official Portal' };
    return m[status] || '⚠️ Unknown';
  }
  getPortalIcon(type: string): string {
    const m: Record<string,string> = { 'Official':'🏛️','Official Exam':'🎓','Register':'📝','Jobs':'💼','Guide':'📖','Gazette':'📰','Tracker':'🔔','Exam Body':'🎓','Aggregator':'🔗' };
    return m[type] || '🔗';
  }
}
