import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IPDAdmissionDto } from '../../../core/models/models';
import { IpdService } from '../../../core/services/ipd.service';
import { ToastService } from '../../../core/services/toast.service';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

@Component({
  selector: 'app-reception-discharge',
  standalone: true,
  imports: [CommonModule, StatusPillComponent],
  template: `
    <div class="pagehead"><div><h1>Discharge Desk</h1><div class="sub">Patients advised for discharge — finalized only once billing is cleared</div></div></div>

    @if (advised().length === 0) {
      <div class="card empty"><div class="ic">🚪</div>No patients currently advised for discharge.</div>
    }
    @for (p of advised(); track p.admissionId) {
      <div class="card" style="margin-bottom:14px;">
        <div class="card-h"><h3>{{ p.patientName }} <span class="sub" style="font-weight:400;">· {{ p.ward }} {{ p.bed }}</span></h3><app-status-pill [status]="p.status" /></div>
        <div class="card-b">
          @if (p.billCleared) {
            <div class="gate-ok"><span>✓</span><div>Final bill cleared. Bed will be released back to the available pool on discharge.</div></div>
          } @else {
            <div class="gate-block">
              <span>⚠</span>
              <div>Outstanding bill not yet cleared — discharge is blocked until Accounts confirms payment.
                <div style="margin-top:8px;">
                  <button class="btn btn-sm btn-primary" (click)="router.navigate(['/billing/consolidated'], { queryParams: { admissionId: p.admissionId } })">Go to Billing</button>
                </div>
              </div>
            </div>
          }
          <button class="btn btn-primary" style="margin-top:12px;" [disabled]="!p.billCleared" (click)="finalize(p)">Finalize Discharge &amp; Release Bed</button>
        </div>
      </div>
    }
  `
})
export class ReceptionDischargeComponent implements OnInit {
  private ipd = inject(IpdService);
  private toast = inject(ToastService);
  router = inject(Router);

  advised = signal<IPDAdmissionDto[]>([]);

  ngOnInit(): void { this.reload(); }

  reload(): void {
    this.ipd.getAll().subscribe(list => this.advised.set(list.filter(a => a.dischargeAdvised)));
  }

  finalize(p: IPDAdmissionDto): void {
    this.ipd.finalizeDischarge(p.admissionId).subscribe({
      next: (res) => { this.toast.ok(res.message); this.reload(); },
      error: (err) => this.toast.danger(err.error?.message ?? 'Could not finalize discharge.')
    });
  }
}
