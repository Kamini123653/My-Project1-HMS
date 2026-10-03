import { Component, inject } from '@angular/core';
import { PatientContextService } from '../../../core/services/patient-context.service';

@Component({
  selector: 'app-patient-strip',
  standalone: true,
  template: `
    @if (ctx.active(); as p) {
      <div class="patient-strip">
        <div class="pavatar">{{ initials(p.fullName) }}</div>
        <div class="pinfo">
          <div class="pname">{{ p.fullName }} <span style="font-weight:400;opacity:.85;">· {{ p.age }}{{ p.gender.charAt(0) }}</span></div>
          <div class="pmeta">UHID <span class="mono">{{ p.uhid }}</span>
            @if (p.department) { &nbsp;·&nbsp; {{ p.department }} }
            @if (p.doctor) { · {{ p.doctor }} }
          </div>
        </div>
        @if (p.ward) { <span class="badge-ipd">{{ p.ward }} · Bed {{ p.bed }}</span> }
        @if (p.knownAllergies) { <span class="badge-allergy">⚠ Allergy: {{ p.knownAllergies }}</span> }
        <button class="close-strip" (click)="ctx.clear()">✕</button>
      </div>
    }
  `
})
export class PatientStripComponent {
  ctx = inject(PatientContextService);

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
