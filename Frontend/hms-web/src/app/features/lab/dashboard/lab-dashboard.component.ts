import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TestOrderDto } from '../../../core/models/models';
import { DashboardService } from '../../../core/services/dashboard.service';
import { LabService } from '../../../core/services/lab.service';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

@Component({
  selector: 'app-lab-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, StatusPillComponent],
  template: `
    <div class="pagehead"><div><h1>Diagnostics Dashboard</h1><div class="sub">Unified Lab &amp; Radiology testing overview — today</div></div></div>
    @if (data(); as d) {
      <div class="grid g-4" style="margin-bottom:18px;">
        <app-kpi-card label="Tests Ordered Today" [value]="d.ordersToday" />
        <app-kpi-card label="Samples Pending" [value]="d.samplesPending" />
        <app-kpi-card label="Results Pending Entry" [value]="d.resultsPending" />
        <app-kpi-card label="Reports Sent" [value]="d.reportsSentToday" delta="to doctors" dir="up" />
      </div>
    }
    <div class="section-title">Test Order Queue</div>
    @for (t of orders(); track t.orderId) {
      <div class="queue-item">
        <div class="qmain"><div class="qname">{{ t.patientName }} <span class="pill" [class]="t.type === 'Radiology' ? 'pill-info' : ''" style="margin-left:6px;">{{ t.type }}</span></div>
          <div class="qmeta">{{ t.testName }} · ordered by {{ t.orderedBy }}</div></div>
        <app-status-pill [status]="t.status" />
        <button class="btn btn-sm btn-primary" (click)="router.navigate(['/lab/queue', t.orderId])">Open</button>
      </div>
    }
  `
})
export class LabDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private labService = inject(LabService);
  router = inject(Router);

  data = signal<any>(null);
  orders = signal<TestOrderDto[]>([]);

  ngOnInit(): void {
    this.dashboardService.lab().subscribe(d => this.data.set(d));
    this.labService.queue().subscribe(o => this.orders.set(o));
  }
}
