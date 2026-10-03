import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { BedDto, DepartmentDto, DoctorDto, UserDto, WardDto } from '../models/models';

@Injectable({ providedIn: 'root' })
export class OrgService {
  constructor(private http: HttpClient) {}

  // Departments
  getDepartments(): Observable<DepartmentDto[]> {
    return this.http.get<DepartmentDto[]>(`${API_BASE_URL}/departments`);
  }
  createDepartment(name: string, consultationFee: number): Observable<DepartmentDto> {
    return this.http.post<DepartmentDto>(`${API_BASE_URL}/departments`, { name, consultationFee });
  }
  updateDepartment(id: number, name: string, consultationFee: number, isActive: boolean): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/departments/${id}`, { name, consultationFee, isActive });
  }

  // Doctors
  getDoctors(departmentId?: number): Observable<DoctorDto[]> {
    const params: Record<string, string> = {};
    if (departmentId) params['departmentId'] = departmentId.toString();
    return this.http.get<DoctorDto[]>(`${API_BASE_URL}/doctors`, { params });
  }
  updateDoctorSchedule(id: number, body: { consultationFee: number; hoursFrom: string; hoursTo: string; weeklyAvailability: boolean[] }): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/doctors/${id}/schedule`, body);
  }

  // Wards & Beds
  getWards(): Observable<WardDto[]> {
    return this.http.get<WardDto[]>(`${API_BASE_URL}/wards`);
  }
  getBeds(wardId?: number, status?: string): Observable<BedDto[]> {
    const params: Record<string, string> = {};
    if (wardId) params['wardId'] = wardId.toString();
    if (status) params['status'] = status;
    return this.http.get<BedDto[]>(`${API_BASE_URL}/wards/beds`, { params });
  }
  createWard(name: string, ratePerDay: number, bedCount: number, bedPrefix: string): Observable<WardDto> {
    return this.http.post<WardDto>(`${API_BASE_URL}/wards`, { name, ratePerDay, bedCount, bedPrefix });
  }

  // Users
  getUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${API_BASE_URL}/users`);
  }
  createUser(body: { username: string; fullName: string; password: string; role: string; email?: string; phone?: string; departmentId?: number }): Observable<UserDto> {
    return this.http.post<UserDto>(`${API_BASE_URL}/users`, body);
  }
  updateUser(id: number, body: { fullName: string; email?: string; phone?: string; isActive: boolean; departmentId?: number }): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/users/${id}`, body);
  }
  resetPassword(id: number, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_BASE_URL}/users/${id}/reset-password`, { newPassword });
  }
}
