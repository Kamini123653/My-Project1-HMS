import { Injectable, signal } from '@angular/core';

export interface ActivePatientContext {
  patientId: number;
  fullName: string;
  age: number;
  gender: string;
  uhid: string;
  department?: string;
  doctor?: string;
  ward?: string;
  bed?: string;
  knownAllergies?: string;
}

@Injectable({ providedIn: 'root' })
export class PatientContextService {
  active = signal<ActivePatientContext | null>(null);

  set(ctx: ActivePatientContext): void {
    this.active.set(ctx);
  }

  clear(): void {
    this.active.set(null);
  }
}
