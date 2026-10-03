import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DepartmentDto, UserDto } from '../../../core/models/models';
import { OrgService } from '../../../core/services/org.service';
import { ToastService } from '../../../core/services/toast.service';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

const ROLES = ['Admin', 'Doctor', 'Nurse', 'Receptionist', 'Pharmacist', 'Lab', 'Accountant'];

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusPillComponent],
  template: `
    <div class="pagehead">
      <div><h1>Manage Users &amp; Roles</h1><div class="sub">Staff accounts and module-level permissions</div></div>
      <button class="btn btn-primary" (click)="showForm.set(!showForm())">{{ showForm() ? 'Cancel' : '+ Add New' }}</button>
    </div>

    @if (showForm()) {
      <div class="card" style="margin-bottom:16px;">
        <div class="card-h"><h3>New User</h3></div>
        <div class="card-b formgrid">
          <div class="field"><label>Full Name</label><input [(ngModel)]="form.fullName" /></div>
          <div class="field"><label>Username</label><input [(ngModel)]="form.username" placeholder="e.g. r.iyer" /></div>
          <div class="field"><label>Temporary Password</label><input [(ngModel)]="form.password" type="text" /></div>
          <div class="field"><label>Role</label>
            <select [(ngModel)]="form.role">
              @for (r of roles; track r) { <option [value]="r">{{ r }}</option> }
            </select>
          </div>
          <div class="field"><label>Department (optional)</label>
            <select [(ngModel)]="form.departmentId">
              <option [ngValue]="undefined">—</option>
              @for (d of departments(); track d.departmentId) { <option [ngValue]="d.departmentId">{{ d.name }}</option> }
            </select>
          </div>
          <div class="field"><label>Email</label><input [(ngModel)]="form.email" /></div>
        </div>
        <div class="card-b" style="padding-top:0;">
          <button class="btn btn-primary" (click)="createUser()">Create User</button>
        </div>
      </div>
    }

    <div class="card"><div class="card-b" style="padding:0;">
      <table>
        <thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Status</th><th></th></tr></thead>
        <tbody>
          @for (u of users(); track u.userId) {
            <tr>
              <td>{{ u.fullName }} <span class="sub" style="font-size:11px;">&#64;{{ u.username }}</span></td>
              <td>{{ u.role }}</td>
              <td>{{ u.department ?? '—' }}</td>
              <td><app-status-pill [status]="u.isActive ? 'Active' : 'Inactive'" /></td>
              <td style="display:flex;gap:6px;">
                <button class="btn btn-sm btn-outline" (click)="toggleActive(u)">{{ u.isActive ? 'Deactivate' : 'Activate' }}</button>
                <button class="btn btn-sm btn-outline" (click)="openResetModal(u)">Reset Password</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div></div>

    @if (resetTarget(); as u) {
      <div class="modal-overlay" (click)="closeResetModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-h"><h3>Reset Password</h3><button class="modal-close" (click)="closeResetModal()">✕</button></div>
          <div class="modal-b">
            <div class="modal-info">
              <div><span class="label">Name</span><span>{{ u.fullName }}</span></div>
              <div><span class="label">Role</span><span>{{ u.role }}</span></div>
              <div><span class="label">Department</span><span>{{ u.department ?? '—' }}</span></div>
              <div><span class="label">Status</span><span>{{ u.isActive ? 'Active' : 'Inactive' }}</span></div>
            </div>

            <div class="field has-toggle" style="margin-bottom:12px;position:relative;">
              <label>Old Password</label>
              <input type="password" value="••••••••" disabled title="Not retrievable — passwords are stored as one-way hashes." />
            </div>
            <div class="field has-toggle" style="margin-bottom:12px;position:relative;">
              <label>New Password</label>
              <input [type]="showNew() ? 'text' : 'password'" [(ngModel)]="newPassword" placeholder="Enter new password" />
              <button type="button" class="pw-toggle" (click)="showNew.set(!showNew())">{{ showNew() ? '🙈' : '👁' }}</button>
            </div>
            <div class="field has-toggle" style="position:relative;">
              <label>Confirm New Password</label>
              <input [type]="showConfirm() ? 'text' : 'password'" [(ngModel)]="confirmPassword" placeholder="Re-enter new password" />
              <button type="button" class="pw-toggle" (click)="showConfirm.set(!showConfirm())">{{ showConfirm() ? '🙈' : '👁' }}</button>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" style="flex:1;" (click)="submitReset()">Save New Password</button>
            <button class="btn btn-outline" (click)="closeResetModal()">Cancel</button>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminUsersComponent implements OnInit {
  private org = inject(OrgService);
  private toast = inject(ToastService);

  users = signal<UserDto[]>([]);
  departments = signal<DepartmentDto[]>([]);
  showForm = signal(false);
  roles = ROLES;

  form = { fullName: '', username: '', password: 'Welcome@123', role: 'Doctor', departmentId: undefined as number | undefined, email: '' };

  resetTarget = signal<UserDto | null>(null);
  newPassword = '';
  confirmPassword = '';
  showNew = signal(false);
  showConfirm = signal(false);

  ngOnInit(): void {
    this.reload();
    this.org.getDepartments().subscribe({
      next: d => this.departments.set(d),
      error: (err) => this.toast.danger(err.error?.message ?? 'Could not load departments.')
    });
  }

  reload(): void {
    this.org.getUsers().subscribe(u => this.users.set(u));
  }

  createUser(): void {
    if (!this.form.fullName || !this.form.username || !this.form.password) {
      this.toast.warn('Please fill in name, username and password.');
      return;
    }
    this.org.createUser(this.form).subscribe({
      next: () => {
        this.toast.ok(`User ${this.form.fullName} created.`);
        this.showForm.set(false);
        this.form = { fullName: '', username: '', password: 'Welcome@123', role: 'Doctor', departmentId: undefined, email: '' };
        this.reload();
      },
      error: (err) => this.toast.danger(err.error?.message ?? 'Could not create user.')
    });
  }

  toggleActive(u: UserDto): void {
    this.org.updateUser(u.userId, { fullName: u.fullName, email: u.email, phone: u.phone, isActive: !u.isActive }).subscribe(() => {
      this.toast.ok(`${u.fullName} ${u.isActive ? 'deactivated' : 'activated'}.`);
      this.reload();
    });
  }

  openResetModal(u: UserDto): void {
    this.resetTarget.set(u);
    this.newPassword = '';
    this.confirmPassword = '';
    this.showNew.set(false);
    this.showConfirm.set(false);
  }

  closeResetModal(): void {
    this.resetTarget.set(null);
  }

  submitReset(): void {
    const u = this.resetTarget();
    if (!u) return;
    if (!this.newPassword || this.newPassword.length < 6) {
      this.toast.warn('New password must be at least 6 characters.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.toast.danger('New password and confirmation do not match.');
      return;
    }
    this.org.resetPassword(u.userId, this.newPassword).subscribe({
      next: () => {
        this.toast.ok(`Password reset for ${u.fullName}.`);
        this.closeResetModal();
      },
      error: (err) => this.toast.danger(err.error?.message ?? 'Could not reset password.')
    });
  }
}
