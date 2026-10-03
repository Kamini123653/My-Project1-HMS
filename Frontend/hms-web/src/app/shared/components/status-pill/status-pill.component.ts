import { Component, Input } from '@angular/core';

const MAP: Record<string, [string, string]> = {
  Waiting: ['pill-warn', 'Waiting'],
  InConsult: ['pill-info', 'In Consultation'],
  Completed: ['pill-ok', 'Completed'],
  Cancelled: ['pill-danger', 'Cancelled'],
  Admitted: ['pill-info', 'Admitted'],
  DischargeAdvised: ['pill-info', 'Discharge Advised'],
  Discharged: ['pill-ok', 'Discharged'],
  Pending: ['pill-warn', 'Pending'],
  Collected: ['pill-info', 'Sample Collected'],
  ResultReady: ['pill-ok', 'Result Ready'],
  Dispensed: ['pill-ok', 'Dispensed'],
  Available: ['pill-ok', 'Available'],
  Occupied: ['pill-danger', 'Occupied'],
  Paid: ['pill-ok', 'Paid'],
  Partial: ['pill-warn', 'Partial'],
  Submitted: ['pill-info', 'Submitted'],
  UnderReview: ['pill-warn', 'Under Review'],
  Approved: ['pill-ok', 'Approved'],
  Rejected: ['pill-danger', 'Rejected'],
  Active: ['pill-ok', 'Active'],
  Inactive: ['pill-warn', 'Inactive'],
};

@Component({
  selector: 'app-status-pill',
  standalone: true,
  template: `<span class="pill" [class]="cls">{{ text }}</span>`
})
export class StatusPillComponent {
  cls = 'pill-info';
  text = '';

  @Input() set status(value: string) {
    const [c, t] = MAP[value] ?? ['pill-info', value];
    this.cls = c;
    this.text = t;
  }
}
