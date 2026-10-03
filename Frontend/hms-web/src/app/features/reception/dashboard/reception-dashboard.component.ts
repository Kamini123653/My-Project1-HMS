import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentDto } from '../../../core/models/models';
import { AppointmentsService } from '../../../core/services/appointments.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

@Component({
  selector: 'app-reception-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, StatusPillComponent],
  template: `
    <div class="pagehead"><div><h1>Reception Dashboard</h1><div class="sub">Front desk overview</div></div></div>
    @if (data(); as d) {
      <div class="grid g-4" style="margin-bottom:18px;">
        <app-kpi-card label="Today's Registrations" [value]="d.registrationsToday" />
        <app-kpi-card label="Appointments Today" [value]="d.appointmentsToday" />
        <app-kpi-card label="IPD Admissions Today" [value]="d.admissionsToday" />
        <app-kpi-card label="Beds Available" [value]="d.bedsAvailable" />
      </div>
    }
    <div class="grid g-2">
      <div class="card card-b">
        <h3 style="margin-bottom:12px;">Quick Actions</h3>
        <button class="btn btn-primary" style="width:100%;margin-bottom:8px;" (click)="router.navigateByUrl('/reception/register')">+ Register New Patient</button>
        <button class="btn btn-outline" style="width:100%;margin-bottom:8px;" (click)="router.navigateByUrl('/reception/appointment')">Book Appointment</button>
        <button class="btn btn-outline" style="width:100%;" (click)="router.navigateByUrl('/reception/ipd-admit')">New IPD Admission</button>
      </div>
      <div class="card">
        <div class="card-h"><h3>Today's Check-ins</h3></div>
        <div class="card-b" style="padding:0;">
          <table>
            <thead><tr><th>Token</th><th>Patient</th><th>Doctor</th><th>Status</th></tr></thead>
            <tbody>
              @for (a of appointments(); track a.appointmentId) {
                <tr><td class="mono">{{ a.tokenNumber }}</td><td>{{ a.patientName }}</td><td>{{ a.doctor }}</td><td><app-status-pill [status]="a.status" /></td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ReceptionDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private appointmentsService = inject(AppointmentsService);
  router = inject(Router);
  data = signal<any>(null);
  appointments = signal<AppointmentDto[]>([]);

  ngOnInit(): void {
    this.dashboardService.reception().subscribe(d => this.data.set(d));
    this.appointmentsService.getAll().subscribe(a => this.appointments.set(a));
  }
}
