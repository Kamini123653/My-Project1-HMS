import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { PatientDto, PatientSearchResult } from '../models/models';

export interface RegisterPatientRequest {
  fullName: string;
  dateOfBirth?: string | null;
  gender: string;
  bloodGroup?: string;
  mobile: string;
  emergencyContact?: string;
  address?: string;
  knownAllergies?: string;
}

@Injectable({ providedIn: 'root' })
export class PatientsService {
  constructor(private http: HttpClient) {}

  search(q: string): Observable<PatientSearchResult[]> {
    return this.http.get<PatientSearchResult[]>(`${API_BASE_URL}/patients/search`, { params: { q } });
  }

  getById(id: number): Observable<PatientDto> {
    return this.http.get<PatientDto>(`${API_BASE_URL}/patients/${id}`);
  }

  register(req: RegisterPatientRequest): Observable<PatientDto> {
    return this.http.post<PatientDto>(`${API_BASE_URL}/patients`, req);
  }
}
