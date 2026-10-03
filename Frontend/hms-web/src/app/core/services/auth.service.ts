import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { LoginResponse, UserDto } from '../models/models';

const TOKEN_KEY = 'hms_token';
const USER_KEY = 'hms_user';

export const ROLE_HOME: Record<string, string> = {
  Admin: '/admin/dashboard',
  Doctor: '/doctor/dashboard',
  Nurse: '/nurse/dashboard',
  Receptionist: '/reception/dashboard',
  Pharmacist: '/pharmacy/dashboard',
  Lab: '/lab/dashboard',
  Accountant: '/billing/dashboard',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSignal = signal<UserDto | null>(this.loadUser());
  user = computed(() => this.userSignal());
  isLoggedIn = computed(() => !!this.userSignal());

  constructor(private http: HttpClient, private router: Router) {}

  private loadUser(): UserDto | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) as UserDto : null;
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_BASE_URL}/auth/login`, { username, password }).pipe(
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        this.userSignal.set(res.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  homeRoute(): string {
    const role = this.userSignal()?.role;
    return (role && ROLE_HOME[role]) || '/login';
  }
}
