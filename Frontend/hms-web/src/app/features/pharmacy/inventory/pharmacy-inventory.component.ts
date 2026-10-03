import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MedicineInventoryDto } from '../../../core/models/models';
import { PharmacyService } from '../../../core/services/pharmacy.service';

@Component({
  selector: 'app-pharmacy-inventory',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pagehead"><div><h1>Medicine Inventory</h1><div class="sub">Full stock list with batch and expiry tracking</div></div></div>
    <div class="card"><div class="card-b" style="padding:0;">
      <table>
        <thead><tr><th>Medicine</th><th>Stock</th><th>Nearest Expiry</th><th>Status</th></tr></thead>
        <tbody>
          @for (m of items(); track m.medicineId) {
            <tr>
              <td>{{ m.name }}</td><td>{{ m.totalStock }} {{ m.unit }}</td><td>{{ m.nearestExpiry ?? '—' }}</td>
              <td><span class="pill" [class]="m.status === 'OK' ? 'pill-ok' : 'pill-warn'">{{ m.status }}</span></td>
            </tr>
          }
        </tbody>
      </table>
    </div></div>
  `
})
export class PharmacyInventoryComponent implements OnInit {
  private pharmacyService = inject(PharmacyService);
  items = signal<MedicineInventoryDto[]>([]);
  ngOnInit(): void { this.pharmacyService.inventory().subscribe(i => this.items.set(i)); }
}
