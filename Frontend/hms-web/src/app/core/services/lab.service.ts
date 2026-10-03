import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { TestCatalogDto, TestOrderDto, TestResultDto } from '../models/models';

@Injectable({ providedIn: 'root' })
export class LabService {
  constructor(private http: HttpClient) {}

  catalog(): Observable<TestCatalogDto[]> {
    return this.http.get<TestCatalogDto[]>(`${API_BASE_URL}/lab/catalog`);
  }

  queue(status?: string): Observable<TestOrderDto[]> {
    const params: Record<string, string> = {};
    if (status) params['status'] = status;
    return this.http.get<TestOrderDto[]>(`${API_BASE_URL}/lab/queue`, { params });
  }

  collect(orderId: number): Observable<{ message: string; sampleId: string }> {
    return this.http.post<{ message: string; sampleId: string }>(`${API_BASE_URL}/lab/${orderId}/collect`, {});
  }

  saveResult(orderId: number, parameters: Record<string, string>): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_BASE_URL}/lab/${orderId}/result`, { parameters });
  }

  getResult(orderId: number): Observable<TestResultDto> {
    return this.http.get<TestResultDto>(`${API_BASE_URL}/lab/${orderId}/result`);
  }
}
