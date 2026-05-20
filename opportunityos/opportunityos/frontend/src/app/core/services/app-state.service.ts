import { Injectable, signal, computed } from '@angular/core';
import { LocationKey, ModuleId } from '../models';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  // ── Signals ────────────────────────────────────────────────────────────────
  readonly location  = signal<LocationKey>('hyderabad');
  readonly activeModule = signal<ModuleId | null>(null);
  readonly sidebarOpen  = signal<boolean>(true);
  readonly darkMode     = signal<boolean>(true);

  // ── Derived ────────────────────────────────────────────────────────────────
  readonly locationLabel = computed(() => {
    const map: Record<LocationKey, string> = {
      hyderabad: 'Hyderabad',
      remote:    'Remote',
      bangalore: 'Bengaluru',
      pan_india: 'Pan India',
      global:    'Global',
    };
    return map[this.location()];
  });

  setLocation(loc: LocationKey)   { this.location.set(loc); }
  setModule(mod: ModuleId | null) { this.activeModule.set(mod); }
  toggleSidebar()                 { this.sidebarOpen.update(v => !v); }
}
