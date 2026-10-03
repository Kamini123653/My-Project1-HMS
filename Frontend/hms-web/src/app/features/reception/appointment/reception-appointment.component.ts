import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppointmentDto, DepartmentDto, DoctorDto, DoctorSlotDto, PatientSearchResult } from '../../../core/models/models';
import { AppointmentsService } from '../../../core/services/appointments.service';
import { OrgService } from '../../../core/services/org.service';
import { PatientsService } from '../../../core/services/patients.service';
import { ToastService } from '../../../core/services/toast.service';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

@Component({
  selector: 'app-reception-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusPillComponent],
  template: `
    <div class="pagehead"><div><h1>Book / Manage Appointment</h1><div class="sub">Select department and doctor to see live slot availability</div></div></div>
    <div class="grid g-2" style="align-items:start;">
      <div class="card">
        <div class="card-h"><h3>New Appointment</h3></div>
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
          <div class="field"><label>Department</label>
            <select [(ngModel)]="selectedDepartmentId" (ngModelChange)="onDepartmentChange()">
              <option [ngValue]="undefined">Select department</option>
              @for (d of departments(); track d.departmentId) { <option [ngValue]="d.departmentId">{{ d.name }}</option> }
            </select>
          </div>
          <div class="field"><label>Doctor</label>
            <select [(ngModel)]="selectedDoctorId" (ngModelChange)="loadSlots()">
              <option [ngValue]="undefined">Select doctor</option>
              @for (d of doctorsForDept(); track d.doctorId) { <option [ngValue]="d.doctorId">{{ d.name }}</option> }
            </select>
          </div>
          <div class="field"><label>Date</label><input type="date" [(ngModel)]="appointmentDate" (ngModelChange)="loadSlots()" /></div>
          <div class="field"><label>Available Slot</label>
            <select [(ngModel)]="selectedSlot">
              <option [ngValue]="undefined">Select slot</option>
              @for (s of slots(); track s.slotTime) { <option [value]="s.slotTime" [disabled]="s.taken">{{ s.slotTime }} {{ s.taken ? '(taken)' : '' }}</option> }
            </select>
          </div>
        </div>
        <div class="card-b" style="padding-top:0;">
          <button class="btn btn-primary" style="width:100%;" (click)="confirmBooking()">Confirm &amp; Generate Token</button>
        </div>
      </div>
      <div class="card">
        <div class="card-h"><h3>Today's Appointments</h3></div>
        <div class="card-b" style="padding:0;">
          <table>
            <thead><tr><th>Token</th><th>Patient</th><th>Time</th><th>Status</th></tr></thead>
            <tbody>
              @for (a of todaysAppointments(); track a.appointmentId) {
                <tr><td class="mono">{{ a.tokenNumber }}</td><td>{{ a.patientName }}</td><td>{{ a.slotTime }}</td><td><app-status-pill [status]="a.status" /></td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ReceptionAppointmentComponent implements OnInit {
  private patientsService = inject(PatientsService);
  private org = inject(OrgService);
  private appointmentsService = inject(AppointmentsService);
  private toast = inject(ToastService);

  patientQuery = '';
  patientResults = signal<PatientSearchResult[]>([]);
  selectedPatient = signal<PatientSearchResult | null>(null);

  departments = signal<DepartmentDto[]>([]);
  doctors = signal<DoctorDto[]>([]);
  selectedDepartmentId?: number;
  selectedDoctorId?: number;
  appointmentDate = new Date().toISOString().substring(0, 10);
  slots = signal<DoctorSlotDto[]>([]);
  selectedSlot?: string;

  todaysAppointments = signal<AppointmentDto[]>([]);

  ngOnInit(): void {
    this.org.getDepartments().subscribe(d => this.departments.set(d));
    this.org.getDoctors().subscribe(d => this.doctors.set(d));
    this.reloadTodaysAppointments();
  }

  reloadTodaysAppointments(): void {
    this.appointmentsService.getAll().subscribe(a => this.todaysAppointments.set(a));
  }

  doctorsForDept(): DoctorDto[] {
    if (!this.selectedDepartmentId) return this.doctors();
    const deptName = this.departments().find(d => d.departmentId === this.selectedDepartmentId)?.name;
    return this.doctors().filter(d => d.department === deptName);
  }

  onDepartmentChange(): void {
    this.selectedDoctorId = undefined;
    this.slots.set([]);
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

  loadSlots(): void {
    if (!this.selectedDoctorId || !this.appointmentDate) return;
    this.appointmentsService.getSlots(this.selectedDoctorId, this.appointmentDate).subscribe(s => this.slots.set(s));
  }

  confirmBooking(): void {
    const p = this.selectedPatient();
    if (!p || !this.selectedDoctorId || !this.selectedSlot) {
      this.toast.warn('Please select a patient, doctor and slot.');
      return;
    }
    this.appointmentsService.book({
      patientId: p.patientId,
      doctorId: this.selectedDoctorId,
      appointmentDate: this.appointmentDate,
      slotTime: this.selectedSlot
    }).subscribe({
      next: (a) => {
        this.toast.ok(`Appointment booked. Token ${a.tokenNumber} generated. Proceed to collect consultation fee.`);
        this.selectedPatient.set(null);
        this.selectedSlot = undefined;
        this.loadSlots();
        this.reloadTodaysAppointments();
      },
      error: (err) => this.toast.danger(err.error?.message ?? 'Could not book appointment.')
    });
  }
}
