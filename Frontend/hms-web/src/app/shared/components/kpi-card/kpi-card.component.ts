import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  template: `
    <div class="card kpi">
      <div class="k-label">{{ label }}</div>
      <div class="k-value">{{ value }}</div>
      @if (delta) {
        <div class="k-delta" [class]="dir">{{ dir === 'up' ? '▲' : dir === 'down' ? '▼' : '' }} {{ delta }}</div>
      }
    </div>
  `
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() delta?: string;
  @Input() dir?: 'up' | 'down';
}
