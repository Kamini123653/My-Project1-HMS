import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { TestOrderDto } from '../../../core/models/models';
import { LabService } from '../../../core/services/lab.service';
import { ToastService } from '../../../core/services/toast.service';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

@Component({
  selector: 'app-lab-collection',
  standalone: true,
  imports: [CommonModule, StatusPillComponent],
  template: `
    <div class="pagehead"><div><h1>Sample Collection Entry</h1><div class="sub">Mark samples as collected for pending orders</div></div></div>
    <div class="card"><div class="card-b" style="padding:0;">
      <table>
        <thead><tr><th>Order ID</th><th>Patient</th><th>Test</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          @for (o of pending(); track o.orderId) {
            <tr>
              <td class="mono">LAB-{{ o.orderId }}</td><td>{{ o.patientName }}</td><td>{{ o.testName }}</td>
              <td><app-status-pill [status]="o.status" /></td>
              <td><button class="btn btn-sm btn-primary" (click)="collect(o)">Mark Collected</button></td>
            </tr>
          }
          @if (pending().length === 0) {
            <tr><td colspan="5" class="empty">No pending sample collections.</td></tr>
          }
        </tbody>
      </table>
    </div></div>
  `
})
export class LabCollectionComponent implements OnInit {
  private labService = inject(LabService);
  private toast = inject(ToastService);
  pending = signal<TestOrderDto[]>([]);

  ngOnInit(): void { this.reload(); }
  reload(): void { this.labService.queue('Pending').subscribe(o => this.pending.set(o)); }

  collect(o: TestOrderDto): void {
    this.labService.collect(o.orderId).subscribe(res => { this.toast.ok(res.message); this.reload(); });
  }
}
