import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PatientSearchResult } from '../../../core/models/models';
import { PatientsService } from '../../../core/services/patients.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reception-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pagehead"><div><h1>Patient Registration</h1><div class="sub">Search existing patients first to avoid duplicate UHIDs</div></div></div>

    <div class="card" style="margin-bottom:16px;"><div class="card-b" style="display:flex;gap:10px;">
      <input [(ngModel)]="searchQuery" (ngModelChange)="search()" placeholder="Search by name, mobile number or UHID…" style="flex:1;border:1.5px solid var(--line);border-radius:8px;padding:10px 12px;" />
      <button class="btn btn-outline" (click)="search()">Search</button>
    </div></div>

    @if (results().length > 0) {
      <div class="card" style="margin-bottom:16px;"><div class="card-b" style="padding:0;">
        <table>
          <thead><tr><th>UHID</th><th>Name</th><th>Age/Gender</th><th>Mobile</th><th></th></tr></thead>
          <tbody>
            @for (p of results(); track p.patientId) {
              <tr>
                <td class="mono">{{ p.uhid }}</td><td>{{ p.fullName }}</td><td>{{ p.age }}{{ p.gender.charAt(0) }}</td><td>{{ p.mobile }}</td>
                <td><button class="btn btn-sm btn-primary" (click)="router.navigateByUrl('/reception/appointment')">Book Appointment</button></td>
              </tr>
            }
          </tbody>
        </table>
      </div></div>
    }

    <div class="card">
      <div class="card-h"><h3>New Patient Details</h3></div>
      <div class="card-b formgrid">
        <div class="field"><label>Full Name</label><input [(ngModel)]="form.fullName" placeholder="e.g. Anita Sharma" /></div>
        <div class="field"><label>Date of Birth</label><input type="date" [(ngModel)]="form.dateOfBirth" /></div>
        <div class="field"><label>Gender</label>
          <select [(ngModel)]="form.gender"><option>Female</option><option>Male</option><option>Other</option></select>
        </div>
        <div class="field"><label>Blood Group</label>
          <select [(ngModel)]="form.bloodGroup"><option>O+</option><option>A+</option><option>B+</option><option>AB+</option><option>O-</option><option>A-</option><option>B-</option><option>AB-</option></select>
        </div>
        <div class="field"><label>Mobile Number</label><input [(ngModel)]="form.mobile" placeholder="10-digit mobile" /></div>
        <div class="field"><label>Emergency Contact</label><input [(ngModel)]="form.emergencyContact" placeholder="Name & number" /></div>
        <div class="field full"><label>Address</label><input [(ngModel)]="form.address" placeholder="House no, street, city, pincode" /></div>
        <div class="field full"><label>Known Allergies</label><input [(ngModel)]="form.knownAllergies" placeholder="e.g. Penicillin — leave blank if none" /></div>
      </div>
      <div class="card-b" style="padding-top:0;display:flex;gap:10px;">
        <button class="btn btn-primary" (click)="registerPatient(false)">Register &amp; Generate UHID</button>
        <button class="btn btn-outline" (click)="registerPatient(true)">Register &amp; Book Appointment</button>
      </div>
    </div>
  `
})
export class ReceptionRegisterComponent {
  private patientsService = inject(PatientsService);
  private toast = inject(ToastService);
  router = inject(Router);

  searchQuery = '';
  results = signal<PatientSearchResult[]>([]);

  form = { fullName: '', dateOfBirth: '', gender: 'Female', bloodGroup: 'O+', mobile: '', emergencyContact: '', address: '', knownAllergies: '' };

  search(): void {
    if (this.searchQuery.trim().length < 2) { this.results.set([]); return; }
    this.patientsService.search(this.searchQuery).subscribe(r => this.results.set(r));
  }

  registerPatient(andBook: boolean): void {
    if (!this.form.fullName || !this.form.mobile) {
      this.toast.warn('Please provide at least full name and mobile number.');
      return;
    }
    this.patientsService.register({
      fullName: this.form.fullName,
      dateOfBirth: this.form.dateOfBirth || null,
      gender: this.form.gender,
      bloodGroup: this.form.bloodGroup,
      mobile: this.form.mobile,
      emergencyContact: this.form.emergencyContact,
      address: this.form.address,
      knownAllergies: this.form.knownAllergies || undefined
    }).subscribe(p => {
      this.toast.ok(`${p.uhid} generated. Patient profile created.`);
      this.form = { fullName: '', dateOfBirth: '', gender: 'Female', bloodGroup: 'O+', mobile: '', emergencyContact: '', address: '', knownAllergies: '' };
      if (andBook) this.router.navigateByUrl('/reception/appointment');
    });
  }
}
