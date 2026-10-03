import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentDto, IPDAdmissionDto } from '../../../core/models/models';
import { AppointmentsService } from '../../../core/services/appointments.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { IpdService } from '../../../core/services/ipd.service';
import { PatientContextService } from '../../../core/services/patient-context.service';
import { PatientsService } from '../../../core/services/patients.service';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';

@Component({
  selector: 'app-nurse-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent],
  template: `
    <div class="pagehead"><div><h1>Nurse Dashboard</h1><div class="sub">Ward &amp; OPD vitals overview</div></div></div>
    @if (data(); as d) {
      <div class="grid g-4" style="margin-bottom:18px;">
        <app-kpi-card label="Vitals Due Today" [value]="opdWaiting().length + admissions().length" />
        <app-kpi-card label="Vitals Recorded" [value]="d.vitalsRecordedToday" delta="so far today" dir="up" />
        <app-kpi-card label="IPD Patients Under Care" [value]="d.ipdCount" />
        <app-kpi-card label="Discharge-Advised" [value]="d.dischargeAdvised" />
      </div>
    }
    <div class="section-title">Patients Awaiting Vitals</div>
    @for (a of opdWaiting(); track a.appointmentId) {
      <div class="queue-item">
        <div class="qmain"><div class="qname">{{ a.patientName }} <span style="font-weight:400;color:var(--ink-soft);">· {{ a.patientAge }}{{ a.patientGender.charAt(0) }} · OPD</span></div>
          <div class="qmeta">{{ a.department }} · {{ a.doctor }}</div></div>
        <button class="btn btn-sm btn-primary" (click)="recordVitals(a.patientId, a.patientName, a.patientAge, a.patientGender, a.appointmentId)">Record Vitals</button>
      </div>
    }
    @for (p of admissions(); track p.admissionId) {
      <div class="queue-item">
        <div class="qmain"><div class="qname">{{ p.patientName }} <span style="font-weight:400;color:var(--ink-soft);">· {{ p.patientAge }}{{ p.patientGender.charAt(0) }} · IPD</span></div>
          <div class="qmeta">{{ p.ward }} · {{ p.bed }}</div></div>
        <button class="btn btn-sm btn-primary" (click)="recordVitals(p.patientId, p.patientName, p.patientAge, p.patientGender, undefined, p.admissionId)">Record Vitals</button>
      </div>
    }
  `
})
export class NurseDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private appointmentsService = inject(AppointmentsService);
  private ipdService = inject(IpdService);
  ctx = inject(PatientContextService);
  router = inject(Router);

  data = signal<any>(null);
  opdWaiting = signal<AppointmentDto[]>([]);
  admissions = signal<IPDAdmissionDto[]>([]);

  ngOnInit(): void {
    this.dashboardService.nurse().subscribe(d => this.data.set(d));
    this.appointmentsService.getAll().subscribe(a => this.opdWaiting.set(a.filter(x => x.status === 'Waiting')));
    this.ipdService.getAll().subscribe(a => this.admissions.set(a));
  }

  recordVitals(patientId: number, name: string, age: number, gender: string, appointmentId?: number, admissionId?: number): void {
    this.ctx.set({ patientId, fullName: name, age, gender, uhid: '' });
    this.router.navigate(['/nurse/vitals'], { queryParams: { patientId, appointmentId, admissionId } });
  }
}
