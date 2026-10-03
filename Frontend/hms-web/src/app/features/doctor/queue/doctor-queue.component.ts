import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentDto } from '../../../core/models/models';
import { AppointmentsService } from '../../../core/services/appointments.service';
import { PatientContextService } from '../../../core/services/patient-context.service';
import { PatientsService } from '../../../core/services/patients.service';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

@Component({
  selector: 'app-doctor-queue',
  standalone: true,
  imports: [CommonModule, StatusPillComponent],
  template: `
    <div class="pagehead"><div><h1>My Appointments — OPD Queue</h1><div class="sub">Live queue, updates as receptionist checks patients in</div></div></div>
    <div class="card"><div class="card-b" style="padding:0;">
      <table>
        <thead><tr><th>Token</th><th>Patient</th><th>Time</th><th>Department</th><th>Status</th><th></th></tr></thead>
        <tbody>
          @for (q of queue(); track q.appointmentId) {
            <tr class="clickable" (click)="consult(q)">
              <td class="mono">{{ q.tokenNumber }}</td><td>{{ q.patientName }}</td><td>{{ q.slotTime }}</td><td>{{ q.department }}</td>
              <td><app-status-pill [status]="q.status" /></td>
              <td><button class="btn btn-sm btn-primary" (click)="consult(q); $event.stopPropagation()">Consult</button></td>
            </tr>
          }
        </tbody>
      </table>
    </div></div>
  `
})
export class DoctorQueueComponent implements OnInit {
  private appointmentsService = inject(AppointmentsService);
  private patientsService = inject(PatientsService);
  ctx = inject(PatientContextService);
  router = inject(Router);

  queue = signal<AppointmentDto[]>([]);

  ngOnInit(): void {
    this.appointmentsService.getAll().subscribe(a => this.queue.set(a));
  }

  consult(a: AppointmentDto): void {
    this.patientsService.getById(a.patientId).subscribe(p => {
      this.ctx.set({ patientId: p.patientId, fullName: p.fullName, age: p.age, gender: p.gender, uhid: p.uhid, department: a.department, doctor: a.doctor, knownAllergies: p.knownAllergies });
    });
    this.router.navigate(['/doctor/consult'], { queryParams: { appointmentId: a.appointmentId, patientId: a.patientId } });
  }
}
