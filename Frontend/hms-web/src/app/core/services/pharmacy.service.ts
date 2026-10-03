import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { LowStockDto, MedicineInventoryDto, PrescriptionDetailDto, PrescriptionQueueDto, VendorDto } from '../models/models';

export interface StockEntryRequest {
  vendorId: number;
  invoiceNumber: string;
  medicineId: number;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
}

@Injectable({ providedIn: 'root' })
export class PharmacyService {
  constructor(private http: HttpClient) {}

  queue(): Observable<PrescriptionQueueDto[]> {
    return this.http.get<PrescriptionQueueDto[]>(`${API_BASE_URL}/pharmacy/queue`);
  }

  detail(prescriptionId: number): Observable<PrescriptionDetailDto> {
    return this.http.get<PrescriptionDetailDto>(`${API_BASE_URL}/pharmacy/${prescriptionId}`);
  }

  dispense(prescriptionId: number, prescriptionItemIds: number[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_BASE_URL}/pharmacy/${prescriptionId}/dispense`, { prescriptionItemIds });
  }

  inventory(): Observable<MedicineInventoryDto[]> {
    return this.http.get<MedicineInventoryDto[]>(`${API_BASE_URL}/pharmacy/inventory`);
  }

  lowStock(): Observable<LowStockDto[]> {
    return this.http.get<LowStockDto[]>(`${API_BASE_URL}/pharmacy/low-stock`);
  }

  vendors(): Observable<VendorDto[]> {
    return this.http.get<VendorDto[]>(`${API_BASE_URL}/pharmacy/vendors`);
  }

  stockEntry(req: StockEntryRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_BASE_URL}/pharmacy/stock-entry`, req);
  }
}
