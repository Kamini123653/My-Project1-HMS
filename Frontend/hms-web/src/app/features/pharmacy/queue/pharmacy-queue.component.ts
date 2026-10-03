import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PrescriptionQueueDto } from '../../../core/models/models';
import { PharmacyService } from '../../../core/services/pharmacy.service';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

@Component({
  selector: 'app-pharmacy-queue',
  standalone: true,
  imports: [CommonModule, StatusPillComponent],
  template: `
    <div class="pagehead"><div><h1>Prescription Queue</h1><div class="sub">OPD + IPD orders awaiting dispensing</div></div></div>
    <div class="card"><div class="card-b" style="padding:0;">
      <table>
        <thead><tr><th>Rx ID</th><th>Patient</th><th>Type</th><th>Items</th><th>Status</th><th></th></tr></thead>
        <tbody>
          @for (rx of queue(); track rx.prescriptionId) {
            <tr class="clickable" (click)="open(rx)">
              <td class="mono">RX-{{ rx.prescriptionId }}</td><td>{{ rx.patientName }}</td><td>{{ rx.patientType }}</td><td>{{ rx.itemCount }}</td>
              <td><app-status-pill [status]="rx.status" /></td>
              <td><button class="btn btn-sm btn-primary" (click)="open(rx); $event.stopPropagation()">Dispense</button></td>
            </tr>
          }
          @if (queue().length === 0) {
            <tr><td colspan="6" class="empty">No pending prescriptions.</td></tr>
          }
        </tbody>
      </table>
    </div></div>
  `
})
export class PharmacyQueueComponent implements OnInit {
  private pharmacyService = inject(PharmacyService);
  router = inject(Router);
  queue = signal<PrescriptionQueueDto[]>([]);

  ngOnInit(): void { this.pharmacyService.queue().subscribe(q => this.queue.set(q)); }

  open(rx: PrescriptionQueueDto): void {
    this.router.navigate(['/pharmacy/queue', rx.prescriptionId]);
  }
}
