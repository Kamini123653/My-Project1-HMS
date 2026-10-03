import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InvoiceDto, PendingBillDto } from '../../../core/models/models';
import { BillingService } from '../../../core/services/billing.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reception-bill',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pagehead"><div><h1>Generate OPD Bill</h1><div class="sub">Consultation fee collection at check-in</div></div></div>

    @if (!invoice()) {
      <div class="card"><div class="card-h"><h3>Pending OPD Bills</h3></div>
        <div class="card-b" style="padding:0;">
          @if (pendingOpd().length === 0) {
            <div class="empty"><div class="ic">₹</div>No pending OPD bills right now.</div>
          }
          <table>
            <thead><tr><th>Patient</th><th>Estimated Amount</th><th></th></tr></thead>
            <tbody>
              @for (b of pendingOpd(); track b.appointmentId) {
                <tr><td>{{ b.patientName }}</td><td class="mono">₹{{ b.estimatedAmount }}</td>
                  <td><button class="btn btn-sm btn-primary" (click)="generate(b)">Generate Bill</button></td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    } @else {
      <div class="card" style="max-width:480px;">
        <div class="card-h"><h3>{{ invoice()!.patientName }} · Invoice #{{ invoice()!.invoiceNumber }}</h3></div>
        <div class="card-b">
          @for (line of invoice()!.items; track line.description) {
            <div style="display:flex;justify-content:space-between;font-size:13.5px;margin-bottom:8px;">
              <span>{{ line.description }}</span><span class="mono">₹{{ line.amount }}</span>
            </div>
          }
          <hr style="border:none;border-top:1px solid var(--line);margin:10px 0;" />
          <div style="display:flex;justify-content:space-between;font-weight:700;font-size:15px;">
            <span>Total</span><span class="mono">₹{{ invoice()!.totalAmount }}</span>
          </div>
          <div class="field" style="margin-top:14px;"><label>Payment Mode</label>
            <select [(ngModel)]="paymentMode"><option>Cash</option><option>Card</option><option>UPI</option></select>
          </div>
          <button class="btn btn-primary" style="width:100%;margin-top:12px;" (click)="collect()">Collect Payment &amp; Print Receipt</button>
          <button class="btn btn-outline" style="width:100%;margin-top:8px;" (click)="invoice.set(null); reload();">Back to Pending Bills</button>
        </div>
      </div>
    }
  `
})
export class ReceptionBillComponent implements OnInit {
  private billing = inject(BillingService);
  private toast = inject(ToastService);

  pendingOpd = signal<PendingBillDto[]>([]);
  invoice = signal<InvoiceDto | null>(null);
  paymentMode = 'Cash';

  ngOnInit(): void { this.reload(); }

  reload(): void {
    this.billing.pending().subscribe(list => this.pendingOpd.set(list.filter(b => b.type === 'OPD')));
  }

  generate(b: PendingBillDto): void {
    if (!b.appointmentId) return;
    this.billing.generateOpdBill(b.appointmentId).subscribe(inv => this.invoice.set(inv));
  }

  collect(): void {
    const inv = this.invoice();
    if (!inv) return;
    this.billing.collectPayment(inv.invoiceId, inv.totalAmount - inv.paidAmount, this.paymentMode).subscribe(res => {
      this.toast.ok(`Payment received. Invoice #${inv.invoiceNumber} ${res.status.toLowerCase()}.`);
      this.invoice.set(null);
      this.reload();
    });
  }
}
