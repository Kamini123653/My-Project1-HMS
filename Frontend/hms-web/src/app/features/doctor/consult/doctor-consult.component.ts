import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultationHistoryDto, MedicineOptionDto, TestCatalogDto, VitalDto } from '../../../core/models/models';
import { ConsultationsService, MedicinesService, VitalsService } from '../../../core/services/clinical.service';
import { LabService } from '../../../core/services/lab.service';
import { PatientContextService } from '../../../core/services/patient-context.service';
import { ToastService } from '../../../core/services/toast.service';

interface RxRow { medicineId?: number; dosage: string; duration: string; quantity: number; }

@Component({
  selector: 'app-doctor-consult',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="crumb"><a (click)="back()">OPD Queue</a> / <b>Consultation</b></div>
    <div class="grid g-2" style="align-items:start;">
      <div>
        <div class="card" style="margin-bottom:14px;">
          <div class="card-h"><h3>Vitals</h3>
            @if (latestVital(); as v) { <span class="sub" style="font-size:11.5px;">Recorded by {{ v.recordedBy }} · {{ v.recordedAt | date:'shortTime' }}</span> }
          </div>
          <div class="card-b formgrid">
            @if (latestVital(); as v) {
              <div class="field"><label>Blood Pressure</label><input [value]="v.bloodPressure" readonly></div>
              <div class="field"><label>Pulse</label><input [value]="v.pulse" readonly></div>
              <div class="field"><label>Temperature</label><input [value]="v.temperature" readonly></div>
              <div class="field"><label>SpO2</label><input [value]="v.spO2" readonly></div>
            } @else {
              <div class="sub">No vitals recorded yet for this visit.</div>
            }
          </div>
        </div>

        <div class="card" style="margin-bottom:14px;">
          <div class="card-h"><h3>Diagnosis &amp; Notes</h3></div>
          <div class="card-b">
            <div class="field full" style="margin-bottom:12px;"><label>Chief Complaint</label><textarea rows="2" [(ngModel)]="chiefComplaint"></textarea></div>
            <div class="field full"><label>Diagnosis</label><textarea rows="2" [(ngModel)]="diagnosis"></textarea></div>
          </div>
        </div>

        <div class="card">
          <div class="card-h"><h3>Prescription</h3><button class="btn btn-sm btn-outline" (click)="addRow()">+ Add Medicine</button></div>
          <div class="card-b" style="padding:0;">
            <table>
              <thead><tr><th>Medicine</th><th>Dosage</th><th>Duration</th><th>Qty</th><th></th></tr></thead>
              <tbody>
                @for (row of rxRows(); track $index) {
                  <tr>
                    <td>
                      <select [(ngModel)]="row.medicineId">
                        <option [ngValue]="undefined">Select</option>
                        @for (m of medicines(); track m.medicineId) { <option [ngValue]="m.medicineId">{{ m.name }}</option> }
                      </select>
                    </td>
                    <td><input [(ngModel)]="row.dosage" placeholder="1-0-1 after food" style="width:120px;"></td>
                    <td><input [(ngModel)]="row.duration" placeholder="5 days" style="width:90px;"></td>
                    <td><input type="number" [(ngModel)]="row.quantity" style="width:60px;"></td>
                    <td><button class="btn btn-sm btn-outline" (click)="removeRow($index)">Remove</button></td>
                  </tr>
                }
                @if (rxRows().length === 0) {
                  <tr><td colspan="5" class="sub" style="text-align:center;padding:16px;">No medicines added.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <div class="card" style="margin-bottom:14px;">
          <div class="card-h"><h3>Patient History</h3></div>
          <div class="card-b">
            @if (history().length === 0) {
              <div class="sub">No previous visits on record.</div>
            }
            <div class="timeline">
              @for (h of history(); track h.consultationId) {
                <div class="tl-item">
                  <div class="tl-time">{{ h.consultDate | date:'mediumDate' }}</div>
                  <div class="tl-text">{{ h.diagnosis || h.chiefComplaint || 'Visit with ' + h.doctor }}</div>
                </div>
              }
            </div>
          </div>
        </div>

        <div class="card" style="margin-bottom:14px;">
          <div class="card-h"><h3>Order Test</h3></div>
          <div class="card-b">
            <div class="field" style="margin-bottom:10px;"><label>Test Type</label>
              <select [(ngModel)]="selectedTestId">
                @for (t of testCatalog(); track t.testId) { <option [ngValue]="t.testId">{{ t.name }} ({{ t.type }})</option> }
              </select>
            </div>
            <button class="btn btn-outline" style="width:100%;" (click)="orderTest()">Send to Diagnostics Queue</button>
          </div>
        </div>

        <button class="btn btn-primary" style="width:100%;" (click)="finalize()">Finalize &amp; Close Visit</button>
      </div>
    </div>
  `
})
export class DoctorConsultComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vitalsService = inject(VitalsService);
  private consultationsService = inject(ConsultationsService);
  private medicinesService = inject(MedicinesService);
  private labService = inject(LabService);
  private toast = inject(ToastService);
  ctx = inject(PatientContextService);

  patientId = 0;
  appointmentId?: number;
  admissionId?: number;

  chiefComplaint = '';
  diagnosis = '';
  rxRows = signal<RxRow[]>([]);
  latestVital = signal<VitalDto | null>(null);
  history = signal<ConsultationHistoryDto[]>([]);
  medicines = signal<MedicineOptionDto[]>([]);
  testCatalog = signal<TestCatalogDto[]>([]);
  selectedTestId?: number;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.patientId = Number(params['patientId']);
      this.appointmentId = params['appointmentId'] ? Number(params['appointmentId']) : undefined;
      this.admissionId = params['admissionId'] ? Number(params['admissionId']) : undefined;
      if (this.patientId) this.loadPatientData();
    });
    this.medicinesService.getAll().subscribe(m => this.medicines.set(m));
    this.labService.catalog().subscribe(t => { this.testCatalog.set(t); this.selectedTestId = t[0]?.testId; });
  }

  private loadPatientData(): void {
    this.vitalsService.getForPatient(this.patientId).subscribe(v => this.latestVital.set(v[0] ?? null));
    this.consultationsService.history(this.patientId).subscribe(h => this.history.set(h));
  }

  addRow(): void {
    this.rxRows.update(rows => [...rows, { dosage: '', duration: '', quantity: 1 }]);
  }

  removeRow(i: number): void {
    this.rxRows.update(rows => rows.filter((_, idx) => idx !== i));
  }

  orderTest(): void {
    if (!this.selectedTestId) return;
    this.consultationsService.orderTest(this.patientId, this.selectedTestId).subscribe(res => {
      this.toast.ok(res.message);
    });
  }

  finalize(): void {
    const medicines = this.rxRows().filter(r => r.medicineId).map(r => ({
      medicineId: r.medicineId!, dosage: r.dosage, duration: r.duration, quantity: r.quantity
    }));

    this.consultationsService.save({
      patientId: this.patientId,
      appointmentId: this.appointmentId,
      admissionId: this.admissionId,
      chiefComplaint: this.chiefComplaint,
      diagnosis: this.diagnosis,
      medicines
    }).subscribe({
      next: () => {
        this.toast.ok('Prescription forwarded to Pharmacy queue. Visit closed.');
        this.back();
      },
      error: (err) => this.toast.danger(err.error?.message ?? 'Could not save consultation.')
    });
  }

  back(): void {
    this.ctx.clear();
    this.router.navigateByUrl(this.admissionId ? '/doctor/ipd' : '/doctor/queue');
  }
}
