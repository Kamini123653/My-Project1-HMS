import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { AppointmentDto, DoctorSlotDto } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  constructor(private http: HttpClient) {}

  getAll(date?: string, doctorId?: number): Observable<AppointmentDto[]> {
    const params: Record<string, string> = {};
    if (date) params['date'] = date;
    if (doctorId) params['doctorId'] = doctorId.toString();
    return this.http.get<AppointmentDto[]>(`${API_BASE_URL}/appointments`, { params });
  }

  getSlots(doctorId: number, date: string): Observable<DoctorSlotDto[]> {
    return this.http.get<DoctorSlotDto[]>(`${API_BASE_URL}/appointments/slots`, { params: { doctorId: doctorId.toString(), date } });
  }

  book(req: { patientId: number; doctorId: number; appointmentDate: string; slotTime: string }): Observable<AppointmentDto> {
    return this.http.post<AppointmentDto>(`${API_BASE_URL}/appointments`, req);
  }

  updateStatus(id: number, status: string): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/appointments/${id}/status`, { status });
  }
}
