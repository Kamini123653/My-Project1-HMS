import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TestOrderDto } from '../../../core/models/models';
import { LabService } from '../../../core/services/lab.service';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

@Component({
  selector: 'app-lab-results',
  standalone: true,
  imports: [CommonModule, StatusPillComponent],
  template: `
    <div class="pagehead"><div><h1>Enter Test Results</h1><div class="sub">Samples collected and awaiting result entry</div></div></div>
    <div class="card"><div class="card-b" style="padding:0;">
      <table>
        <thead><tr><th>Order ID</th><th>Patient</th><th>Test</th><th>Status</th><th></th></tr></thead>
        <tbody>
          @for (o of orders(); track o.orderId) {
            <tr class="clickable" (click)="router.navigate(['/lab/queue', o.orderId])">
              <td class="mono">LAB-{{ o.orderId }}</td><td>{{ o.patientName }}</td><td>{{ o.testName }}</td>
              <td><app-status-pill [status]="o.status" /></td>
              <td><button class="btn btn-sm btn-primary" (click)="router.navigate(['/lab/queue', o.orderId]); $event.stopPropagation()">
                {{ o.status === 'Collected' ? 'Enter Results' : 'View Report' }}</button></td>
            </tr>
          }
        </tbody>
      </table>
    </div></div>
  `
})
export class LabResultsComponent implements OnInit {
  private labService = inject(LabService);
  router = inject(Router);
  orders = signal<TestOrderDto[]>([]);

  ngOnInit(): void {
    this.labService.queue().subscribe(list => this.orders.set(list.filter(o => o.status !== 'Pending')));
  }
}
