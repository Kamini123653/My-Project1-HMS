import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

const REPORTS = [
  { title: 'OPD/IPD Footfall', sub: 'Daily & monthly patient volume trends' },
  { title: 'Revenue by Department', sub: 'Doctor-wise and department-wise revenue' },
  { title: 'Pharmacy Stock & Sales', sub: 'Movement, wastage and reorder trends' },
  { title: 'Bed Occupancy', sub: 'Ward utilization over time' },
  { title: 'Outstanding Payments', sub: 'Overdue and partially paid invoices' },
  { title: 'Insurance Claims', sub: 'Status of submitted TPA claims' },
];

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  template: `
    <div class="pagehead"><div><h1>Reports &amp; Analytics</h1><div class="sub">Daily, department-wise and financial summaries</div></div></div>
    <div class="grid g-3">
      @for (r of reports; track r.title) {
        <div class="card card-b">
          <h3 style="margin-bottom:10px;">{{ r.title }}</h3>
          <div class="sub">{{ r.sub }}</div>
          <button class="btn btn-outline btn-sm" style="margin-top:10px;" (click)="toast.info(r.title + ' — live drill-down report is on the roadmap; live KPI totals are available from each role dashboard today.')">Open Report</button>
        </div>
      }
    </div>
  `
})
export class AdminReportsComponent {
  toast = inject(ToastService);
  reports = REPORTS;
}
