import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-config';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  admin(): Observable<any> { return this.http.get<any>(`${API_BASE_URL}/dashboard/admin`); }
  doctor(): Observable<any> { return this.http.get<any>(`${API_BASE_URL}/dashboard/doctor`); }
  nurse(): Observable<any> { return this.http.get<any>(`${API_BASE_URL}/dashboard/nurse`); }
  reception(): Observable<any> { return this.http.get<any>(`${API_BASE_URL}/dashboard/reception`); }
  pharmacy(): Observable<any> { return this.http.get<any>(`${API_BASE_URL}/dashboard/pharmacy`); }
  lab(): Observable<any> { return this.http.get<any>(`${API_BASE_URL}/dashboard/lab`); }

  billing(from?: string, to?: string): Observable<any> {
    const params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.http.get<any>(`${API_BASE_URL}/dashboard/billing`, { params });
  }

  billingTrend(days: 7 | 30): Observable<{ date: string; amount: number }[]> {
    return this.http.get<{ date: string; amount: number }[]>(`${API_BASE_URL}/dashboard/billing/trend`, { params: { days: days.toString() } });
  }
}
