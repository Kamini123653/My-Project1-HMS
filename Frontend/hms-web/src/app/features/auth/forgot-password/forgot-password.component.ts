import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { API_BASE_URL } from '../../../core/api-config';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--navy),var(--navy-2));">
      <div class="card" style="width:380px;padding:0;">
        @if (sent()) {
          <div style="padding:32px 28px;text-align:center;">
            <div style="width:46px;height:46px;border-radius:50%;background:var(--ok-bg);color:var(--ok);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:20px;">✓</div>
            <h1 style="font-size:17px;margin-bottom:6px;">Check your inbox</h1>
            <div class="sub">If an account matches those details, a password reset link has been sent. The link expires in 30 minutes.</div>
            <button class="btn btn-primary" style="width:100%;margin-top:20px;" routerLink="/login">Back to Sign In</button>
          </div>
        } @else {
          <div style="padding:28px 28px 8px;text-align:center;">
            <div style="width:46px;height:46px;border-radius:12px;background:var(--teal);color:#fff;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-family:'Lexend',sans-serif;font-weight:700;font-size:18px;">H</div>
            <h1 style="font-size:19px;">Forgot Password</h1>
            <div class="sub" style="margin-top:2px;">Enter your username or registered email — we'll send a reset link</div>
          </div>
          <div class="card-b" style="padding:20px 28px 28px;">
            <a class="auth-back" routerLink="/login">← Back to Sign In</a>
            <div class="field field-icon" style="margin-bottom:16px;">
              <label>Username or Email</label>
              <span class="fi-ic">👤</span>
              <input [(ngModel)]="usernameOrEmail" placeholder="e.g. r.iyer or r.iyer&#64;citycare.in" />
            </div>
            <button class="btn btn-primary" style="width:100%;" [disabled]="loading()" (click)="submit()">Send Reset Link</button>
          </div>
        }
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  private http = inject(HttpClient);
  usernameOrEmail = '';
  loading = signal(false);
  sent = signal(false);

  submit(): void {
    if (!this.usernameOrEmail) return;
    this.loading.set(true);
    this.http.post(`${API_BASE_URL}/auth/forgot-password`, { usernameOrEmail: this.usernameOrEmail }).subscribe({
      next: () => { this.loading.set(false); this.sent.set(true); },
      error: () => { this.loading.set(false); this.sent.set(true); }
    });
  }
}
