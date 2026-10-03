import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--navy),var(--navy-2));">
      <div class="card" style="width:380px;padding:0;">
        <div style="padding:28px 28px 20px;text-align:center;">
          <div style="width:46px;height:46px;border-radius:12px;background:var(--teal);color:#fff;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-family:'Lexend',sans-serif;font-weight:700;font-size:18px;">H</div>
          <h1 style="font-size:19px;">City Care HMS</h1>
          <div class="sub" style="margin-top:2px;">Sign in to your role dashboard</div>
        </div>
        <div class="card-b" style="padding:0 28px 28px;">
          <div class="field field-icon" style="margin-bottom:12px;">
            <label>User Name</label>
            <span class="fi-ic">👤</span>
            <input [(ngModel)]="username" placeholder="e.g. r.iyer" (keyup.enter)="submit()" />
          </div>
          <div class="field field-icon has-toggle" style="margin-bottom:10px;">
            <label>Password</label>
            <span class="fi-ic">🔒</span>
            <input [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" (keyup.enter)="submit()" />
            <button type="button" class="pw-toggle" (click)="showPassword.set(!showPassword())">{{ showPassword() ? '🙈' : '👁' }}</button>
          </div>
          <div class="auth-row">
            <label class="remember"><input type="checkbox" /> Remember Me?</label>
            <a routerLink="/forgot-password">Forgot Password?</a>
          </div>
          <button class="btn btn-primary" style="width:100%;" [disabled]="loading()" (click)="submit()">
            {{ loading() ? 'Signing in…' : 'Sign In' }}
          </button>
          @if (error()) {
            <div class="error-text">{{ error() }}</div>
          }
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';
  loading = signal(false);
  error = signal('');
  showPassword = signal(false);

  submit(): void {
    if (!this.username || !this.password) {
      this.error.set('Please enter both username and password.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl(this.auth.homeRoute());
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Invalid username or password.');
      }
    });
  }
}
