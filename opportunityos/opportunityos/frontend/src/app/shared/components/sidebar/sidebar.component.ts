import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MODULE_CONFIGS } from '../../core/models';
import { AppStateService } from '../../core/services/app-state.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.open]="state.sidebarOpen()">
      <div class="sidebar-inner">
        <div class="sidebar-title">MODULES</div>
        <nav>
          <a
            *ngFor="let mod of modules"
            class="nav-item"
            [routerLink]="mod.route"
            routerLinkActive="active"
            [style.--mod-color]="mod.color"
            [style.--mod-dim]="mod.dimColor">
            <span class="nav-icon">{{ mod.icon }}</span>
            <div class="nav-text">
              <span class="nav-label">{{ mod.label }}</span>
              <span class="nav-badge" [style.color]="mod.color">{{ mod.badge }}</span>
            </div>
          </a>
        </nav>
        <div class="sidebar-footer">
          <div class="profile-chip">
            <div class="profile-dot"></div>
            <div>
              <div class="profile-name">Jaswanth C.</div>
              <div class="profile-title">SDE-2 · Node.js · MEAN</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 0; overflow: hidden; transition: width 0.25s ease;
      background: #071428; border-right: 1px solid #1a3560;
      display: flex; flex-direction: column;
    }
    .sidebar.open { width: 220px; }
    .sidebar-inner { width: 220px; padding: 16px 12px; display: flex; flex-direction: column; height: 100%; }
    .sidebar-title { font-size: 10px; color: #4a7098; letter-spacing: 0.1em; font-family: 'Space Mono', monospace; margin-bottom: 12px; }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 10px; margin-bottom: 4px;
      text-decoration: none; color: #8aafd4; transition: all 0.15s;
      border: 1px solid transparent;
    }
    .nav-item:hover { background: var(--mod-dim); color: #e8f4ff; border-color: var(--mod-color, #2a4f80); }
    .nav-item.active { background: var(--mod-dim); border-color: var(--mod-color); color: var(--mod-color); }
    .nav-icon { font-size: 18px; flex-shrink: 0; }
    .nav-text { display: flex; flex-direction: column; }
    .nav-label { font-size: 12px; font-weight: 600; }
    .nav-badge { font-size: 9px; font-family: 'Space Mono', monospace; letter-spacing: 0.05em; }
    .sidebar-footer { margin-top: auto; border-top: 1px solid #1a3560; padding-top: 14px; }
    .profile-chip { display: flex; align-items: center; gap: 10px; }
    .profile-dot { width: 8px; height: 8px; border-radius: 50%; background: #00e676; box-shadow: 0 0 8px #00e676; flex-shrink: 0; }
    .profile-name { font-size: 12px; font-weight: 700; color: #e8f4ff; }
    .profile-title { font-size: 10px; color: #4a7098; }
    @media(max-width:768px) { .sidebar.open { position: fixed; top: 0; left: 0; height: 100vh; z-index: 200; } }
  `],
})
export class SidebarComponent {
  modules = MODULE_CONFIGS;
  constructor(public state: AppStateService) {}
}
