import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MedicineOptionDto, VendorDto } from '../../../core/models/models';
import { MedicinesService } from '../../../core/services/clinical.service';
import { PharmacyService } from '../../../core/services/pharmacy.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-pharmacy-purchase',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pagehead"><div><h1>Purchase / Stock Entry</h1><div class="sub">Add new stock received from vendors</div></div></div>
    <div class="card"><div class="card-b formgrid">
      <div class="field"><label>Vendor</label>
        <select [(ngModel)]="form.vendorId">
          <option [ngValue]="undefined">Select vendor</option>
          @for (v of vendors(); track v.vendorId) { <option [ngValue]="v.vendorId">{{ v.name }}</option> }
        </select>
      </div>
      <div class="field"><label>Invoice Number</label><input [(ngModel)]="form.invoiceNumber" placeholder="e.g. INV-88213" /></div>
      <div class="field"><label>Medicine</label>
        <select [(ngModel)]="form.medicineId">
          <option [ngValue]="undefined">Select medicine</option>
          @for (m of medicines(); track m.medicineId) { <option [ngValue]="m.medicineId">{{ m.name }}</option> }
        </select>
      </div>
      <div class="field"><label>Batch Number</label><input [(ngModel)]="form.batchNumber" placeholder="e.g. B-5513" /></div>
      <div class="field"><label>Quantity Received</label><input type="number" [(ngModel)]="form.quantity" placeholder="e.g. 200" /></div>
      <div class="field"><label>Expiry Date</label><input type="date" [(ngModel)]="form.expiryDate" /></div>
    </div>
    <div class="card-b" style="padding-top:0;"><button class="btn btn-primary" (click)="save()">Save Stock Entry</button></div></div>
  `
})
export class PharmacyPurchaseComponent implements OnInit {
  private pharmacyService = inject(PharmacyService);
  private medicinesService = inject(MedicinesService);
  private toast = inject(ToastService);

  vendors = signal<VendorDto[]>([]);
  medicines = signal<MedicineOptionDto[]>([]);
  form = { vendorId: undefined as number | undefined, invoiceNumber: '', medicineId: undefined as number | undefined, batchNumber: '', quantity: 0, expiryDate: '' };

  ngOnInit(): void {
    this.pharmacyService.vendors().subscribe(v => this.vendors.set(v));
    this.medicinesService.getAll().subscribe(m => this.medicines.set(m));
  }

  save(): void {
    if (!this.form.vendorId || !this.form.medicineId || !this.form.invoiceNumber || !this.form.batchNumber || !this.form.expiryDate || !this.form.quantity) {
      this.toast.warn('Please fill in all fields.');
      return;
    }
    this.pharmacyService.stockEntry(this.form as any).subscribe(res => {
      this.toast.ok(res.message);
      this.form = { vendorId: undefined, invoiceNumber: '', medicineId: undefined, batchNumber: '', quantity: 0, expiryDate: '' };
    });
  }
}
