import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DoctorDto, PatientSearchResult, WardDto } from '../../../core/models/models';
import { IpdService } from '../../../core/services/ipd.service';
import { OrgService } from '../../../core/services/org.service';
import { PatientsService } from '../../../core/services/patients.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reception-ipd-admit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pagehead"><div><h1>IPD Admission</h1><div class="sub">Following doctor's admission advice</div></div></div>
    <div class="card"><div class="card-h"><h3>Admission Form</h3></div>
      <div class="card-b formgrid">
        <div class="field full">
          <label>Patient</label>
          <input [(ngModel)]="patientQuery" (ngModelChange)="searchPatients()" placeholder="Search patient by name / UHID / mobile" />
          @if (patientResults().length > 0) {
            <div class="card" style="margin-top:6px; max-height:160px; overflow-y:auto;">
              @for (p of patientResults(); track p.patientId) {
                <div class="queue-item" style="margin:6px;cursor:pointer;" (click)="selectPatient(p)">
                  <div class="qmain"><div class="qname">{{ p.fullName }}</div><div class="qmeta">{{ p.uhid }} · {{ p.age }}{{ p.gender.charAt(0) }} · {{ p.mobile }}</div></div>
                </div>
              }
            </div>
          }
          @if (selectedPatient()) {
            <div class="sub" style="margin-top:6px;">Selected: <b>{{ selectedPatient()!.fullName }}</b> ({{ selectedPatient()!.uhid }})</div>
          }
        </div>
        <div class="field"><label>Referring Doctor</label>
          <select [(ngModel)]="form.doctorId">
            <option [ngValue]="undefined">Select doctor</option>
            @for (d of doctors(); track d.doctorId) { <option [ngValue]="d.doctorId">{{ d.name }} — {{ d.department }}</option> }
          </select>
        </div>
        <div class="field"><label>Admission Type</label>
          <select [(ngModel)]="form.admissionType"><option>Planned</option><option>Emergency</option></select>
        </div>
        <div class="field full"><label>Initial Diagnosis</label><input [(ngModel)]="form.initialDiagnosis" placeholder="e.g. Acute coronary syndrome — for monitoring" /></div>
        <div class="field"><label>Ward</label>
          <select [(ngModel)]="form.wardId">
            <option [ngValue]="undefined">Select ward</option>
            @for (w of wards(); track w.wardId) { <option [ngValue]="w.wardId">{{ w.name }} — ₹{{ w.ratePerDay }}/day ({{ w.totalBeds - w.occupiedBeds }} free)</option> }
          </select>
        </div>
        <div class="field"><label>Attendant Name &amp; Contact</label><input [(ngModel)]="form.attendantName" placeholder="Name & mobile number" /></div>
        <div class="field"><label>Advance Deposit (₹)</label><input type="number" [(ngModel)]="form.advanceDeposit" /></div>
      </div>
      <div class="card-b" style="padding-top:0;">
        <button class="btn btn-primary" (click)="admit()">Proceed to Bed Allocation</button>
      </div>
    </div>
  `
})
export class ReceptionIpdAdmitComponent implements OnInit {
  private patientsService = inject(PatientsService);
  private org = inject(OrgService);
  private ipd = inject(IpdService);
  private toast = inject(ToastService);
  private router = inject(Router);

  patientQuery = '';
  patientResults = signal<PatientSearchResult[]>([]);
  selectedPatient = signal<PatientSearchResult | null>(null);
  doctors = signal<DoctorDto[]>([]);
  wards = signal<WardDto[]>([]);

  form = { doctorId: undefined as number | undefined, admissionType: 'Planned', initialDiagnosis: '', wardId: undefined as number | undefined, attendantName: '', advanceDeposit: 0 };

  ngOnInit(): void {
    this.org.getDoctors().subscribe(d => this.doctors.set(d));
    this.org.getWards().subscribe(w => this.wards.set(w));
  }

  searchPatients(): void {
    if (this.patientQuery.trim().length < 2) { this.patientResults.set([]); return; }
    this.patientsService.search(this.patientQuery).subscribe(r => this.patientResults.set(r));
  }

  selectPatient(p: PatientSearchResult): void {
    this.selectedPatient.set(p);
    this.patientResults.set([]);
    this.patientQuery = '';
  }

  admit(): void {
    const p = this.selectedPatient();
    if (!p || !this.form.doctorId || !this.form.wardId) {
      this.toast.warn('Please select a patient, doctor and ward.');
      return;
    }
    this.ipd.admit({
      patientId: p.patientId,
      doctorId: this.form.doctorId,
      admissionType: this.form.admissionType,
      initialDiagnosis: this.form.initialDiagnosis,
      wardId: this.form.wardId,
      attendantName: this.form.attendantName,
      advanceDeposit: this.form.advanceDeposit
    }).subscribe({
      next: (a) => {
        this.toast.ok(`${p.fullName} admitted to ${a.ward} · Bed ${a.bed}.`);
        this.router.navigateByUrl('/reception/beds');
      },
      error: (err) => this.toast.danger(err.error?.message ?? 'Could not admit patient.')
    });
  }
}
