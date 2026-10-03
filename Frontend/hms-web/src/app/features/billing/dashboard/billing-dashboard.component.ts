import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InsuranceClaimDto, PendingBillDto, RecentPaymentDto } from '../../../core/models/models';
import { BillingService } from '../../../core/services/billing.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ToastService } from '../../../core/services/toast.service';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

interface AgingBucketDto {
  bucket: string;
  amount: number;
  count: number;
}

interface BillingDashboardDto {
  collected: number;
  outstanding: number;
  insurancePending: number;
  insurancePendingCount: number;
  invoicesInRange: number;
  outstandingAging: AgingBucketDto[];
}

interface TrendPoint {
  date: string;
  amount: number;
}

function todayIso(): string {
  return new Date().toISOString().substring(0, 10);
}

@Component({
  selector: 'app-billing-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, KpiCardComponent, StatusPillComponent],
  template: `
    <div class="pagehead">
      <div><h1>Accounts Dashboard</h1><div class="sub">Billing &amp; collections overview</div></div>
    </div>

    <div class="card" style="margin-bottom:18px;"><div class="card-b" style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end;">
      <div class="field"><label>From</label><input type="date" [(ngModel)]="from" [max]="to" (ngModelChange)="loadSummary()" /></div>
      <div class="field"><label>To</label><input type="date" [(ngModel)]="to" [min]="from" [max]="maxDate" (ngModelChange)="loadSummary()" /></div>
      <button class="btn btn-outline btn-sm" (click)="resetToToday()">Reset to Today</button>
      <div class="sub" style="margin-left:auto;">Range applies to Collected &amp; Invoices below · Outstanding is always current balance</div>
    </div></div>

    @if (data(); as d) {
      <div class="grid g-4" style="margin-bottom:18px;">
        <app-kpi-card label="Collected (range)" [value]="'₹' + (d.collected | number)" dir="up" />
        <app-kpi-card label="Outstanding" [value]="'₹' + (d.outstanding | number)" />
        <app-kpi-card label="Insurance Pending" [value]="'₹' + (d.insurancePending | number)" [delta]="d.insurancePendingCount + ' claims'" />
        <app-kpi-card label="Invoices (range)" [value]="d.invoicesInRange" />
      </div>
    } @else if (loadError()) {
      <div class="card empty" style="margin-bottom:18px;"><div class="ic">⚠</div>{{ loadError() }}</div>
    }

    <div class="grid g-2" style="margin-bottom:18px;">
      <div class="card">
        <div class="card-h"><h3>Revenue Trend</h3>
          <div class="tabs" style="border:none;margin:0;">
            <div class="tab" [class.active]="trendDays() === 7" (click)="setTrendDays(7)">7 days</div>
            <div class="tab" [class.active]="trendDays() === 30" (click)="setTrendDays(30)">30 days</div>
          </div>
        </div>
        <div class="card-b">
          @if (trendError()) {
            <div class="empty">⚠ {{ trendError() }}</div>
          } @else if (trend().length === 0) {
            <div class="empty">No collections recorded in this period.</div>
          } @else {
            <div style="display:flex; align-items:flex-end; gap:3px; height:140px;">
              @for (t of trend(); track t.date) {
                <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%;" [title]="t.date + ': ₹' + t.amount">
                  <div style="width:100%; background:var(--teal); border-radius:3px 3px 0 0; min-height:2px;" [style.height.%]="trendBarPct(t.amount)"></div>
                </div>
              }
            </div>
            <div class="sub" style="display:flex; justify-content:space-between; margin-top:8px; font-size:10.5px;">
              <span>{{ trend()[0].date | date:'d MMM' }}</span>
              <span>{{ trend()[trend().length - 1].date | date:'d MMM' }}</span>
            </div>
          }
        </div>
      </div>

      <div class="card">
        <div class="card-h"><h3>Outstanding by Age</h3></div>
        <div class="card-b">
          @if (data(); as d) {
            @for (bucket of d.outstandingAging; track bucket.bucket) {
              <div class="queue-item">
                <div class="qmain"><div class="qname">{{ bucket.bucket }}</div><div class="qmeta">{{ bucket.count }} invoice{{ bucket.count === 1 ? '' : 's' }}</div></div>
                <span class="pill" [class]="agingPillClass(bucket.bucket)">₹{{ bucket.amount | number }}</span>
              </div>
            }
            @if (d.outstandingAging.length === 0 || totalAging(d) === 0) {
              <div class="empty">No outstanding balances.</div>
            }
          } @else {
            <div class="empty">—</div>
          }
        </div>
      </div>
    </div>

    <div class="grid g-2" style="margin-bottom:18px;">
      <div class="card"><div class="card-h"><h3>Pending Bills</h3></div>
        <div class="card-b" style="padding:0;">
          <table>
            <thead><tr><th>Patient</th><th>Type</th><th>Amount</th><th></th></tr></thead>
            <tbody>
              @for (b of pending(); track (b.appointmentId ?? 0) + '-' + (b.admissionId ?? 0)) {
                <tr>
                  <td>{{ b.patientName }}</td><td>{{ b.type }}</td><td class="mono">₹{{ b.estimatedAmount }}</td>
                  <td><button class="btn btn-sm btn-primary" (click)="router.navigateByUrl('/billing/consolidated')">Bill</button></td>
                </tr>
              }
              @if (pending().length === 0 && !pendingError()) {
                <tr><td colspan="4" class="empty">No pending bills right now.</td></tr>
              }
              @if (pendingError()) {
                <tr><td colspan="4" class="empty">⚠ {{ pendingError() }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
      <div class="card card-b"><h3 style="margin-bottom:12px;">Quick Actions</h3>
        <button class="btn btn-primary" style="width:100%;margin-bottom:8px;" (click)="router.navigateByUrl('/billing/consolidated')">Generate Consolidated Bill</button>
        <button class="btn btn-outline" style="width:100%;margin-bottom:8px;" (click)="router.navigateByUrl('/billing/insurance')">Submit Insurance Claim</button>
        <button class="btn btn-outline" style="width:100%;" (click)="router.navigateByUrl('/billing/reports')">View Financial Reports</button>
      </div>
    </div>

    <div class="grid g-2">
      <div class="card">
        <div class="card-h"><h3>Recent Payments</h3><a class="crumb" style="cursor:pointer;" (click)="router.navigateByUrl('/billing/payments')">View all</a></div>
        <div class="card-b" style="padding:0;">
          <table>
            <thead><tr><th>Invoice</th><th>Patient</th><th>Mode</th><th style="text-align:right;">Amount</th><th>Status</th></tr></thead>
            <tbody>
              @for (p of recentPayments(); track p.invoiceNumber + p.paidAt) {
                <tr>
                  <td class="mono">{{ p.invoiceNumber }}</td><td>{{ p.patientName }}</td><td>{{ p.mode }}</td>
                  <td class="mono" style="text-align:right;">₹{{ p.amount | number }}</td>
                  <td><app-status-pill [status]="p.status" /></td>
                </tr>
              }
              @if (recentPayments().length === 0 && !paymentsError()) {
                <tr><td colspan="5" class="empty">No payments recorded yet.</td></tr>
              }
              @if (paymentsError()) {
                <tr><td colspan="5" class="empty">⚠ {{ paymentsError() }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-h"><h3>Insurance Claims Snapshot</h3><a class="crumb" style="cursor:pointer;" (click)="router.navigateByUrl('/billing/insurance')">View all</a></div>
        <div class="card-b">
          @if (claimsError()) {
            <div class="empty">⚠ {{ claimsError() }}</div>
          } @else if (claims().length === 0) {
            <div class="empty">No insurance claims submitted yet.</div>
          } @else {
            @for (statusGroup of claimStatusCounts(); track statusGroup.status) {
              <div class="queue-item">
                <div class="qmain"><div class="qname">{{ statusGroup.status }}</div><div class="qmeta">{{ statusGroup.count }} claim{{ statusGroup.count === 1 ? '' : 's' }} · ₹{{ statusGroup.amount | number }}</div></div>
                <app-status-pill [status]="statusGroup.status" />
              </div>
            }
          }
        </div>
      </div>
    </div>
  `
})
export class BillingDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private billingService = inject(BillingService);
  private toast = inject(ToastService);
  router = inject(Router);

  maxDate = todayIso();
  from = todayIso();
  to = todayIso();

  data = signal<BillingDashboardDto | null>(null);
  loadError = signal<string | null>(null);

  trendDays = signal<7 | 30>(7);
  trend = signal<TrendPoint[]>([]);
  trendError = signal<string | null>(null);

  pending = signal<PendingBillDto[]>([]);
  pendingError = signal<string | null>(null);

  recentPayments = signal<RecentPaymentDto[]>([]);
  paymentsError = signal<string | null>(null);

  claims = signal<InsuranceClaimDto[]>([]);
  claimsError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadSummary();
    this.loadTrend();

    this.billingService.pending().subscribe({
      next: p => this.pending.set(p),
      error: (err) => this.pendingError.set(err.error?.message ?? `Could not load pending bills (HTTP ${err.status}).`)
    });

    this.billingService.recentPayments().subscribe({
      next: p => this.recentPayments.set(p.slice(0, 6)),
      error: (err) => this.paymentsError.set(err.error?.message ?? `Could not load recent payments (HTTP ${err.status}).`)
    });

    this.billingService.claims().subscribe({
      next: c => this.claims.set(c),
      error: (err) => this.claimsError.set(err.error?.message ?? `Could not load insurance claims (HTTP ${err.status}).`)
    });
  }

  loadSummary(): void {
    this.dashboardService.billing(this.from, this.to).subscribe({
      next: d => { this.data.set(d); this.loadError.set(null); },
      error: (err) => {
        const msg = err.error?.message ?? `Could not load billing summary (HTTP ${err.status}).`;
        this.loadError.set(msg);
        this.toast.danger(msg);
      }
    });
  }

  resetToToday(): void {
    this.from = todayIso();
    this.to = todayIso();
    this.loadSummary();
  }

  setTrendDays(days: 7 | 30): void {
    this.trendDays.set(days);
    this.loadTrend();
  }

  loadTrend(): void {
    this.dashboardService.billingTrend(this.trendDays()).subscribe({
      next: t => { this.trend.set(t); this.trendError.set(null); },
      error: (err) => this.trendError.set(err.error?.message ?? `Could not load revenue trend (HTTP ${err.status}).`)
    });
  }

  trendBarPct(amount: number): number {
    const max = Math.max(...this.trend().map(t => t.amount), 1);
    return Math.max(2, Math.round((amount / max) * 100));
  }

  totalAging(d: BillingDashboardDto): number {
    return d.outstandingAging.reduce((sum, b) => sum + b.amount, 0);
  }

  agingPillClass(bucket: string): string {
    if (bucket.startsWith('0')) return 'pill-ok';
    if (bucket.startsWith('8')) return 'pill-warn';
    return 'pill-danger';
  }

  claimStatusCounts(): { status: string; count: number; amount: number }[] {
    const groups = new Map<string, { count: number; amount: number }>();
    for (const c of this.claims()) {
      const g = groups.get(c.status) ?? { count: 0, amount: 0 };
      g.count += 1;
      g.amount += c.claimAmount;
      groups.set(c.status, g);
    }
    return Array.from(groups.entries()).map(([status, v]) => ({ status, ...v }));
  }
}
