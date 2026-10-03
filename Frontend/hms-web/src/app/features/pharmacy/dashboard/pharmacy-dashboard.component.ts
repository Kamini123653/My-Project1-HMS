import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PrescriptionQueueDto } from '../../../core/models/models';
import { DashboardService } from '../../../core/services/dashboard.service';
import { PharmacyService } from '../../../core/services/pharmacy.service';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

@Component({
  selector: 'app-pharmacy-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, StatusPillComponent],
  template: `
    <div class="pagehead"><div><h1>Pharmacy Dashboard</h1><div class="sub">Today's dispensing overview</div></div></div>
    @if (data(); as d) {
      <div class="grid g-4" style="margin-bottom:18px;">
        <app-kpi-card label="Prescriptions Today" [value]="d.prescriptionsToday" [delta]="d.pending + ' pending'" />
        <app-kpi-card label="Pharmacy Sales" [value]="'₹' + (d.salesToday | number)" dir="up" />
        <app-kpi-card label="Low Stock Items" [value]="d.lowStockCount" delta="needs reorder" />
        <app-kpi-card label="Expiring in 30 Days" [value]="d.expiringSoon + ' items'" delta="review batch" />
      </div>
    }
    <div class="section-title">Pending Prescriptions</div>
    @for (rx of queue(); track rx.prescriptionId) {
      <div class="queue-item">
        <div class="qmain"><div class="qname">{{ rx.patientName }} <span style="font-weight:400;color:var(--ink-soft);">· {{ rx.patientType }}</span></div>
          <div class="qmeta">{{ rx.itemCount }} items</div></div>
        <app-status-pill [status]="rx.status" />
        <button class="btn btn-sm btn-primary" (click)="router.navigate(['/pharmacy/queue', rx.prescriptionId])">Dispense</button>
      </div>
    }
  `
})
export class PharmacyDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private pharmacyService = inject(PharmacyService);
  router = inject(Router);

  data = signal<any>(null);
  queue = signal<PrescriptionQueueDto[]>([]);

  ngOnInit(): void {
    this.dashboardService.pharmacy().subscribe(d => this.data.set(d));
    this.pharmacyService.queue().subscribe(q => this.queue.set(q));
  }
}
