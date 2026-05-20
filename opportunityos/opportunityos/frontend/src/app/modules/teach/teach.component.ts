// ── Teach Component ───────────────────────────────────────────────────────────
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { TeachingOpportunity } from '../../core/models';

@Component({
  selector: 'app-teach',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="module-page">
      <div class="module-header">
        <div class="module-title"><span class="module-icon">🎓</span>
          <div><h1>DSA Teaching Opportunities</h1><p>{{ total() }} platforms · Global students · Freelance income</p></div>
        </div>
        <button class="refresh-btn" (click)="load()" [disabled]="loading()">{{ loading() ? '⏳' : '🔄' }} Refresh</button>
      </div>

      <ng-container *ngIf="loading()">
        <div *ngFor="let i of [1,2,3,4]" class="skeleton-card"></div>
      </ng-container>
      <div class="error-box" *ngIf="error()">⚠️ {{ error() }} <button (click)="load()">Retry</button></div>

      <div *ngFor="let opp of opportunities(); let i = index" class="opp-card fade-in" [style.animation-delay]="i*40+'ms'">
        <div class="card-header">
          <div class="card-left">
            <div class="title-row">
              <span class="live-dot"></span>
              <span class="card-title">{{ opp.title }}</span>
            </div>
            <div class="card-meta">
              <span>🌐 {{ opp.platform }}</span>
              <span>👥 {{ opp.audience }}</span>
            </div>
            <div class="earn-tag">💰 {{ opp.earn }}</div>
            <div class="skill-tags">
              <span *ngFor="let l of opp.languages" class="skill-tag">{{ l }}</span>
            </div>
            <p class="details">{{ opp.details }}</p>
            <div class="demand-row">📊 Demand: <span class="demand-val">{{ opp.demand }}</span></div>
          </div>
          <div class="score-wrap">
            <div class="score-track"><div class="score-fill" [style.width]="opp.score+'%'"></div></div>
            <span class="score-val">{{ opp.score }}%</span>
          </div>
        </div>

        <details class="details-block">
          <summary>▼ Show how to start</summary>
          <div class="details-content">🚀 {{ opp.howToStart }}</div>
        </details>

        <div class="section-label" style="margin-top:10px">REGISTER / APPLY →</div>
        <div class="portal-pills">
          <a *ngFor="let p of opp.portals" [href]="p.url" target="_blank" rel="noopener" class="portal-pill">
            {{ p.type==='Register'?'📝':p.type==='Platform'?'📱':'📖' }} {{ p.name }} ↗
          </a>
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
    .refresh-btn { background:linear-gradient(135deg,#7c4dff,#6033cc); color:#fff; border:none; border-radius:10px; padding:9px 16px; font-size:12px; font-weight:700; cursor:pointer; font-family:'Outfit',sans-serif; }
    .refresh-btn:disabled { opacity:0.5; cursor:not-allowed; }
    .skeleton-card { height:180px; background:linear-gradient(90deg,#071428 25%,#0a1c38 50%,#071428 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:16px; margin-bottom:10px; }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    .error-box { background:#1c0a0a; border:1px solid #7f1d1d; border-radius:12px; padding:16px; color:#fca5a5; font-size:13px; margin-bottom:12px; }
    .error-box button { background:#7f1d1d; color:#fca5a5; border:none; border-radius:8px; padding:6px 14px; cursor:pointer; font-family:'Outfit',sans-serif; }
    .opp-card { background:#071428; border:1px solid #1a3560; border-left:3px solid #7c4dff; border-radius:16px; padding:18px 20px; margin-bottom:10px; animation:fadeUp 0.4s ease both; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    .card-header { display:flex; justify-content:space-between; gap:12px; margin-bottom:10px; }
    .card-left { flex:1; }
    .title-row { display:flex; align-items:center; gap:8px; margin-bottom:5px; flex-wrap:wrap; }
    .live-dot { width:7px; height:7px; border-radius:50%; background:#7c4dff; box-shadow:0 0 6px #7c4dff; animation:pulse 2s infinite; flex-shrink:0; }
    .card-title { font-weight:800; font-size:15px; color:#e8f4ff; }
    .card-meta { display:flex; gap:10px; font-size:11px; color:#4a7098; margin-bottom:5px; flex-wrap:wrap; }
    .earn-tag { font-size:12px; color:#00e676; font-weight:700; margin-bottom:6px; }
    .skill-tags { display:flex; flex-wrap:wrap; gap:4px; margin-bottom:7px; }
    .skill-tag { font-size:10px; color:#7c4dff; background:rgba(124,77,255,0.15); border:1px solid rgba(124,77,255,0.35); padding:2px 7px; border-radius:20px; font-weight:700; }
    .details { font-size:11px; color:#8aafd4; line-height:1.6; margin:0 0 6px; }
    .demand-row { font-size:11px; color:#7c4dff; font-weight:700; }
    .demand-val { color:#8aafd4; font-weight:400; }
    .score-wrap { display:flex; align-items:center; gap:6px; flex-shrink:0; }
    .score-track { width:60px; height:3px; background:#1a3560; border-radius:2px; overflow:hidden; }
    .score-fill { height:100%; background:#7c4dff; border-radius:2px; transition:width 1s; }
    .score-val { font-size:10px; color:#7c4dff; font-weight:700; font-family:'Space Mono',monospace; }
    details.details-block { margin-top:8px; }
    details summary { font-size:11px; color:#7c4dff; font-weight:700; cursor:pointer; list-style:none; }
    .details-content { background:#040d1a; border-radius:10px; padding:12px 14px; margin-top:8px; border:1px solid #1a3560; font-size:12px; color:#8aafd4; line-height:1.7; }
    .section-label { font-size:10px; color:#4a7098; font-family:'Space Mono',monospace; margin-bottom:5px; letter-spacing:0.05em; }
    .portal-pills { display:flex; flex-wrap:wrap; gap:5px; }
    .portal-pill { font-size:11px; font-weight:700; color:#7c4dff; background:rgba(124,77,255,0.12); border:1px solid rgba(124,77,255,0.35); padding:5px 11px; border-radius:8px; text-decoration:none; transition:all 0.15s; }
    .portal-pill:hover { transform:translateY(-1px); }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  `],
})
export class TeachComponent implements OnInit {
  opportunities = signal<TeachingOpportunity[]>([]);
  loading = signal(true);
  error   = signal<string | null>(null);
  total   = signal(0);

  constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true); this.error.set(null);
    this.api.getTeachOpportunities().subscribe({
      next: d => { this.opportunities.set(d.opportunities); this.total.set(d.total); this.loading.set(false); },
      error: e => { this.error.set(e.message); this.loading.set(false); },
    });
  }
}

export { TeachComponent as default };
