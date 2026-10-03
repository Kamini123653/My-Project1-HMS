import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DepartmentDto } from '../../../core/models/models';
import { OrgService } from '../../../core/services/org.service';
import { ToastService } from '../../../core/services/toast.service';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

@Component({
  selector: 'app-admin-departments',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusPillComponent],
  template: `
    <div class="pagehead">
      <div><h1>Manage Departments</h1><div class="sub">Departments available for appointment booking</div></div>
      <button class="btn btn-primary" (click)="showForm.set(!showForm())">{{ showForm() ? 'Cancel' : '+ Add New' }}</button>
    </div>

    @if (showForm()) {
      <div class="card" style="margin-bottom:16px;"><div class="card-b formgrid">
        <div class="field"><label>Department Name</label><input [(ngModel)]="form.name" /></div>
        <div class="field"><label>Avg. Consultation Fee (₹)</label><input type="number" [(ngModel)]="form.consultationFee" /></div>
      </div>
      <div class="card-b" style="padding-top:0;"><button class="btn btn-primary" (click)="create()">Save Department</button></div></div>
    }

    <div class="card"><div class="card-b" style="padding:0;">
      <table>
        <thead><tr><th>Department</th><th>Doctors</th><th>Avg. Consultation Fee</th><th>Status</th><th></th></tr></thead>
        <tbody>
          @for (d of departments(); track d.departmentId) {
            <tr>
              <td>{{ d.name }}</td>
              <td>{{ d.doctorCount }}</td>
              <td class="mono">₹{{ d.consultationFee }}</td>
              <td><app-status-pill [status]="d.isActive ? 'Active' : 'Inactive'" /></td>
              <td><button class="btn btn-sm btn-outline" (click)="toggleActive(d)">{{ d.isActive ? 'Deactivate' : 'Activate' }}</button></td>
            </tr>
          }
        </tbody>
      </table>
    </div></div>
  `
})
export class AdminDepartmentsComponent implements OnInit {
  private org = inject(OrgService);
  private toast = inject(ToastService);
  departments = signal<DepartmentDto[]>([]);
  showForm = signal(false);
  form = { name: '', consultationFee: 500 };

  ngOnInit(): void { this.reload(); }
  reload(): void {
    this.org.getDepartments().subscribe({
      next: d => this.departments.set(d),
      error: (err) => this.toast.danger(err.error?.message ?? `Could not load departments (HTTP ${err.status}).`)
    });
  }

  create(): void {
    if (!this.form.name) { this.toast.warn('Please enter a department name.'); return; }
    this.org.createDepartment(this.form.name, this.form.consultationFee).subscribe(() => {
      this.toast.ok(`Department ${this.form.name} created.`);
      this.showForm.set(false);
      this.form = { name: '', consultationFee: 500 };
      this.reload();
    });
  }

  toggleActive(d: DepartmentDto): void {
    this.org.updateDepartment(d.departmentId, d.name, d.consultationFee, !d.isActive).subscribe(() => {
      this.toast.ok(`${d.name} ${d.isActive ? 'deactivated' : 'activated'}.`);
      this.reload();
    });
  }
}
