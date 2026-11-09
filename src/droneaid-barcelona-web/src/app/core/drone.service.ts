import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ComponentInput,
  DroneDetail,
  DroneFilters,
  DroneStatus,
  DroneStatusSummary,
  DroneSummary,
  DroneType,
  IssueStatus
} from './models';

export interface DroneIdentity {
  code: string;
  nickname: string;
  type: DroneType;
  status: DroneStatus;
}

export interface IssueInput {
  title: string;
  description: string | null;
  componentName: string | null;
  status: IssueStatus;
}

export interface VideoInput {
  url: string;
  label: string | null;
  testedOn: string | null;
}

@Injectable({ providedIn: 'root' })
export class DroneService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/drones';

  list(filters: Partial<DroneFilters> = {}): Observable<DroneSummary[]> {
    let params = new HttpParams();
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.type) {
      params = params.set('type', filters.type);
    }
    return this.http.get<DroneSummary[]>(this.base, { params });
  }

  summary(): Observable<DroneStatusSummary> {
    return this.http.get<DroneStatusSummary>(`${this.base}/summary`);
  }

  defaultComponents(type: DroneType): Observable<ComponentInput[]> {
    return this.http.get<ComponentInput[]>(`${this.base}/default-components/${type}`);
  }

  get(id: string): Observable<DroneDetail> {
    return this.http.get<DroneDetail>(`${this.base}/${id}`);
  }

  create(identity: DroneIdentity, components: ComponentInput[]): Observable<DroneDetail> {
    return this.http.post<DroneDetail>(this.base, { ...identity, components });
  }

  update(id: string, identity: DroneIdentity): Observable<DroneDetail> {
    return this.http.put<DroneDetail>(`${this.base}/${id}`, identity);
  }

  replaceComponents(id: string, components: ComponentInput[]): Observable<DroneDetail> {
    return this.http.put<DroneDetail>(`${this.base}/${id}/components`, { components });
  }

  addIssue(id: string, issue: IssueInput): Observable<DroneDetail> {
    return this.http.post<DroneDetail>(`${this.base}/${id}/issues`, issue);
  }

  updateIssue(id: string, issueId: string, issue: IssueInput): Observable<DroneDetail> {
    return this.http.put<DroneDetail>(`${this.base}/${id}/issues/${issueId}`, issue);
  }

  addVideo(id: string, video: VideoInput): Observable<DroneDetail> {
    return this.http.post<DroneDetail>(`${this.base}/${id}/videos`, video);
  }

  updateVideo(id: string, videoId: string, video: VideoInput): Observable<DroneDetail> {
    return this.http.put<DroneDetail>(`${this.base}/${id}/videos/${videoId}`, video);
  }

  removeVideo(id: string, videoId: string): Observable<DroneDetail> {
    return this.http.delete<DroneDetail>(`${this.base}/${id}/videos/${videoId}`);
  }
}
