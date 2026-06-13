import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Application {
  _id:         string;
  jobId:       string;
  jobTitle:    string;
  company:     string;
  location:    string;
  salary:      string;
  applyUrl:    string;
  skills:      string[];
  matchScore:  number;
  status:      string;
  appliedAt:   string | null;
  interviewAt: string | null;
  notes:       string;
  nextAction:  string;
  moduleId:    string;
  createdAt:   string;
}

interface Stats {
  counts:       Record<string, number>;
  total:        number;
  responseRate: number;
  pipeline:     { stage: string; count: number; color: string }[];
  upcomingInterviews: Application[];
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  saved:     { label:'Saved',     color:'#8aafd4', bg:'rgba(138,175,212,0.1)', icon:'🔖' },
  applied:   { label:'Applied',   color:'#00d4ff', bg:'rgba(0,212,255,0.1)',   icon:'📤' },
  interview: { label:'Interview', color:'#ffb800', bg:'rgba(255,184,0,0.1)',   icon:'🎤' },
  offer:     { label:'Offer',     color:'#00e676', bg:'rgba(0,230,118,0.1)',   icon:'🎉' },
  rejected:  { label:'Rejected',  color:'#ff4081', bg:'rgba(255,64,129,0.1)', icon:'❌' },
  ghosted:   { label:'Ghosted',   color:'#4a7098', bg:'rgba(74,112,152,0.1)', icon:'👻' },
};

@Component({
  selector: 'app-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tracker-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <span class="page-icon">📋</span>
          <div>
            <h1>Application Tracker</h1>
            <p>{{ stats()?.total || 0 }} total · {{ stats()?.responseRate || 0 }}% response rate</p>
          </div>
        </div>
        <div class="filter-group">
          <button *ngFor="let s of statusKeys" class="filter-btn"
                  [style.border-color]="activeFilter()===s ? getColor(s) : '#1a3560'"
                  [style.color]="activeFilter()===s ? getColor(s) : '#4a7098'"
                  [style.background]="activeFilter()===s ? getBg(s) : 'transparent'"
                  (click)="setFilter(s)">
            {{ getIcon(s) }} {{ getLabel(s) }}
            <span class="count-badge">{{ stats()?.counts?.[s] || 0 }}</span>
          </button>
        </div>
      </div>

      <!-- Stats pipeline -->
      <div class="pipeline-bar" *ngIf="stats()">
        <div *ngFor="let p of stats()!.pipeline" class="pipeline-stage">
          <div class="stage-count" [style.color]="p.color">{{ p.count }}</div>
          <div class="stage-bar">
            <div class="stage-fill" [style.background]="p.color"
                 [style.width]="getBarWidth(p.count) + '%'"></div>
          </div>
          <div class="stage-label">{{ p.stage }}</div>
        </div>
      </div>

      <!-- Upcoming interviews alert -->
      <div class="interview-alert" *ngIf="stats()?.upcomingInterviews?.length">
        <span class="alert-icon">🎤</span>
        <div>
          <div class="alert-title">Upcoming Interviews</div>
          <div *ngFor="let app of stats()!.upcomingInterviews" class="alert-item">
            {{ app.company }} — {{ app.jobTitle }} · {{ formatDate(app.interviewAt) }}
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <div>Loading applications...</div>
      </div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!loading() && filteredApps().length === 0">
        <div class="empty-icon">📭</div>
        <div class="empty-title">No applications yet</div>
        <div class="empty-sub">
          When you click "Save to Tracker" on any live job, it appears here.<br>
          Track your entire job search pipeline in one place.
        </div>
      </div>

      <!-- Application cards -->
      <div *ngFor="let app of filteredApps()" class="app-card fade-in">
        <div class="app-top">
          <div class="app-info">
            <div class="app-title">{{ app.jobTitle }}</div>
            <div class="app-company">🏢 {{ app.company }} · 📍 {{ app.location }}</div>
            <div class="app-salary" *ngIf="app.salary">💰 {{ app.salary }}</div>
            <div class="skills-row">
              <span *ngFor="let s of app.skills.slice(0,4)" class="skill-tag">{{ s }}</span>
            </div>
          </div>
          <div class="app-right">
            <div class="match-score" [style.color]="'#00d4ff'">{{ app.matchScore }}%</div>
            <div class="match-label">match</div>
          </div>
        </div>

        <!-- Status selector -->
        <div class="status-row">
          <span class="status-label">Status:</span>
          <div class="status-pills">
            <button *ngFor="let s of statusKeys"
                    class="status-pill"
                    [style.border-color]="app.status===s ? getColor(s) : '#1a3560'"
                    [style.color]="app.status===s ? getColor(s) : '#4a7098'"
                    [style.background]="app.status===s ? getBg(s) : 'transparent'"
                    (click)="updateStatus(app, s)">
              {{ getIcon(s) }} {{ getLabel(s) }}
            </button>
          </div>
        </div>

        <!-- Interview date (shown when interview status) -->
        <div class="interview-date" *ngIf="app.status === 'interview'">
          <label>📅 Interview Date:</label>
          <input type="datetime-local" [value]="toDatetimeLocal(app.interviewAt)"
                 (change)="updateInterviewDate(app, $event)"
                 class="date-input">
        </div>

        <!-- Notes -->
        <div class="notes-row">
          <textarea class="notes-input" placeholder="Add notes, next steps, contacts..."
                    [value]="app.notes"
                    (blur)="updateNotes(app, $event)"
                    rows="2"></textarea>
        </div>

        <!-- Actions -->
        <div class="app-actions">
          <a [href]="app.applyUrl" target="_blank" rel="noopener" class="apply-link">
            🚀 Apply / View Job ↗
          </a>
          <div class="app-date">Added {{ formatDate(app.createdAt) }}</div>
          <button class="delete-btn" (click)="deleteApp(app)">🗑️ Remove</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; gap:12px; flex-wrap:wrap; }
    .header-left { display:flex; align-items:center; gap:12px; }
    .page-icon { font-size:28px; }
    h1 { font-size:20px; font-weight:800; color:#e8f4ff; margin:0 0 4px; }
    h1+p { font-size:12px; color:#4a7098; margin:0; }
    .filter-group { display:flex; gap:4px; flex-wrap:wrap; }
    .filter-btn { display:flex; align-items:center; gap:4px; padding:5px 10px; border-radius:20px; border:1px solid; background:transparent; font-size:10px; font-weight:700; cursor:pointer; font-family:'Outfit',sans-serif; transition:all 0.15s; }
    .count-badge { background:rgba(255,255,255,0.1); border-radius:10px; padding:1px 5px; font-size:9px; }
    .pipeline-bar { display:flex; gap:8px; margin-bottom:16px; background:#071428; border:1px solid #1a3560; border-radius:12px; padding:14px 16px; }
    .pipeline-stage { flex:1; text-align:center; }
    .stage-count { font-size:20px; font-weight:800; margin-bottom:4px; }
    .stage-bar { height:4px; background:#1a3560; border-radius:2px; overflow:hidden; margin-bottom:4px; }
    .stage-fill { height:100%; border-radius:2px; transition:width 0.8s ease; }
    .stage-label { font-size:9px; color:#4a7098; font-weight:700; }
    .interview-alert { background:rgba(255,184,0,0.08); border:1px solid rgba(255,184,0,0.3); border-radius:10px; padding:12px 16px; margin-bottom:14px; display:flex; align-items:flex-start; gap:10px; }
    .alert-icon { font-size:20px; flex-shrink:0; }
    .alert-title { font-size:12px; color:#ffb800; font-weight:700; margin-bottom:4px; }
    .alert-item { font-size:12px; color:#8aafd4; }
    .loading-state { text-align:center; padding:40px; color:#4a7098; display:flex; flex-direction:column; align-items:center; gap:12px; }
    .spinner { width:28px; height:28px; border:2px solid #1a3560; border-top-color:#00d4ff; border-radius:50%; animation:spin 0.8s linear infinite; }
    @keyframes spin { to{transform:rotate(360deg)} }
    .empty-state { text-align:center; padding:56px 20px; }
    .empty-icon { font-size:48px; margin-bottom:12px; }
    .empty-title { font-size:18px; font-weight:800; color:#e8f4ff; margin-bottom:8px; }
    .empty-sub { font-size:13px; color:#4a7098; line-height:1.8; }
    .app-card { background:#071428; border:1px solid #1a3560; border-radius:16px; padding:18px 20px; margin-bottom:10px; animation:fadeUp 0.4s ease both; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .app-top { display:flex; justify-content:space-between; gap:12px; margin-bottom:12px; }
    .app-info { flex:1; }
    .app-title { font-size:15px; font-weight:800; color:#e8f4ff; margin-bottom:4px; }
    .app-company { font-size:12px; color:#8aafd4; margin-bottom:4px; }
    .app-salary { font-size:12px; color:#00e676; font-weight:700; margin-bottom:6px; }
    .skills-row { display:flex; flex-wrap:wrap; gap:4px; }
    .skill-tag { font-size:10px; color:#00d4ff; background:rgba(0,212,255,0.1); border:1px solid rgba(0,212,255,0.3); padding:2px 7px; border-radius:20px; font-weight:700; }
    .app-right { text-align:center; }
    .match-score { font-size:20px; font-weight:800; }
    .match-label { font-size:9px; color:#4a7098; }
    .status-row { display:flex; align-items:center; gap:8px; margin-bottom:10px; flex-wrap:wrap; }
    .status-label { font-size:10px; color:#4a7098; font-family:'Space Mono',monospace; font-weight:700; white-space:nowrap; }
    .status-pills { display:flex; gap:4px; flex-wrap:wrap; }
    .status-pill { padding:4px 9px; border-radius:16px; border:1px solid; background:transparent; font-size:10px; font-weight:700; cursor:pointer; font-family:'Outfit',sans-serif; transition:all 0.15s; }
    .interview-date { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
    .interview-date label { font-size:11px; color:#ffb800; font-weight:700; white-space:nowrap; }
    .date-input { background:#040d1a; border:1px solid #2a4f80; color:#e8f4ff; border-radius:8px; padding:5px 10px; font-size:12px; font-family:'Outfit',sans-serif; }
    .notes-row { margin-bottom:10px; }
    .notes-input { width:100%; background:#040d1a; border:1px solid #1a3560; color:#8aafd4; border-radius:8px; padding:8px 12px; font-size:12px; font-family:'Outfit',sans-serif; resize:none; line-height:1.6; }
    .notes-input:focus { outline:none; border-color:#2a4f80; }
    .app-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .apply-link { font-size:12px; font-weight:700; color:#00d4ff; background:rgba(0,212,255,0.1); border:1px solid rgba(0,212,255,0.3); padding:6px 12px; border-radius:8px; text-decoration:none; }
    .app-date { font-size:11px; color:#4a7098; margin-left:auto; }
    .delete-btn { background:none; border:1px solid rgba(255,64,129,0.3); color:#ff4081; border-radius:8px; padding:5px 10px; font-size:11px; cursor:pointer; font-family:'Outfit',sans-serif; }
    .delete-btn:hover { background:rgba(255,64,129,0.1); }
  `],
})
export class TrackerComponent implements OnInit {
  private http = inject(HttpClient);
  apps        = signal<Application[]>([]);
  stats       = signal<Stats | null>(null);
  loading     = signal(true);
  activeFilter= signal('all');

  statusKeys = ['all', 'saved', 'applied', 'interview', 'offer', 'rejected', 'ghosted'];

  filteredApps = () => {
    const f = this.activeFilter();
    return f === 'all' ? this.apps() : this.apps().filter(a => a.status === f);
  };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/tracker`).subscribe({
      next: r => { this.apps.set(r.data?.applications || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.http.get<any>(`${environment.apiUrl}/tracker/stats`).subscribe({
      next: r => this.stats.set(r.data),
      error: () => {},
    });
  }

  setFilter(s: string) { this.activeFilter.set(s); }

  updateStatus(app: Application, status: string) {
    this.http.put<any>(`${environment.apiUrl}/tracker/${app._id}`, { status }).subscribe({
      next: r => { this.apps.update(list => list.map(a => a._id === app._id ? r.data : a)); this.load(); },
      error: () => {},
    });
  }

  updateNotes(app: Application, event: Event) {
    const notes = (event.target as HTMLTextAreaElement).value;
    this.http.put<any>(`${environment.apiUrl}/tracker/${app._id}`, { notes }).subscribe({ error: () => {} });
  }

  updateInterviewDate(app: Application, event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.http.put<any>(`${environment.apiUrl}/tracker/${app._id}`, { interviewAt: val, status: 'interview' }).subscribe({
      next: r => this.apps.update(list => list.map(a => a._id === app._id ? r.data : a)),
      error: () => {},
    });
  }

  deleteApp(app: Application) {
    this.http.delete(`${environment.apiUrl}/tracker/${app._id}`).subscribe({
      next: () => { this.apps.update(list => list.filter(a => a._id !== app._id)); this.load(); },
      error: () => {},
    });
  }

  getColor(s: string): string { return STATUS_CFG[s]?.color || '#8aafd4'; }
  getBg(s: string): string { return STATUS_CFG[s]?.bg || 'transparent'; }
  getIcon(s: string): string { return STATUS_CFG[s]?.icon || '•'; }
  getLabel(s: string): string { return STATUS_CFG[s]?.label || s; }

  getBarWidth(count: number): number {
    const max = Math.max(...(this.stats()?.pipeline || []).map(p => p.count), 1);
    return Math.round((count / max) * 100);
  }

  formatDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  }

  toDatetimeLocal(d: string | null): string {
    if (!d) return '';
    return new Date(d).toISOString().slice(0, 16);
  }
}
