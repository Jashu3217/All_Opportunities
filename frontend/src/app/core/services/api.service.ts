import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, LocationKey,
  SdeModuleData, ResumeModuleData, GovtModuleData,
  TeachModuleData, FreelanceModuleData, GovtJobResult,
} from '../models';
import { ParsedProfile } from '../../shared/components/resume-upload/resume-upload.component';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;
  private http  = inject(HttpClient);

  getSdeJobs(location: LocationKey): Observable<SdeModuleData> {
    return this.get<SdeModuleData>('modules/sde', { location });
  }
  getResumeJobs(location: LocationKey): Observable<ResumeModuleData> {
    return this.get<ResumeModuleData>('modules/resume', { location });
  }
  getGovtJobs(forceRefresh = false): Observable<GovtModuleData> {
    return this.get<GovtModuleData>('modules/govt', { refresh: String(forceRefresh) });
  }
  refreshGovtOrg(orgId: string): Observable<{ result: GovtJobResult; logs: string[] }> {
    return this.http
      .post<ApiResponse<{ result: GovtJobResult; logs: string[] }>>(`${this.base}/modules/govt/${orgId}/refresh`, {})
      .pipe(map(r => r.data!), catchError(this.handleError));
  }
  getTeachOpportunities(): Observable<TeachModuleData> {
    return this.get<TeachModuleData>('modules/teach');
  }
  getFreelanceOpportunities(): Observable<FreelanceModuleData> {
    return this.get<FreelanceModuleData>('modules/freelance');
  }

  // ── Personalized endpoints ──────────────────────────────────────────────────
  getPersonalizedJobs(profile: ParsedProfile, moduleId: string, location: LocationKey): Observable<SdeModuleData | ResumeModuleData> {
    return this.http
      .post<ApiResponse<SdeModuleData>>(`${this.base}/resume/personalize`, { profile, moduleId, location })
      .pipe(map(r => r.data!), catchError(this.handleError));
  }

  getHealth(): Observable<{ status: string }> {
    return this.get<{ status: string }>('health');
  }

  private get<T>(path: string, queryParams?: Record<string, string>): Observable<T> {
    let params = new HttpParams();
    if (queryParams) {
      Object.entries(queryParams).forEach(([k, v]) => { params = params.set(k, v); });
    }
    return this.http
      .get<ApiResponse<T>>(`${this.base}/${path}`, { params })
      .pipe(map(r => r.data!), catchError(this.handleError));
  }

  private handleError(err: unknown) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    console.error('API error:', message);
    return throwError(() => new Error(message));
  }
}
