import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { TestOrderDto } from '../../../core/models/models';
import { LabService } from '../../../core/services/lab.service';
import { ToastService } from '../../../core/services/toast.service';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

@Component({
  selector: 'app-doctor-reports',
  standalone: true,
  imports: [CommonModule, StatusPillComponent],
  template: `
    <div class="pagehead"><div><h1>View Reports</h1><div class="sub">Lab and radiology reports for your patients</div></div></div>
    <div class="card"><div class="card-b" style="padding:0;">
      <table>
        <thead><tr><th>Patient</th><th>Test</th><th>Ordered</th><th>Status</th><th></th></tr></thead>
        <tbody>
          @for (o of orders(); track o.orderId) {
            <tr>
              <td>{{ o.patientName }}</td><td>{{ o.testName }}</td><td>{{ o.orderedAt | date:'d MMM' }}</td>
              <td><app-status-pill [status]="o.status" /></td>
              <td>
                @if (o.status === 'ResultReady') {
                  <button class="btn btn-sm btn-primary" (click)="review(o)">Review</button>
                } @else {
                  <button class="btn btn-sm btn-outline" disabled>Pending</button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div></div>
  `
})
export class DoctorReportsComponent implements OnInit {
  private labService = inject(LabService);
  private toast = inject(ToastService);
  orders = signal<TestOrderDto[]>([]);

  ngOnInit(): void {
    this.labService.queue().subscribe(o => this.orders.set(o));
  }

  review(o: TestOrderDto): void {
    this.labService.getResult(o.orderId).subscribe(r => {
      const data = r.resultData ? JSON.parse(r.resultData) : {};
      const summary = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(', ') || 'No parameters recorded.';
      this.toast.info(`${o.testName} for ${o.patientName} — ${summary}`);
    });
  }
}
