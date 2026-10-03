import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { BillingSummaryDto, InsuranceClaimDto, InvoiceDto, PendingBillDto, RecentPaymentDto } from '../models/models';

@Injectable({ providedIn: 'root' })
export class BillingService {
  constructor(private http: HttpClient) {}

  pending(): Observable<PendingBillDto[]> {
    return this.http.get<PendingBillDto[]>(`${API_BASE_URL}/billing/pending`);
  }

  generateOpdBill(appointmentId: number): Observable<InvoiceDto> {
    return this.http.post<InvoiceDto>(`${API_BASE_URL}/billing/opd/generate`, { appointmentId });
  }

  generateIpdBill(admissionId: number): Observable<InvoiceDto> {
    return this.http.post<InvoiceDto>(`${API_BASE_URL}/billing/ipd/generate`, { admissionId });
  }

  getInvoice(id: number): Observable<InvoiceDto> {
    return this.http.get<InvoiceDto>(`${API_BASE_URL}/billing/invoice/${id}`);
  }

  collectPayment(invoiceId: number, amount: number, mode: string): Observable<{ message: string; status: string }> {
    return this.http.post<{ message: string; status: string }>(`${API_BASE_URL}/billing/payment`, { invoiceId, amount, mode });
  }

  recentPayments(): Observable<RecentPaymentDto[]> {
    return this.http.get<RecentPaymentDto[]>(`${API_BASE_URL}/billing/payments/recent`);
  }

  summary(): Observable<BillingSummaryDto> {
    return this.http.get<BillingSummaryDto>(`${API_BASE_URL}/billing/summary`);
  }

  claims(): Observable<InsuranceClaimDto[]> {
    return this.http.get<InsuranceClaimDto[]>(`${API_BASE_URL}/billing/insurance-claims`);
  }

  submitClaim(invoiceId: number, tpaName: string, claimAmount: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_BASE_URL}/billing/insurance-claims`, { invoiceId, tpaName, claimAmount });
  }

  updateClaimStatus(id: number, status: string, adjudicatedAmount?: number): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/billing/insurance-claims/${id}/status`, { status, adjudicatedAmount });
  }
}
