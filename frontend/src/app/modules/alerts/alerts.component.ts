import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="alerts-page">
      <div class="page-header">
        <div class="header-left">
          <span class="page-icon">🔔</span>
          <div>
            <h1>Job Alerts</h1>
            <p>Get live job matches delivered to your inbox every morning at 9AM IST</p>
          </div>
        </div>
      </div>

      <!-- How it works -->
      <div class="how-it-works">
        <div class="step">
          <div class="step-icon">🤖</div>
          <div class="step-text">AI scans live job boards every morning</div>
        </div>
        <div class="step-arrow">→</div>
        <div class="step">
          <div class="step-icon">🎯</div>
          <div class="step-text">Filters jobs matching your skills + score threshold</div>
        </div>
        <div class="step-arrow">→</div>
        <div class="step">
          <div class="step-icon">📧</div>
          <div class="step-text">Sends you a beautiful email digest at 9AM IST</div>
        </div>
      </div>

      <!-- Setup form -->
      <div class="setup-card">
        <div class="setup-title">⚙️ Configure Your Alert</div>

        <div class="form-group">
          <label class="form-label">📧 Email Address</label>
          <input class="form-input" type="email" [(ngModel)]="email"
                 placeholder="your@email.com">
        </div>

        <div class="form-group">
          <label class="form-label">📍 Location</label>
          <div class="option-pills">
            <button *ngFor="let l of locations" class="option-pill"
                    [class.active]="selectedLocation===l.key"
                    (click)="selectedLocation=l.key">{{ l.label }}</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">📂 Job Modules to Scan</label>
          <div class="option-pills">
            <button *ngFor="let m of modules" class="option-pill"
                    [class.active]="selectedModules.includes(m.id)"
                    (click)="toggleModule(m.id)">
              {{ m.icon }} {{ m.label }}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">🎯 Minimum Match Score: {{ minScore }}%</label>
          <input type="range" min="50" max="95" step="5" [(ngModel)]="minScore"
                 class="range-input">
          <div class="range-labels">
            <span>50% (broad)</span>
            <span>95% (very selective)</span>
          </div>
        </div>

        <div class="form-actions">
          <button class="subscribe-btn" (click)="subscribe()" [disabled]="saving()">
            {{ saving() ? '⏳ Setting up...' : '🔔 Subscribe to Daily Alerts' }}
          </button>
          <button class="test-btn" (click)="sendTest()" [disabled]="saving() || !email">
            {{ saving() ? '⏳' : '📧' }} Send Test Email
          </button>
        </div>

        <div class="success-msg" *ngIf="successMsg()">✅ {{ successMsg() }}</div>
        <div class="error-msg"   *ngIf="errorMsg()">⚠️ {{ errorMsg() }}</div>
      </div>

      <!-- SMTP setup note -->
      <div class="smtp-note">
        <div class="smtp-title">⚙️ Email Setup Required (One-time)</div>
        <div class="smtp-body">
          To enable email delivery, add these to your Railway Variables:
          <div class="env-vars">
            <div class="env-var"><span class="env-key">SMTP_HOST</span> = smtp.gmail.com</div>
            <div class="env-var"><span class="env-key">SMTP_PORT</span> = 587</div>
            <div class="env-var"><span class="env-key">SMTP_USER</span> = your Gmail address</div>
            <div class="env-var"><span class="env-key">SMTP_PASS</span> = Gmail App Password (not regular password)</div>
          </div>
          <div class="smtp-link">
            Get Gmail App Password → <a href="https://myaccount.google.com/apppasswords" target="_blank">myaccount.google.com/apppasswords</a>
          </div>
        </div>
      </div>

      <!-- Unsubscribe -->
      <div class="unsub-section">
        <div class="unsub-title">Unsubscribe</div>
        <div class="unsub-row">
          <input class="form-input" type="email" [(ngModel)]="unsubEmail" placeholder="email to unsubscribe">
          <button class="unsub-btn" (click)="unsubscribe()">Unsubscribe</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; }
    .page-header { display:flex; align-items:flex-start; gap:12px; margin-bottom:20px; }
    .header-left { display:flex; align-items:center; gap:12px; }
    .page-icon { font-size:28px; }
    h1 { font-size:20px; font-weight:800; color:#e8f4ff; margin:0 0 4px; }
    h1+p { font-size:12px; color:#4a7098; margin:0; }
    .how-it-works { display:flex; align-items:center; gap:8px; background:#071428; border:1px solid #1a3560; border-radius:12px; padding:16px 20px; margin-bottom:16px; flex-wrap:wrap; }
    .step { display:flex; align-items:center; gap:8px; }
    .step-icon { font-size:24px; }
    .step-text { font-size:12px; color:#8aafd4; max-width:140px; line-height:1.5; }
    .step-arrow { font-size:18px; color:#2a4f80; }
    .setup-card { background:#071428; border:1px solid #1a3560; border-radius:16px; padding:20px 24px; margin-bottom:14px; }
    .setup-title { font-size:14px; font-weight:800; color:#e8f4ff; margin-bottom:16px; }
    .form-group { margin-bottom:16px; }
    .form-label { display:block; font-size:11px; color:#ffb800; font-weight:700; font-family:'Space Mono',monospace; margin-bottom:8px; letter-spacing:0.05em; }
    .form-input { width:100%; background:#040d1a; border:1px solid #2a4f80; color:#e8f4ff; border-radius:8px; padding:9px 12px; font-size:13px; font-family:'Outfit',sans-serif; }
    .form-input:focus { outline:none; border-color:#00d4ff; }
    .option-pills { display:flex; flex-wrap:wrap; gap:6px; }
    .option-pill { padding:5px 12px; border-radius:20px; border:1px solid #1a3560; background:transparent; color:#4a7098; font-size:11px; font-weight:700; cursor:pointer; transition:all 0.15s; font-family:'Outfit',sans-serif; }
    .option-pill.active { border-color:#00d4ff; background:rgba(0,212,255,0.15); color:#00d4ff; }
    .range-input { width:100%; accent-color:#00d4ff; margin-bottom:4px; }
    .range-labels { display:flex; justify-content:space-between; font-size:10px; color:#4a7098; }
    .form-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:20px; }
    .subscribe-btn { background:linear-gradient(135deg,#00d4ff,#00a8cc); color:#040d1a; border:none; border-radius:10px; padding:11px 22px; font-size:13px; font-weight:800; cursor:pointer; font-family:'Outfit',sans-serif; }
    .subscribe-btn:disabled { opacity:0.5; cursor:not-allowed; }
    .test-btn { background:rgba(0,212,255,0.1); border:1px solid rgba(0,212,255,0.4); color:#00d4ff; border-radius:10px; padding:11px 18px; font-size:12px; font-weight:700; cursor:pointer; font-family:'Outfit',sans-serif; }
    .test-btn:disabled { opacity:0.5; }
    .success-msg { color:#00e676; font-size:13px; margin-top:12px; padding:10px 14px; background:rgba(0,230,118,0.08); border-radius:8px; }
    .error-msg { color:#ff4081; font-size:13px; margin-top:12px; padding:10px 14px; background:rgba(255,64,129,0.08); border-radius:8px; }
    .smtp-note { background:rgba(255,184,0,0.06); border:1px solid rgba(255,184,0,0.3); border-radius:12px; padding:16px 20px; margin-bottom:14px; }
    .smtp-title { font-size:12px; color:#ffb800; font-weight:700; margin-bottom:8px; }
    .smtp-body { font-size:12px; color:#8aafd4; line-height:1.8; }
    .env-vars { background:#040d1a; border-radius:8px; padding:10px 14px; margin:8px 0; }
    .env-var { font-family:'Space Mono',monospace; font-size:11px; color:#8aafd4; margin-bottom:4px; }
    .env-key { color:#00d4ff; font-weight:700; }
    .smtp-link { font-size:11px; color:#4a7098; margin-top:6px; }
    .smtp-link a { color:#00d4ff; }
    .unsub-section { background:#071428; border:1px solid #1a3560; border-radius:12px; padding:16px 20px; }
    .unsub-title { font-size:12px; color:#ff4081; font-weight:700; margin-bottom:10px; }
    .unsub-row { display:flex; gap:8px; }
    .unsub-btn { background:rgba(255,64,129,0.1); border:1px solid rgba(255,64,129,0.4); color:#ff4081; border-radius:8px; padding:9px 16px; font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap; font-family:'Outfit',sans-serif; }
  `],
})
export class AlertsComponent {
  private http = inject(HttpClient);

  email           = '';
  unsubEmail      = '';
  selectedLocation= 'hyderabad';
  selectedModules = ['sde', 'resume'];
  minScore        = 75;
  saving          = signal(false);
  successMsg      = signal('');
  errorMsg        = signal('');

  locations = [
    { key:'hyderabad', label:'Hyderabad' },
    { key:'remote',    label:'Remote' },
    { key:'bangalore', label:'Bengaluru' },
    { key:'pan_india', label:'Pan India' },
  ];

  modules = [
    { id:'sde',      icon:'⚡', label:'Tech Jobs'  },
    { id:'resume',   icon:'🔧', label:'Stack Match' },
    { id:'teach',    icon:'🎓', label:'Teaching'   },
    { id:'freelance',icon:'🌐', label:'Freelance'  },
  ];

  toggleModule(id: string) {
    if (this.selectedModules.includes(id)) {
      this.selectedModules = this.selectedModules.filter(m => m !== id);
    } else {
      this.selectedModules = [...this.selectedModules, id];
    }
  }

  subscribe() {
    if (!this.email) { this.errorMsg.set('Please enter your email address'); return; }
    this.saving.set(true); this.successMsg.set(''); this.errorMsg.set('');

    this.http.post<any>(`${environment.apiUrl}/alerts`, {
      email:    this.email,
      modules:  this.selectedModules,
      location: this.selectedLocation,
      minScore: this.minScore,
    }).subscribe({
      next: r => { this.saving.set(false); this.successMsg.set(r.message || 'Alert set up!'); },
      error: e => { this.saving.set(false); this.errorMsg.set(e.error?.error || 'Failed to set up alert'); },
    });
  }

  sendTest() {
    if (!this.email) { this.errorMsg.set('Please enter your email address'); return; }
    this.saving.set(true); this.successMsg.set(''); this.errorMsg.set('');

    this.http.post<any>(`${environment.apiUrl}/alerts/test`, { email: this.email }).subscribe({
      next: r => { this.saving.set(false); this.successMsg.set(r.message || 'Test email sent!'); },
      error: e => { this.saving.set(false); this.errorMsg.set(e.error?.error || 'Failed'); },
    });
  }

  unsubscribe() {
    if (!this.unsubEmail) return;
    this.http.post<any>(`${environment.apiUrl}/alerts/unsubscribe`, { email: this.unsubEmail }).subscribe({
      next: () => { this.successMsg.set(`Unsubscribed ${this.unsubEmail}`); this.unsubEmail = ''; },
      error: () => {},
    });
  }
}
