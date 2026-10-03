import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientContextService } from '../../../core/services/patient-context.service';
import { VitalsService } from '../../../core/services/clinical.service';
import { PatientsService } from '../../../core/services/patients.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-nurse-vitals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pagehead"><div><h1>Record Vitals</h1><div class="sub">Entries feed directly into the doctor's consultation screen</div></div></div>
    <div class="card" style="max-width:640px;">
      <div class="card-h"><h3>Vitals Entry</h3></div>
      <div class="card-b formgrid">
        <div class="field"><label>Blood Pressure</label><input [(ngModel)]="form.bloodPressure" placeholder="e.g. 128/82 mmHg" /></div>
        <div class="field"><label>Pulse</label><input [(ngModel)]="form.pulse" placeholder="e.g. 76 bpm" /></div>
        <div class="field"><label>Temperature</label><input [(ngModel)]="form.temperature" placeholder="e.g. 98.4°F" /></div>
        <div class="field"><label>SpO2</label><input [(ngModel)]="form.spO2" placeholder="e.g. 98%" /></div>
        <div class="field"><label>Respiratory Rate</label><input [(ngModel)]="form.respiratoryRate" placeholder="e.g. 16 /min" /></div>
        <div class="field"><label>Weight</label><input [(ngModel)]="form.weight" placeholder="e.g. 68 kg" /></div>
        <div class="field full"><label>Nursing Notes</label><textarea rows="2" [(ngModel)]="form.notes" placeholder="Any observations for the doctor"></textarea></div>
      </div>
      <div class="card-b" style="padding-top:0;">
        <button class="btn btn-primary" (click)="save()">Save Vitals</button>
      </div>
    </div>
  `
})
export class NurseVitalsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vitalsService = inject(VitalsService);
  private patientsService = inject(PatientsService);
  private toast = inject(ToastService);
  ctx = inject(PatientContextService);

  patientId = 0;
  appointmentId?: number;
  admissionId?: number;

  form = { bloodPressure: '', pulse: '', temperature: '', spO2: '', respiratoryRate: '', weight: '', notes: '' };

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.patientId = Number(params['patientId']);
      this.appointmentId = params['appointmentId'] ? Number(params['appointmentId']) : undefined;
      this.admissionId = params['admissionId'] ? Number(params['admissionId']) : undefined;
      if (this.patientId && !this.ctx.active()) {
        this.patientsService.getById(this.patientId).subscribe(p =>
          this.ctx.set({ patientId: p.patientId, fullName: p.fullName, age: p.age, gender: p.gender, uhid: p.uhid, knownAllergies: p.knownAllergies }));
      }
    });
  }

  save(): void {
    if (!this.patientId) { this.toast.warn('No patient selected.'); return; }
    this.vitalsService.record({ patientId: this.patientId, appointmentId: this.appointmentId, admissionId: this.admissionId, ...this.form }).subscribe(() => {
      const name = this.ctx.active()?.fullName ?? 'patient';
      this.toast.ok(`Vitals saved for ${name}. Visible to the doctor on their consultation screen.`);
      this.form = { bloodPressure: '', pulse: '', temperature: '', spO2: '', respiratoryRate: '', weight: '', notes: '' };
      this.router.navigateByUrl(this.admissionId ? '/nurse/ipd' : '/nurse/dashboard');
    });
  }
}
