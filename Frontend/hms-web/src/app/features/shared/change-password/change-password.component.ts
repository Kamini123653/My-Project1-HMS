import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { API_BASE_URL } from '../../../core/api-config';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="pagehead"><div><h1>Change Password</h1><div class="sub">Self-service password update for your account</div></div></div>
    <div class="card" style="max-width:420px;">
      <div class="card-b">
        <div class="field has-toggle" style="margin-bottom:12px;position:relative;">
          <label>Current Password</label>
          <input [type]="showCurrent() ? 'text' : 'password'" [(ngModel)]="currentPassword" placeholder="••••••••" />
          <button type="button" class="pw-toggle" (click)="showCurrent.set(!showCurrent())">{{ showCurrent() ? '🙈' : '👁' }}</button>
        </div>
        <div class="field has-toggle" style="margin-bottom:6px;position:relative;">
          <label>New Password</label>
          <input [type]="showNew() ? 'text' : 'password'" [(ngModel)]="newPassword" placeholder="••••••••" />
          <button type="button" class="pw-toggle" (click)="showNew.set(!showNew())">{{ showNew() ? '🙈' : '👁' }}</button>
        </div>
        <div class="pw-meter"><div class="bar" [style.width.%]="strength()"></div></div>
        <div class="field has-toggle" style="margin:12px 0;position:relative;">
          <label>Confirm New Password</label>
          <input [type]="showConfirm() ? 'text' : 'password'" [(ngModel)]="confirmPassword" placeholder="••••••••" />
          <button type="button" class="pw-toggle" (click)="showConfirm.set(!showConfirm())">{{ showConfirm() ? '🙈' : '👁' }}</button>
        </div>
        <button class="btn btn-primary" style="width:100%;" [disabled]="loading()" (click)="submit()">Update Password</button>
      </div>
    </div>
  `
})
export class ChangePasswordComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  loading = signal(false);
  showCurrent = signal(false);
  showNew = signal(false);
  showConfirm = signal(false);

  strength(): number {
    return Math.min(100, this.newPassword.length * 10);
  }

  submit(): void {
    if (!this.currentPassword || !this.newPassword) {
      this.toast.warn('Please fill in all fields.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.toast.danger('New password and confirmation do not match.');
      return;
    }
    this.loading.set(true);
    this.http.post(`${API_BASE_URL}/auth/change-password`, {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.ok('Password updated successfully.');
        this.currentPassword = this.newPassword = this.confirmPassword = '';
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.toast.danger(err.error?.message ?? 'Could not update password.');
      }
    });
  }
}
