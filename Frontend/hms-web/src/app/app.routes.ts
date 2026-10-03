import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },

  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: 'change-password', loadComponent: () => import('./features/shared/change-password/change-password.component').then(m => m.ChangePasswordComponent) },

      {
        path: 'admin', canActivate: [roleGuard(['Admin'])], children: [
          { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
          { path: 'users', loadComponent: () => import('./features/admin/users/admin-users.component').then(m => m.AdminUsersComponent) },
          { path: 'departments', loadComponent: () => import('./features/admin/departments/admin-departments.component').then(m => m.AdminDepartmentsComponent) },
          { path: 'doctors', loadComponent: () => import('./features/admin/doctors/admin-doctors.component').then(m => m.AdminDoctorsComponent) },
          { path: 'wards', loadComponent: () => import('./features/admin/wards/admin-wards.component').then(m => m.AdminWardsComponent) },
          { path: 'reports', loadComponent: () => import('./features/admin/reports/admin-reports.component').then(m => m.AdminReportsComponent) },
          { path: 'settings', loadComponent: () => import('./features/admin/settings/admin-settings.component').then(m => m.AdminSettingsComponent) },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ]
      },
      {
        path: 'doctor', canActivate: [roleGuard(['Doctor'])], children: [
          { path: 'dashboard', loadComponent: () => import('./features/doctor/dashboard/doctor-dashboard.component').then(m => m.DoctorDashboardComponent) },
          { path: 'queue', loadComponent: () => import('./features/doctor/queue/doctor-queue.component').then(m => m.DoctorQueueComponent) },
          { path: 'consult', loadComponent: () => import('./features/doctor/consult/doctor-consult.component').then(m => m.DoctorConsultComponent) },
          { path: 'ipd', loadComponent: () => import('./features/doctor/ipd/doctor-ipd.component').then(m => m.DoctorIpdComponent) },
          { path: 'reports', loadComponent: () => import('./features/doctor/reports/doctor-reports.component').then(m => m.DoctorReportsComponent) },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ]
      },
      {
        path: 'nurse', canActivate: [roleGuard(['Nurse'])], children: [
          { path: 'dashboard', loadComponent: () => import('./features/nurse/dashboard/nurse-dashboard.component').then(m => m.NurseDashboardComponent) },
          { path: 'vitals', loadComponent: () => import('./features/nurse/vitals/nurse-vitals.component').then(m => m.NurseVitalsComponent) },
          { path: 'ipd', loadComponent: () => import('./features/nurse/ipd/nurse-ipd.component').then(m => m.NurseIpdComponent) },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ]
      },
      {
        path: 'reception', canActivate: [roleGuard(['Receptionist', 'Admin'])], children: [
          { path: 'dashboard', loadComponent: () => import('./features/reception/dashboard/reception-dashboard.component').then(m => m.ReceptionDashboardComponent) },
          { path: 'register', loadComponent: () => import('./features/reception/register/reception-register.component').then(m => m.ReceptionRegisterComponent) },
          { path: 'appointment', loadComponent: () => import('./features/reception/appointment/reception-appointment.component').then(m => m.ReceptionAppointmentComponent) },
          { path: 'ipd-admit', loadComponent: () => import('./features/reception/ipd-admit/reception-ipd-admit.component').then(m => m.ReceptionIpdAdmitComponent) },
          { path: 'beds', loadComponent: () => import('./features/reception/beds/reception-beds.component').then(m => m.ReceptionBedsComponent) },
          { path: 'discharge', loadComponent: () => import('./features/reception/discharge/reception-discharge.component').then(m => m.ReceptionDischargeComponent) },
          { path: 'bill', loadComponent: () => import('./features/reception/bill/reception-bill.component').then(m => m.ReceptionBillComponent) },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ]
      },
      {
        path: 'pharmacy', canActivate: [roleGuard(['Pharmacist', 'Admin'])], children: [
          { path: 'dashboard', loadComponent: () => import('./features/pharmacy/dashboard/pharmacy-dashboard.component').then(m => m.PharmacyDashboardComponent) },
          { path: 'queue', loadComponent: () => import('./features/pharmacy/queue/pharmacy-queue.component').then(m => m.PharmacyQueueComponent) },
          { path: 'queue/:id', loadComponent: () => import('./features/pharmacy/dispense/pharmacy-dispense.component').then(m => m.PharmacyDispenseComponent) },
          { path: 'inventory', loadComponent: () => import('./features/pharmacy/inventory/pharmacy-inventory.component').then(m => m.PharmacyInventoryComponent) },
          { path: 'purchase', loadComponent: () => import('./features/pharmacy/purchase/pharmacy-purchase.component').then(m => m.PharmacyPurchaseComponent) },
          { path: 'lowstock', loadComponent: () => import('./features/pharmacy/lowstock/pharmacy-lowstock.component').then(m => m.PharmacyLowstockComponent) },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ]
      },
      {
        path: 'lab', canActivate: [roleGuard(['Lab', 'Admin'])], children: [
          { path: 'dashboard', loadComponent: () => import('./features/lab/dashboard/lab-dashboard.component').then(m => m.LabDashboardComponent) },
          { path: 'queue', loadComponent: () => import('./features/lab/queue/lab-queue.component').then(m => m.LabQueueComponent) },
          { path: 'queue/:id', loadComponent: () => import('./features/lab/detail/lab-detail.component').then(m => m.LabDetailComponent) },
          { path: 'collection', loadComponent: () => import('./features/lab/collection/lab-collection.component').then(m => m.LabCollectionComponent) },
          { path: 'results', loadComponent: () => import('./features/lab/results/lab-results.component').then(m => m.LabResultsComponent) },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ]
      },
      {
        path: 'billing', canActivate: [roleGuard(['Accountant', 'Admin'])], children: [
          { path: 'dashboard', loadComponent: () => import('./features/billing/dashboard/billing-dashboard.component').then(m => m.BillingDashboardComponent) },
          { path: 'consolidated', loadComponent: () => import('./features/billing/consolidated/billing-consolidated.component').then(m => m.BillingConsolidatedComponent) },
          { path: 'payments', loadComponent: () => import('./features/billing/payments/billing-payments.component').then(m => m.BillingPaymentsComponent) },
          { path: 'insurance', loadComponent: () => import('./features/billing/insurance/billing-insurance.component').then(m => m.BillingInsuranceComponent) },
          { path: 'reports', loadComponent: () => import('./features/admin/reports/admin-reports.component').then(m => m.AdminReportsComponent) },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ]
      },

      { path: '', pathMatch: 'full', redirectTo: 'admin/dashboard' },
    ]
  },

  { path: '**', redirectTo: 'login' },
];
