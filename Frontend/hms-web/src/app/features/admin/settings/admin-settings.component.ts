import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

const SETTINGS = ['Ward & Room Types', 'Consultation Charges', 'Lab Test Master', 'Medicine Master', 'Notification Templates', 'Role & Permission Matrix'];

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  template: `
    <div class="pagehead"><div><h1>System Settings</h1><div class="sub">Master data used across modules</div></div></div>
    <div class="grid g-3">
      @for (s of settings; track s) {
        <div class="card card-b" style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;font-size:13.5px;">{{ s }}</span>
          <button class="btn btn-sm btn-outline" (click)="toast.info(s + ' is managed from Manage Departments / Doctors / Wards / Pharmacy screens.')">Configure</button>
        </div>
      }
    </div>
  `
})
export class AdminSettingsComponent {
  toast = inject(ToastService);
  settings = SETTINGS;
}
