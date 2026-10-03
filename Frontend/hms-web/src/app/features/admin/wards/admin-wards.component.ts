import { Component } from '@angular/core';
import { WardBedsComponent } from '../../../shared/components/ward-beds/ward-beds.component';

@Component({
  selector: 'app-admin-wards',
  standalone: true,
  imports: [WardBedsComponent],
  template: `<app-ward-beds [canAdd]="true" />`
})
export class AdminWardsComponent {}
