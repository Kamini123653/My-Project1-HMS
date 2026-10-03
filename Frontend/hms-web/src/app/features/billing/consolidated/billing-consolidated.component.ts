import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoiceDto, PendingBillDto } from '../../../core/models/models';
import { BillingService } from '../../../core/services/billing.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-billing-consolidated',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pagehead"><div><h1>Consolidated Billing</h1><div class="sub">Auto-aggregated from consultation, pharmacy, lab and room charges</div></div></div>

    @if (!invoice()) {
      <div class="card"><div class="card-h"><h3>Pending Bills</h3></div>
        <div class="card-b" style="padding:0;">
          @if (pending().length === 0) {
            <div class="empty"><div class="ic">₹</div>No pending bills right now.</div>
          }
          <table>
            <thead><tr><th>Patient</th><th>Type</th><th>Estimated Amount</th><th></th></tr></thead>
            <tbody>
              @for (b of pending(); track (b.appointmentId ?? 0) + '-' + (b.admissionId ?? 0)) {
                <tr>
                  <td>{{ b.patientName }}</td><td>{{ b.type }}</td><td class="mono">₹{{ b.estimatedAmount }}</td>
                  <td><button class="btn btn-sm btn-primary" (click)="generate(b)">Generate Bill</button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    } @else {
      <div class="grid g-2" style="align-items:start;">
        <div class="card"><div class="card-h"><h3>Invoice #{{ invoice()!.invoiceNumber }} — {{ invoice()!.invoiceType }}</h3></div>
          <div class="card-b" style="padding:0;">
            <table>
              <thead><tr><th>Charge</th><th style="text-align:right;">Amount</th></tr></thead>
              <tbody>
                @for (line of invoice()!.items; track line.description) {
                  <tr><td>{{ line.description }}</td><td style="text-align:right;" class="mono">₹{{ line.amount }}</td></tr>
                }
              </tbody>
              <tfoot>
                <tr><td style="font-weight:700;">Total</td><td style="text-align:right;font-weight:700;" class="mono">₹{{ invoice()!.totalAmount }}</td></tr>
                @if (invoice()!.paidAmount > 0) {
                  <tr><td>Already Paid</td><td style="text-align:right;" class="mono">₹{{ invoice()!.paidAmount }}</td></tr>
                }
              </tfoot>
            </table>
          </div>
        </div>
        <div class="card card-b">
          <h3 style="margin-bottom:12px;">Payment</h3>
          <div class="field" style="margin-bottom:10px;"><label>Payment Mode</label>
            <select [(ngModel)]="paymentMode"><option>Cash</option><option>Card</option><option>UPI</option><option>Insurance / TPA</option></select>
          </div>
          <button class="btn btn-primary" style="width:100%;" (click)="collect()">Collect Payment &amp; Generate Invoice</button>
          <button class="btn btn-outline" style="width:100%;margin-top:8px;" (click)="router.navigate(['/billing/insurance'], { queryParams: { invoiceId: invoice()!.invoiceId } })">Submit to Insurance Instead</button>
          <button class="btn btn-outline" style="width:100%;margin-top:8px;" (click)="invoice.set(null); reload();">Back to Pending Bills</button>
        </div>
      </div>
    }
  `
})
export class BillingConsolidatedComponent implements OnInit {
  private billing = inject(BillingService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  pending = signal<PendingBillDto[]>([]);
  invoice = signal<InvoiceDto | null>(null);
  paymentMode = 'Cash';

  ngOnInit(): void {
    this.reload();
    this.route.queryParams.subscribe(params => {
      const admissionId = params['admissionId'] ? Number(params['admissionId']) : undefined;
      if (admissionId) this.billing.generateIpdBill(admissionId).subscribe(inv => this.invoice.set(inv));
    });
  }

  reload(): void { this.billing.pending().subscribe(list => this.pending.set(list)); }

  generate(b: PendingBillDto): void {
    if (b.appointmentId) {
      this.billing.generateOpdBill(b.appointmentId).subscribe(inv => this.invoice.set(inv));
    } else if (b.admissionId) {
      this.billing.generateIpdBill(b.admissionId).subscribe(inv => this.invoice.set(inv));
    }
  }

  collect(): void {
    const inv = this.invoice();
    if (!inv) return;
    const amountDue = inv.totalAmount - inv.paidAmount;
    this.billing.collectPayment(inv.invoiceId, amountDue, this.paymentMode).subscribe(res => {
      this.toast.ok(`Payment recorded. Invoice #${inv.invoiceNumber} generated. Patient ledger updated.`);
      this.invoice.set(null);
      this.reload();
    });
  }
}
