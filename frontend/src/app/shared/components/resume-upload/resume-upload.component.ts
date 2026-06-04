import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
  summary:      string;
  rawText:      string;
}

@Component({
  selector: 'app-resume-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upload-panel">

      <!-- Collapsed state — show parsed profile -->
      <div *ngIf="profile(); else uploadBlock" class="profile-display">
        <div class="profile-header">
          <div class="profile-info">
            <div class="profile-avatar">{{ getInitials(profile()!.name) }}</div>
            <div>
              <div class="profile-name">{{ profile()!.name || 'Your Profile' }}</div>
              <div class="profile-title">{{ profile()!.title }} · {{ profile()!.experience }}</div>
            </div>
          </div>
          <button class="change-btn" (click)="clearProfile()">↩ Change Resume</button>
        </div>
        <div class="skills-row">
          <span *ngFor="let skill of profile()!.skills.slice(0, 8)" class="skill-pill">{{ skill }}</span>
          <span *ngIf="profile()!.skills.length > 8" class="skill-more">+{{ profile()!.skills.length - 8 }} more</span>
        </div>
        <div class="profile-note">✅ All results are personalized to your resume</div>
      </div>

      <!-- Upload block -->
      <ng-template #uploadBlock>
        <div class="upload-header">
          <span class="upload-icon">📄</span>
          <div>
            <div class="upload-title">Upload Your Resume</div>
            <div class="upload-sub">Get personalized job matches based on your actual skills</div>
          </div>
        </div>

        <!-- Drop zone -->
        <div class="drop-zone"
             [class.dragging]="dragging()"
             [class.processing]="uploading()"
             (dragover)="onDragOver($event)"
             (dragleave)="dragging.set(false)"
             (drop)="onDrop($event)"
             (click)="fileInput.click()">

          <input #fileInput type="file" accept=".pdf" style="display:none" (change)="onFileSelected($event)">

          <ng-container *ngIf="!uploading(); else loadingBlock">
            <div class="drop-icon">{{ dragging() ? '📂' : '☁️' }}</div>
            <div class="drop-text">
              {{ dragging() ? 'Drop your resume here' : 'Drag & drop your PDF resume' }}
            </div>
            <div class="drop-sub">or click to browse · PDF only · max 10MB</div>
          </ng-container>

          <ng-template #loadingBlock>
            <div class="loading-spinner"></div>
            <div class="drop-text">{{ loadingMsg() }}</div>
          </ng-template>
        </div>

        <div class="error-msg" *ngIf="error()">⚠️ {{ error() }}</div>
      </ng-template>
    </div>
  `,
  styles: [`
    .upload-panel { background:#071428; border:1px solid #1a3560; border-radius:16px; padding:18px 20px; margin-bottom:16px; }
    .upload-header { display:flex; align-items:center; gap:12px; margin-bottom:14px; }
    .upload-icon { font-size:24px; }
    .upload-title { font-size:15px; font-weight:800; color:#e8f4ff; }
    .upload-sub { font-size:11px; color:#4a7098; margin-top:2px; }
    .drop-zone { border:2px dashed #2a4f80; border-radius:12px; padding:28px 20px; text-align:center; cursor:pointer; transition:all 0.2s; }
    .drop-zone:hover, .drop-zone.dragging { border-color:#00d4ff; background:rgba(0,212,255,0.05); }
    .drop-zone.processing { cursor:not-allowed; opacity:0.7; }
    .drop-icon { font-size:32px; margin-bottom:8px; }
    .drop-text { font-size:14px; font-weight:600; color:#e8f4ff; margin-bottom:4px; }
    .drop-sub { font-size:11px; color:#4a7098; }
    .loading-spinner { width:32px; height:32px; border:3px solid #1a3560; border-top-color:#00d4ff; border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 10px; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .error-msg { color:#ff4081; font-size:12px; margin-top:8px; padding:8px 12px; background:rgba(255,64,129,0.1); border-radius:8px; border:1px solid rgba(255,64,129,0.3); }
    .profile-display { }
    .profile-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px; }
    .profile-info { display:flex; align-items:center; gap:12px; }
    .profile-avatar { width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg,#00d4ff,#7c4dff); display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:800; color:#040d1a; flex-shrink:0; }
    .profile-name { font-size:15px; font-weight:800; color:#e8f4ff; }
    .profile-title { font-size:11px; color:#4a7098; margin-top:2px; }
    .change-btn { background:none; border:1px solid #2a4f80; color:#8aafd4; border-radius:8px; padding:5px 12px; font-size:11px; cursor:pointer; font-family:'Outfit',sans-serif; transition:all 0.15s; }
    .change-btn:hover { border-color:#00d4ff; color:#00d4ff; }
    .skills-row { display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px; }
    .skill-pill { font-size:10px; color:#00d4ff; background:rgba(0,212,255,0.1); border:1px solid rgba(0,212,255,0.3); padding:2px 8px; border-radius:20px; font-weight:700; }
    .skill-more { font-size:10px; color:#4a7098; padding:2px 6px; }
    .profile-note { font-size:11px; color:#00e676; }
  `],
})
export class ResumeUploadComponent {
  @Output() profileParsed = new EventEmitter<ParsedProfile>();

  private http = inject(HttpClient);

  profile   = signal<ParsedProfile | null>(null);
  uploading = signal(false);
  dragging  = signal(false);
  error     = signal<string | null>(null);
  loadingMsg= signal('Uploading resume...');

  onDragOver(e: DragEvent) { e.preventDefault(); this.dragging.set(true); }

  onDrop(e: DragEvent) {
    e.preventDefault(); this.dragging.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.processFile(file);
  }

  processFile(file: File) {
    if (!file.name.endsWith('.pdf')) {
      this.error.set('Only PDF files are supported. Please upload a .pdf file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.error.set('File too large. Maximum size is 10MB.');
      return;
    }

    this.uploading.set(true);
    this.error.set(null);
    this.loadingMsg.set('Uploading resume...');

    const formData = new FormData();
    formData.append('resume', file);

    setTimeout(() => this.loadingMsg.set('AI is reading your resume...'), 1500);
    setTimeout(() => this.loadingMsg.set('Extracting skills & experience...'), 3000);

    this.http.post<{ success: boolean; data: { profile: ParsedProfile } }>(
      `${environment.apiUrl}/resume/upload`, formData
    ).subscribe({
      next: (res) => {
        this.uploading.set(false);
        if (res.success && res.data?.profile) {
          this.profile.set(res.data.profile);
          this.profileParsed.emit(res.data.profile);
          // Save to localStorage for persistence
          localStorage.setItem('oos_resume_profile', JSON.stringify(res.data.profile));
        }
      },
      error: (err) => {
        this.uploading.set(false);
        this.error.set(err.error?.error || 'Failed to parse resume. Please try again.');
      },
    });
  }

  clearProfile() {
    this.profile.set(null);
    localStorage.removeItem('oos_resume_profile');
    this.profileParsed.emit(null as unknown as ParsedProfile);
  }

  getInitials(name: string): string {
    return (name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  loadSavedProfile() {
    const saved = localStorage.getItem('oos_resume_profile');
    if (saved) {
      try {
        const p = JSON.parse(saved) as ParsedProfile;
        this.profile.set(p);
        this.profileParsed.emit(p);
      } catch { /* ignore */ }
    }
  }
}
