import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentDto } from '../../../core/models/models';
import { AppointmentsService } from '../../../core/services/appointments.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { PatientContextService } from '../../../core/services/patient-context.service';
import { PatientsService } from '../../../core/services/patients.service';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, StatusPillComponent],
  template: `
    <div class="pagehead"><div><h1>Doctor Dashboard</h1><div class="sub">{{ auth.user()?.fullName }} · {{ auth.user()?.department }}</div></div></div>
    @if (data(); as d) {
      <div class="grid g-4" style="margin-bottom:18px;">
        <app-kpi-card label="OPD Queue Today" [value]="d.opdQueueCount" [delta]="d.waiting + ' waiting'" />
        <app-kpi-card label="IPD Patients" [value]="d.ipdCount" />
        <app-kpi-card label="Pending Reports" [value]="d.pendingReports" [delta]="d.pendingReports > 0 ? 'result ready' : undefined" />
        <app-kpi-card label="Today's Consults" [value]="queue().length" />
      </div>
    }
    <div class="section-title">OPD Queue</div>
    @for (q of queue(); track q.appointmentId) {
      <div class="queue-item">
        <div class="qavatar">{{ q.tokenNumber }}</div>
        <div class="qmain"><div class="qname">{{ q.patientName }} <span style="font-weight:400;color:var(--ink-soft);">· {{ q.patientAge }}{{ q.patientGender.charAt(0) }}</span></div>
          <div class="qmeta">{{ q.slotTime }} · {{ q.department }}</div></div>
        <app-status-pill [status]="q.status" />
        <button class="btn btn-sm btn-primary" (click)="consult(q)">Consult</button>
      </div>
    }
  `
})
export class DoctorDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private appointmentsService = inject(AppointmentsService);
  private patientsService = inject(PatientsService);
  auth = inject(AuthService);
  ctx = inject(PatientContextService);
  router = inject(Router);

  data = signal<any>(null);
  queue = signal<AppointmentDto[]>([]);

  ngOnInit(): void {
    this.dashboardService.doctor().subscribe(d => this.data.set(d));
    this.appointmentsService.getAll().subscribe(a => this.queue.set(a));
  }

  consult(a: AppointmentDto): void {
    this.patientsService.getById(a.patientId).subscribe(p => {
      this.ctx.set({ patientId: p.patientId, fullName: p.fullName, age: p.age, gender: p.gender, uhid: p.uhid, department: a.department, doctor: a.doctor, knownAllergies: p.knownAllergies });
    });
    this.router.navigate(['/doctor/consult'], { queryParams: { appointmentId: a.appointmentId, patientId: a.patientId } });
  }
}
