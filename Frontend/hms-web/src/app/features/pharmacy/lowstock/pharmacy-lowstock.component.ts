import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LowStockDto } from '../../../core/models/models';
import { PharmacyService } from '../../../core/services/pharmacy.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-pharmacy-lowstock',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pagehead"><div><h1>Low Stock Alerts</h1><div class="sub">Items below reorder threshold</div></div></div>
    <div class="card"><div class="card-b" style="padding:0;">
      <table>
        <thead><tr><th>Medicine</th><th>Current Stock</th><th>Threshold</th><th>Action</th></tr></thead>
        <tbody>
          @for (m of items(); track m.medicineId) {
            <tr>
              <td>{{ m.name }}</td><td>{{ m.currentStock }}</td><td>{{ m.threshold }}</td>
              <td><button class="btn btn-sm btn-primary" (click)="createOrder(m)">Create Purchase Order</button></td>
            </tr>
          }
          @if (items().length === 0) {
            <tr><td colspan="4" class="empty">No low stock items right now.</td></tr>
          }
        </tbody>
      </table>
    </div></div>
  `
})
export class PharmacyLowstockComponent implements OnInit {
  private pharmacyService = inject(PharmacyService);
  private toast = inject(ToastService);
  router = inject(Router);
  items = signal<LowStockDto[]>([]);

  ngOnInit(): void { this.pharmacyService.lowStock().subscribe(i => this.items.set(i)); }

  createOrder(m: LowStockDto): void {
    this.toast.info(`Opening purchase entry for ${m.name}.`);
    this.router.navigateByUrl('/pharmacy/purchase');
  }
}
