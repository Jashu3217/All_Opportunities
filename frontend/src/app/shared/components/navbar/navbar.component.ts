import { CommonModule } from '@angular/common';
import { AppStateService } from '../../../core/services/app-state.service';
import { LOCATIONS, LocationKey } from '../../../core/models';
import { Component, inject } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="navbar">
      <div class="nav-left">
        <button class="menu-btn" (click)="state.toggleSidebar()">☰</button>
        <div class="brand">
          <span class="live-dot"></span>
          <span class="brand-name">OpportunityOS</span>
          <span class="version-badge">v2.0</span>
          <span class="ai-badge">AI GOVT SCANNER</span>
        </div>
      </div>

      <div class="nav-right">
        <span class="loc-label">📍</span>
        <div class="loc-pills">
          <button
            *ngFor="let loc of locations"
            class="loc-btn"
            [class.active]="state.location() === loc.key"
            (click)="state.setLocation(loc.key)">
            {{ loc.label }}
          </button>
        </div>
        <div class="user-info">
          <span class="user-name">Jaswanth</span>
          <span class="user-role">SDE-2</span>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex; align-items: center; justify-content: space-between;
      background: #071428; border-bottom: 1px solid #1a3560;
      padding: 12px 20px; position: sticky; top: 0; z-index: 100;
      flex-wrap: wrap; gap: 10px;
    }
    .nav-left, .nav-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .menu-btn { background: none; border: 1px solid #1a3560; color: #8aafd4; border-radius: 8px; padding: 6px 10px; cursor: pointer; font-size: 16px; }
    .brand { display: flex; align-items: center; gap: 8px; }
    .live-dot { width: 9px; height: 9px; border-radius: 50%; background: #00d4ff; box-shadow: 0 0 10px #00d4ff; animation: pulse 2s infinite; }
    .brand-name { font-weight: 900; font-size: 17px; color: #e8f4ff; letter-spacing: -0.03em; }
    .version-badge { font-size: 9px; color: #00d4ff; background: #0a1c38; border: 1px solid #2a4f80; padding: 2px 7px; border-radius: 20px; font-family: 'Space Mono', monospace; }
    .ai-badge { font-size: 9px; color: #ffb800; background: rgba(255,184,0,0.1); border: 1px solid rgba(255,184,0,0.4); padding: 2px 7px; border-radius: 20px; font-family: 'Space Mono', monospace; }
    .loc-label { font-size: 12px; color: #4a7098; }
    .loc-pills { display: flex; gap: 4px; flex-wrap: wrap; }
    .loc-btn { padding: 4px 11px; border-radius: 20px; border: 1px solid #1a3560; background: transparent; color: #4a7098; font-size: 11px; font-weight: 400; cursor: pointer; transition: all 0.15s; font-family: 'Outfit', sans-serif; }
    .loc-btn.active { border-color: #00d4ff; background: rgba(0,212,255,0.1); color: #00d4ff; font-weight: 700; }
    .user-info { display: flex; flex-direction: column; align-items: flex-end; }
    .user-name { font-size: 12px; font-weight: 700; color: #e8f4ff; }
    .user-role { font-size: 10px; color: #4a7098; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  `],
})
export class NavbarComponent {
  locations = LOCATIONS;
 readonly state = inject(AppStateService);
}
