import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent],
  template: `
    <div class="pagehead"><div><h1>Admin Dashboard</h1><div class="sub">City Care Hospital · overview</div></div></div>
    @if (data(); as d) {
      <div class="grid g-4" style="margin-bottom:18px;">
        <app-kpi-card label="Patients Today" [value]="d.patientsToday" />
        <app-kpi-card label="Revenue Today" [value]="'₹' + (d.revenueToday | number)" />
        <app-kpi-card label="Bed Occupancy" [value]="d.bedOccupancy" />
        <app-kpi-card label="Pending Claims" [value]="'₹' + (d.pendingClaims | number)" [delta]="d.pendingClaimsCount + ' claims'" />
      </div>
      <div class="grid g-2">
        <div class="card">
          <div class="card-h"><h3>Department-wise Footfall</h3><span class="pill pill-info">Today</span></div>
          <div class="card-b">
            @if (d.footfall.length === 0) {
              <div class="empty"><div class="ic">📊</div>No appointments booked yet today.</div>
            }
            @for (f of d.footfall; track f.department) {
              <div style="margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px;">
                  <span>{{ f.department }}</span><span class="mono">{{ f.count }}</span>
                </div>
                <div style="height:6px;background:var(--paper);border-radius:4px;overflow:hidden;">
                  <div style="height:100%;background:var(--teal);" [style.width.%]="pct(f.count)"></div>
                </div>
              </div>
            }
          </div>
        </div>
        <div class="card">
          <div class="card-h"><h3>Alerts</h3></div>
          <div class="card-b">
            @for (a of d.lowStockAlerts; track a.name) {
              <div class="queue-item">
                <div class="qavatar" style="background:var(--warn-bg);color:var(--warn);">⚠</div>
                <div class="qmain"><div class="qname">Low stock — {{ a.name }}</div><div class="qmeta">{{ a.stock }} units left</div></div>
                <button class="btn btn-sm btn-outline" (click)="router.navigateByUrl('/pharmacy/lowstock')">View</button>
              </div>
            }
            <div class="queue-item">
              <div class="qavatar" style="background:var(--danger-bg);color:var(--danger);">🛏</div>
              <div class="qmain"><div class="qname">Bed occupancy at {{ d.icuOccupancyPct }}%</div><div class="qmeta">Across all wards</div></div>
              <button class="btn btn-sm btn-outline" (click)="router.navigateByUrl('/admin/wards')">View</button>
            </div>
            @if (d.pendingClaimsCount > 0) {
              <div class="queue-item">
                <div class="qavatar" style="background:var(--info-bg);color:var(--info);">🛡</div>
                <div class="qmain"><div class="qname">{{ d.pendingClaimsCount }} insurance claims pending TPA review</div></div>
                <button class="btn btn-sm btn-outline" (click)="router.navigateByUrl('/billing/insurance')">View</button>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class AdminDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  router = inject(Router);
  data = signal<any>(null);

  ngOnInit(): void {
    this.dashboardService.admin().subscribe(d => this.data.set(d));
  }

  pct(count: number): number {
    const max = Math.max(...(this.data()?.footfall.map((f: any) => f.count) ?? [1]), 1);
    return Math.round((count / max) * 100);
  }
}
