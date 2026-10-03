import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IPDAdmissionDto } from '../../../core/models/models';
import { IpdService } from '../../../core/services/ipd.service';
import { PatientContextService } from '../../../core/services/patient-context.service';
import { ToastService } from '../../../core/services/toast.service';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

@Component({
  selector: 'app-doctor-ipd',
  standalone: true,
  imports: [CommonModule, StatusPillComponent],
  template: `
    <div class="pagehead"><div><h1>IPD Rounds — Patient List</h1><div class="sub">Admitted patients under your care</div></div></div>
    <div class="card"><div class="card-b" style="padding:0;">
      <table>
        <thead><tr><th>Patient</th><th>Ward / Bed</th><th>Status</th><th></th></tr></thead>
        <tbody>
          @for (p of admissions(); track p.admissionId) {
            <tr>
              <td class="clickable" style="cursor:pointer;" (click)="openConsult(p)">{{ p.patientName }} · {{ p.patientAge }}{{ p.patientGender.charAt(0) }}</td>
              <td>{{ p.ward }} · {{ p.bed }}</td>
              <td>@if (p.dischargeAdvised) { <span class="pill pill-info">Discharge Advised</span> } @else { <app-status-pill [status]="p.status" /> }</td>
              <td style="display:flex;gap:6px;">
                <button class="btn btn-sm btn-primary" (click)="openConsult(p)">Round Notes</button>
                @if (!p.dischargeAdvised) {
                  <button class="btn btn-sm btn-outline" (click)="adviseDischarge(p)">Advise Discharge</button>
                } @else {
                  <button class="btn btn-sm btn-outline" disabled>Advised</button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div></div>
  `
})
export class DoctorIpdComponent implements OnInit {
  private ipd = inject(IpdService);
  private toast = inject(ToastService);
  ctx = inject(PatientContextService);
  router = inject(Router);

  admissions = signal<IPDAdmissionDto[]>([]);

  ngOnInit(): void { this.reload(); }
  reload(): void { this.ipd.getAll().subscribe(a => this.admissions.set(a)); }

  openConsult(p: IPDAdmissionDto): void {
    this.ctx.set({ patientId: p.patientId, fullName: p.patientName, age: p.patientAge, gender: p.patientGender, uhid: '', doctor: p.doctor, ward: p.ward, bed: p.bed, knownAllergies: p.knownAllergies });
    this.router.navigate(['/doctor/consult'], { queryParams: { patientId: p.patientId, admissionId: p.admissionId } });
  }

  adviseDischarge(p: IPDAdmissionDto): void {
    this.ipd.adviseDischarge(p.admissionId).subscribe(res => { this.toast.info(res.message); this.reload(); });
  }
}
