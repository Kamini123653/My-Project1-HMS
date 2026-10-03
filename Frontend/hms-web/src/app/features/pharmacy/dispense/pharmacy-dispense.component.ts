import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PrescriptionDetailDto } from '../../../core/models/models';
import { PharmacyService } from '../../../core/services/pharmacy.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-pharmacy-dispense',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (rx(); as r) {
      <div class="crumb"><a (click)="router.navigateByUrl('/pharmacy/queue')">Prescription Queue</a> / <b>RX-{{ r.prescriptionId }}</b></div>
      <div class="grid g-2" style="align-items:start;">
        <div class="card">
          <div class="card-h"><h3>Items to Dispense — {{ r.patientName }}</h3><span class="pill pill-info">FEFO batch auto-selected</span></div>
          <div class="card-b" style="padding:0;">
            <table>
              <thead><tr><th>Medicine</th><th>Qty</th><th>Batch (FEFO)</th><th>Stock Available</th><th></th></tr></thead>
              <tbody>
                @for (it of r.items; track it.prescriptionItemId) {
                  <tr>
                    <td>{{ it.medicineName }}</td><td>{{ it.quantity }}</td>
                    <td class="mono">{{ it.bestBatch ?? '—' }} <span class="sub" style="font-size:11px;">{{ it.bestBatchExpiry ? 'exp ' + it.bestBatchExpiry : '' }}</span></td>
                    <td>@if (it.stockAvailable < 15) { <span class="pill pill-warn">{{ it.stockAvailable }} left</span> } @else { {{ it.stockAvailable }} units }</td>
                    <td><input type="checkbox" [checked]="selected().has(it.prescriptionItemId)" (change)="toggle(it.prescriptionItemId)" /></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="card-b" style="padding-top:0;">
            <button class="btn btn-primary" [disabled]="r.status === 'Dispensed'" (click)="dispense()">
              {{ r.status === 'Dispensed' ? 'Already Dispensed' : 'Dispense & Generate Bill' }}
            </button>
          </div>
        </div>
        <div class="card card-b">
          <h3 style="margin-bottom:10px;">Prescribing Doctor's Note</h3>
          <div class="sub" style="line-height:1.6;">{{ r.doctorNote || 'No additional notes.' }}</div>
        </div>
      </div>
    }
  `
})
export class PharmacyDispenseComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private pharmacyService = inject(PharmacyService);
  private toast = inject(ToastService);
  router = inject(Router);

  rx = signal<PrescriptionDetailDto | null>(null);
  selected = signal<Set<number>>(new Set());

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.pharmacyService.detail(id).subscribe(r => {
      this.rx.set(r);
      this.selected.set(new Set(r.items.map(i => i.prescriptionItemId)));
    });
  }

  toggle(itemId: number): void {
    const set = new Set(this.selected());
    set.has(itemId) ? set.delete(itemId) : set.add(itemId);
    this.selected.set(set);
  }

  dispense(): void {
    const r = this.rx();
    if (!r) return;
    this.pharmacyService.dispense(r.prescriptionId, Array.from(this.selected())).subscribe({
      next: (res) => {
        this.toast.ok(res.message);
        this.router.navigateByUrl('/pharmacy/queue');
      },
      error: (err) => this.toast.danger(err.error?.message ?? 'Could not dispense.')
    });
  }
}
