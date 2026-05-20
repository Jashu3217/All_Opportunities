import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'sde',
    pathMatch: 'full',
  },
  {
    path: 'sde',
    loadComponent: () => import('./modules/sde/sde.component').then(m => m.SdeComponent),
    title: 'SDE / SWE / SE Jobs — OpportunityOS',
  },
  {
    path: 'resume',
    loadComponent: () => import('./modules/resume/resume.component').then(m => m.ResumeComponent),
    title: 'Resume Stack Jobs — OpportunityOS',
  },
  {
    path: 'govt',
    loadComponent: () => import('./modules/govt/govt.component').then(m => m.GovtComponent),
    title: 'Govt / PSU Jobs — OpportunityOS',
  },
  {
    path: 'teach',
    loadComponent: () => import('./modules/teach/teach.component').then(m => m.TeachComponent),
    title: 'DSA Teaching — OpportunityOS',
  },
  {
    path: 'freelance',
    loadComponent: () => import('./modules/freelance/freelance.component').then(m => m.FreelanceComponent),
    title: 'Web Freelance — OpportunityOS',
  },
  {
    path: '**',
    redirectTo: 'sde',
  },
];
