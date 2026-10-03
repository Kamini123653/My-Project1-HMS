import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RecentPaymentDto } from '../../../core/models/models';
import { BillingService } from '../../../core/services/billing.service';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

@Component({
  selector: 'app-billing-payments',
  standalone: true,
  imports: [CommonModule, StatusPillComponent],
  template: `
    <div class="pagehead"><div><h1>Payment Collection</h1><div class="sub">Recent payments across all patients</div></div></div>
    <div class="card"><div class="card-b" style="padding:0;">
      <table>
        <thead><tr><th>Invoice</th><th>Patient</th><th>Mode</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>
          @for (p of payments(); track p.invoiceNumber + p.paidAt) {
            <tr>
              <td class="mono">{{ p.invoiceNumber }}</td><td>{{ p.patientName }}</td><td>{{ p.mode }}</td>
              <td class="mono">₹{{ p.amount }}</td><td><app-status-pill [status]="p.status" /></td>
            </tr>
          }
          @if (payments().length === 0) {
            <tr><td colspan="5" class="empty">No payments recorded yet.</td></tr>
          }
        </tbody>
      </table>
    </div></div>
  `
})
export class BillingPaymentsComponent implements OnInit {
  private billing = inject(BillingService);
  payments = signal<RecentPaymentDto[]>([]);
  ngOnInit(): void { this.billing.recentPayments().subscribe(p => this.payments.set(p)); }
}
