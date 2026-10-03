import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DoctorDto } from '../../../core/models/models';
import { OrgService } from '../../../core/services/org.service';
import { ToastService } from '../../../core/services/toast.service';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

@Component({
  selector: 'app-admin-doctors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pagehead"><div><h1>Manage Doctors &amp; Staff</h1><div class="sub">Specialization, fees and weekly availability scheduling</div></div></div>
    <div class="card"><div class="card-b" style="padding:0;">
      <table>
        <thead><tr><th>Name</th><th>Department</th><th>Fee</th><th>Weekly Availability</th><th>Hours</th><th></th></tr></thead>
        <tbody>
          @for (d of doctors(); track d.doctorId) {
            <tr>
              <td>{{ d.name }}</td>
              <td>{{ d.department }}</td>
              <td class="mono">₹{{ d.consultationFee }}</td>
              <td>
                <div class="week-chips">
                  @for (on of d.weeklyAvailability; track $index) {
                    <span class="week-chip" [class.on]="on">{{ weekdays[$index] }}</span>
                  }
                </div>
              </td>
              <td class="sub" style="font-size:12px;">{{ d.hoursFrom }} – {{ d.hoursTo }}</td>
              <td><button class="btn btn-sm btn-outline" (click)="edit(d)">Edit Schedule</button></td>
            </tr>
          }
        </tbody>
      </table>
    </div></div>

    @if (editing(); as d) {
      <div class="card" style="margin-top:16px;max-width:520px;">
        <div class="card-h"><h3>Edit Schedule — {{ d.name }}</h3></div>
        <div class="card-b formgrid">
          <div class="field"><label>Consultation Fee (₹)</label><input type="number" [(ngModel)]="editForm.consultationFee" /></div>
          <div class="field"><label>Hours From</label><input type="time" [(ngModel)]="editForm.hoursFrom" /></div>
          <div class="field"><label>Hours To</label><input type="time" [(ngModel)]="editForm.hoursTo" /></div>
          <div class="field full">
            <label>Weekly Availability</label>
            <div class="week-chips">
              @for (on of editForm.weeklyAvailability; track $index) {
                <span class="week-chip" [class.on]="on" style="cursor:pointer;" (click)="toggleDay($index)">{{ weekdays[$index] }}</span>
              }
            </div>
          </div>
        </div>
        <div class="card-b" style="padding-top:0;display:flex;gap:8px;">
          <button class="btn btn-primary" (click)="save()">Save Schedule</button>
          <button class="btn btn-outline" (click)="editing.set(null)">Cancel</button>
        </div>
      </div>
    }
  `
})
export class AdminDoctorsComponent implements OnInit {
  private org = inject(OrgService);
  private toast = inject(ToastService);
  doctors = signal<DoctorDto[]>([]);
  editing = signal<DoctorDto | null>(null);
  weekdays = WEEKDAYS;
  editForm = { consultationFee: 0, hoursFrom: '09:00', hoursTo: '13:00', weeklyAvailability: [false, false, false, false, false, false, false] };

  ngOnInit(): void { this.reload(); }
  reload(): void { this.org.getDoctors().subscribe(d => this.doctors.set(d)); }

  edit(d: DoctorDto): void {
    this.editing.set(d);
    this.editForm = { consultationFee: d.consultationFee, hoursFrom: d.hoursFrom, hoursTo: d.hoursTo, weeklyAvailability: [...d.weeklyAvailability] };
  }

  toggleDay(i: number): void {
    this.editForm.weeklyAvailability[i] = !this.editForm.weeklyAvailability[i];
  }

  save(): void {
    const d = this.editing();
    if (!d) return;
    this.org.updateDoctorSchedule(d.doctorId, this.editForm).subscribe(() => {
      this.toast.ok(`Schedule updated for ${d.name}.`);
      this.editing.set(null);
      this.reload();
    });
  }
}
