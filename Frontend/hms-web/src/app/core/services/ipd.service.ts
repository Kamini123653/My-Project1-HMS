import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { IPDAdmissionDto } from '../models/models';

export interface AdmitPatientRequest {
  patientId: number;
  doctorId: number;
  admissionType: string;
  initialDiagnosis?: string;
  wardId: number;
  attendantName?: string;
  attendantContact?: string;
  advanceDeposit: number;
}

@Injectable({ providedIn: 'root' })
export class IpdService {
  constructor(private http: HttpClient) {}

  getAll(status?: string): Observable<IPDAdmissionDto[]> {
    const params: Record<string, string> = {};
    if (status) params['status'] = status;
    return this.http.get<IPDAdmissionDto[]>(`${API_BASE_URL}/ipd`, { params });
  }

  admit(req: AdmitPatientRequest): Observable<IPDAdmissionDto> {
    return this.http.post<IPDAdmissionDto>(`${API_BASE_URL}/ipd/admit`, req);
  }

  adviseDischarge(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${API_BASE_URL}/ipd/${id}/advise-discharge`, {});
  }

  finalizeDischarge(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${API_BASE_URL}/ipd/${id}/finalize-discharge`, {});
  }
}
