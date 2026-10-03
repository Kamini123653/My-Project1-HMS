import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PatientStripComponent } from '../../shared/components/patient-strip/patient-strip.component';
import { ToastContainerComponent } from '../../shared/components/toast-container/toast-container.component';
import { NAV } from './nav-config';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PatientStripComponent, ToastContainerComponent],
  template: `
    <div id="app">
      <div class="sidebar" [class.collapsed]="collapsed()">
        <div class="brand">
          <div class="mark">H</div>
          <div class="name">City Care HMS</div>
        </div>
        <nav>
          @for (item of navItems(); track item.path) {
            <a class="nav-item" [routerLink]="item.path" routerLinkActive="active">
              <span class="ic">{{ item.icon }}</span>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          }
        </nav>
      </div>

      <div class="main">
        <div class="topbar">
          <button class="toggle" (click)="collapsed.set(!collapsed())">☰</button>
          <div class="search">
            <span class="ic">⌕</span>
            <input placeholder="Search patient by name, UHID or mobile…" />
          </div>
          <div class="spacer"></div>
          <div class="bell">🔔<span class="dot"></span></div>
          <div class="userchip">
            <div class="avatar">{{ initials(auth.user()?.fullName) }}</div>
            <div>
              <div style="font-weight:600;">{{ auth.user()?.fullName }}</div>
              <div class="sub" style="font-size:11px;">{{ auth.user()?.role }}</div>
            </div>
          </div>
          <button class="btn btn-sm btn-outline" (click)="auth.logout()">Sign out</button>
        </div>

        <div class="content">
          <app-patient-strip />
          <router-outlet />
        </div>
      </div>
      <app-toast-container />
    </div>
  `
})
export class ShellComponent {
  auth = inject(AuthService);
  collapsed = signal(false);

  navItems() {
    const role = this.auth.user()?.role;
    return role ? NAV[role] ?? [] : [];
  }

  initials(name?: string): string {
    if (!name) return '';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
