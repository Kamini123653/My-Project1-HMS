import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { ConsultationHistoryDto, MedicineOptionDto, VitalDto } from '../models/models';

export interface RecordVitalsRequest {
  patientId: number;
  appointmentId?: number | null;
  admissionId?: number | null;
  bloodPressure?: string;
  pulse?: string;
  temperature?: string;
  spO2?: string;
  respiratoryRate?: string;
  weight?: string;
  notes?: string;
}

export interface SaveConsultationRequest {
  patientId: number;
  appointmentId?: number | null;
  admissionId?: number | null;
  chiefComplaint?: string;
  diagnosis?: string;
  medicines: { medicineId: number; dosage?: string; duration?: string; quantity: number }[];
}

@Injectable({ providedIn: 'root' })
export class VitalsService {
  constructor(private http: HttpClient) {}

  getForPatient(patientId: number): Observable<VitalDto[]> {
    return this.http.get<VitalDto[]>(`${API_BASE_URL}/vitals/patient/${patientId}`);
  }

  record(req: RecordVitalsRequest): Observable<VitalDto> {
    return this.http.post<VitalDto>(`${API_BASE_URL}/vitals`, req);
  }
}

@Injectable({ providedIn: 'root' })
export class ConsultationsService {
  constructor(private http: HttpClient) {}

  history(patientId: number): Observable<ConsultationHistoryDto[]> {
    return this.http.get<ConsultationHistoryDto[]>(`${API_BASE_URL}/consultations/patient/${patientId}/history`);
  }

  save(req: SaveConsultationRequest): Observable<{ consultationId: number; prescriptionId?: number }> {
    return this.http.post<{ consultationId: number; prescriptionId?: number }>(`${API_BASE_URL}/consultations`, req);
  }

  orderTest(patientId: number, testId: number, consultationId?: number): Observable<{ orderId: number; message: string }> {
    return this.http.post<{ orderId: number; message: string }>(`${API_BASE_URL}/consultations/order-test`, { patientId, testId, consultationId });
  }
}

@Injectable({ providedIn: 'root' })
export class MedicinesService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<MedicineOptionDto[]> {
    return this.http.get<MedicineOptionDto[]>(`${API_BASE_URL}/medicines`);
  }
}
