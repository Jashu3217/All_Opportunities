import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'sde', pathMatch: 'full' },
  {
    path: 'sde',
    loadComponent: () => import('./modules/live-jobs/live-jobs.component').then(m => m.LiveJobsComponent),
    data: { moduleId: 'sde', title: 'SDE / SWE / SE Jobs', icon: '⚡' },
    title: 'SDE / SWE / SE Jobs — OpportunityOS',
  },
  {
    path: 'resume',
    loadComponent: () => import('./modules/live-jobs/live-jobs.component').then(m => m.LiveJobsComponent),
    data: { moduleId: 'resume', title: 'Resume Stack Jobs', icon: '🔧' },
    title: 'Resume Stack Jobs — OpportunityOS',
  },
  {
    path: 'govt',
    loadComponent: () => import('./modules/govt/govt.component').then(m => m.GovtComponent),
    title: 'Govt / PSU Jobs — OpportunityOS',
  },
  {
    path: 'teach',
    loadComponent: () => import('./modules/live-jobs/live-jobs.component').then(m => m.LiveJobsComponent),
    data: { moduleId: 'teach', title: 'DSA Teaching', icon: '🎓' },
    title: 'DSA Teaching — OpportunityOS',
  },
  {
    path: 'freelance',
    loadComponent: () => import('./modules/live-jobs/live-jobs.component').then(m => m.LiveJobsComponent),
    data: { moduleId: 'freelance', title: 'Web Freelance', icon: '🌐' },
    title: 'Web Freelance — OpportunityOS',
  },
  { path: '**', redirectTo: 'sde' },
];
