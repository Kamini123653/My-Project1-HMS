import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TestOrderDto } from '../../../core/models/models';
import { LabService } from '../../../core/services/lab.service';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

@Component({
  selector: 'app-lab-queue',
  standalone: true,
  imports: [CommonModule, StatusPillComponent],
  template: `
    <div class="pagehead"><div><h1>Test Order Queue</h1><div class="sub">Incoming Lab &amp; Radiology orders from doctors</div></div></div>
    <div class="card"><div class="card-b" style="padding:0;">
      <table>
        <thead><tr><th>Order ID</th><th>Patient</th><th>Test</th><th>Type</th><th>Ordered By</th><th>Status</th><th></th></tr></thead>
        <tbody>
          @for (t of orders(); track t.orderId) {
            <tr class="clickable" (click)="open(t)">
              <td class="mono">LAB-{{ t.orderId }}</td><td>{{ t.patientName }}</td><td>{{ t.testName }}</td><td>{{ t.type }}</td><td>{{ t.orderedBy }}</td>
              <td><app-status-pill [status]="t.status" /></td>
              <td><button class="btn btn-sm btn-primary" (click)="open(t); $event.stopPropagation()">Open</button></td>
            </tr>
          }
        </tbody>
      </table>
    </div></div>
  `
})
export class LabQueueComponent implements OnInit {
  private labService = inject(LabService);
  router = inject(Router);
  orders = signal<TestOrderDto[]>([]);

  ngOnInit(): void { this.labService.queue().subscribe(o => this.orders.set(o)); }
  open(t: TestOrderDto): void { this.router.navigate(['/lab/queue', t.orderId]); }
}
