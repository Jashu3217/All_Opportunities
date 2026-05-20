import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { AppStateService } from './core/services/app-state.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent, SidebarComponent],
  template: `
    <div class="app-shell" [class.sidebar-open]="state.sidebarOpen()">
      <app-navbar />
      <div class="content-area">
        <app-sidebar />
        <main class="main-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-shell { display:flex; flex-direction:column; min-height:100vh; background:#040d1a; color:#e8f4ff; }
    .content-area { display:flex; flex:1; overflow:hidden; }
    .main-content { flex:1; overflow-y:auto; padding:24px; max-width:900px; margin:0 auto; width:100%; }
    @media(max-width:768px) { .main-content { padding:16px; } }
  `],
})
export class AppComponent {
  constructor(public state: AppStateService) {}
}
