import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InsuranceClaimDto } from '../../../core/models/models';
import { BillingService } from '../../../core/services/billing.service';
import { ToastService } from '../../../core/services/toast.service';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

@Component({
  selector: 'app-billing-insurance',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusPillComponent],
  template: `
    <div class="pagehead"><div><h1>Insurance / TPA Claims</h1><div class="sub">Claim status tracking with adjudicated (approved) amount</div></div></div>

    @if (invoiceId()) {
      <div class="card" style="margin-bottom:16px;max-width:480px;">
        <div class="card-h"><h3>Submit New Claim — Invoice #{{ invoiceId() }}</h3></div>
        <div class="card-b formgrid">
          <div class="field"><label>TPA Name</label><input [(ngModel)]="tpaName" placeholder="e.g. Star Health" /></div>
          <div class="field"><label>Claim Amount (₹)</label><input type="number" [(ngModel)]="claimAmount" /></div>
        </div>
        <div class="card-b" style="padding-top:0;"><button class="btn btn-primary" (click)="submit()">Submit Claim</button></div>
      </div>
    }

    <div class="card"><div class="card-b" style="padding:0;">
      <table>
        <thead><tr><th>Patient</th><th>TPA</th><th>Claim Amount</th><th>Adjudicated Amount</th><th>Status</th><th></th></tr></thead>
        <tbody>
          @for (c of claims(); track c.claimId) {
            <tr>
              <td>{{ c.patientName }}</td><td>{{ c.tpaName }}</td><td class="mono">₹{{ c.claimAmount }}</td>
              <td class="mono">{{ c.adjudicatedAmount ? '₹' + c.adjudicatedAmount : '—' }}</td>
              <td><app-status-pill [status]="c.status" /></td>
              <td style="display:flex;gap:6px;">
                @if (c.status === 'Submitted' || c.status === 'UnderReview') {
                  <button class="btn btn-sm btn-outline" (click)="approve(c)">Approve</button>
                } @else {
                  <button class="btn btn-sm btn-outline" disabled>Tracked</button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div></div>
  `
})
export class BillingInsuranceComponent implements OnInit {
  private billing = inject(BillingService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  claims = signal<InsuranceClaimDto[]>([]);
  invoiceId = signal<number | null>(null);
  tpaName = '';
  claimAmount = 0;

  ngOnInit(): void {
    this.reload();
    this.route.queryParams.subscribe(p => this.invoiceId.set(p['invoiceId'] ? Number(p['invoiceId']) : null));
  }

  reload(): void { this.billing.claims().subscribe(c => this.claims.set(c)); }

  submit(): void {
    const id = this.invoiceId();
    if (!id || !this.tpaName || !this.claimAmount) { this.toast.warn('Please fill in TPA name and claim amount.'); return; }
    this.billing.submitClaim(id, this.tpaName, this.claimAmount).subscribe(() => {
      this.toast.ok('Claim submitted to TPA.');
      this.invoiceId.set(null);
      this.tpaName = '';
      this.claimAmount = 0;
      this.reload();
    });
  }

  approve(c: InsuranceClaimDto): void {
    this.billing.updateClaimStatus(c.claimId, 'Approved', c.claimAmount).subscribe(() => {
      this.toast.ok(`Claim for ${c.patientName} approved.`);
      this.reload();
    });
  }
}
