import { Component } from '@angular/core';
import { WardBedsComponent } from '../../../shared/components/ward-beds/ward-beds.component';

@Component({
  selector: 'app-reception-beds',
  standalone: true,
  imports: [WardBedsComponent],
  template: `<app-ward-beds [canAdd]="false" />`
})
export class ReceptionBedsComponent {}
