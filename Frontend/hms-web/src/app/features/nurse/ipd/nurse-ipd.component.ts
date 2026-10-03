import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IPDAdmissionDto } from '../../../core/models/models';
import { IpdService } from '../../../core/services/ipd.service';
import { PatientContextService } from '../../../core/services/patient-context.service';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

@Component({
  selector: 'app-nurse-ipd',
  standalone: true,
  imports: [CommonModule, StatusPillComponent],
  template: `
    <div class="pagehead"><div><h1>IPD Patient List</h1><div class="sub">Admitted patients requiring nursing care</div></div></div>
    <div class="card"><div class="card-b" style="padding:0;">
      <table>
        <thead><tr><th>UHID</th><th>Patient</th><th>Ward / Bed</th><th>Status</th><th></th></tr></thead>
        <tbody>
          @for (p of admissions(); track p.admissionId) {
            <tr>
              <td class="mono">—</td><td>{{ p.patientName }} · {{ p.patientAge }}{{ p.patientGender.charAt(0) }}</td><td>{{ p.ward }} · {{ p.bed }}</td>
              <td>@if (p.dischargeAdvised) { <span class="pill pill-info">Discharge Advised</span> } @else { <app-status-pill [status]="p.status" /> }</td>
              <td><button class="btn btn-sm btn-primary" (click)="recordVitals(p)">Record Vitals</button></td>
            </tr>
          }
        </tbody>
      </table>
    </div></div>
  `
})
export class NurseIpdComponent implements OnInit {
  private ipd = inject(IpdService);
  ctx = inject(PatientContextService);
  router = inject(Router);
  admissions = signal<IPDAdmissionDto[]>([]);

  ngOnInit(): void { this.ipd.getAll().subscribe(a => this.admissions.set(a)); }

  recordVitals(p: IPDAdmissionDto): void {
    this.ctx.set({ patientId: p.patientId, fullName: p.patientName, age: p.patientAge, gender: p.patientGender, uhid: '', ward: p.ward, bed: p.bed, knownAllergies: p.knownAllergies });
    this.router.navigate(['/nurse/vitals'], { queryParams: { patientId: p.patientId, admissionId: p.admissionId } });
  }
}
