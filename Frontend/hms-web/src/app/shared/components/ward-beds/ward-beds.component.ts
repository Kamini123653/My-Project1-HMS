import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BedDto, WardDto } from '../../../core/models/models';
import { OrgService } from '../../../core/services/org.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-ward-beds',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pagehead">
      <div><h1>Ward &amp; Bed Setup</h1><div class="sub">Real-time occupancy across all wards</div></div>
      @if (canAdd) {
        <button class="btn btn-primary" (click)="showForm.set(!showForm())">{{ showForm() ? 'Cancel' : '+ Add Ward' }}</button>
      }
    </div>

    @if (showForm()) {
      <div class="card" style="margin-bottom:16px;"><div class="card-b formgrid">
        <div class="field"><label>Ward Name</label><input [(ngModel)]="form.name" /></div>
        <div class="field"><label>Rate / Day (₹)</label><input type="number" [(ngModel)]="form.ratePerDay" /></div>
        <div class="field"><label>Number of Beds</label><input type="number" [(ngModel)]="form.bedCount" /></div>
        <div class="field"><label>Bed Number Prefix</label><input [(ngModel)]="form.bedPrefix" placeholder="e.g. GW" /></div>
      </div>
      <div class="card-b" style="padding-top:0;"><button class="btn btn-primary" (click)="createWard()">Save Ward</button></div></div>
    }

    @for (w of wards(); track w.wardId) {
      <div class="section-title">{{ w.name }} · ₹{{ w.ratePerDay }}/day · {{ w.totalBeds }} beds · <span class="mono">{{ w.occupiedBeds }}/{{ w.totalBeds }} occupied</span></div>
      <div class="bed-grid">
        @for (b of bedsByWard(w.wardId); track b.bedId) {
          <div class="bed" [class.occupied]="b.status === 'Occupied'" [class.available]="b.status === 'Available'">
            <div class="bnum">{{ b.bedNumber }}</div>
            <div class="bstatus">{{ b.status }}</div>
          </div>
        }
      </div>
    }
  `
})
export class WardBedsComponent implements OnInit {
  @Input() canAdd = false;

  private org = inject(OrgService);
  private toast = inject(ToastService);

  wards = signal<WardDto[]>([]);
  beds = signal<BedDto[]>([]);
  showForm = signal(false);
  form = { name: '', ratePerDay: 1800, bedCount: 6, bedPrefix: 'GW' };

  ngOnInit(): void { this.reload(); }

  reload(): void {
    this.org.getWards().subscribe(w => this.wards.set(w));
    this.org.getBeds().subscribe(b => this.beds.set(b));
  }

  bedsByWard(wardId: number): BedDto[] {
    return this.beds().filter(b => b.wardId === wardId);
  }

  createWard(): void {
    if (!this.form.name || !this.form.bedPrefix) { this.toast.warn('Please fill in ward name and bed prefix.'); return; }
    this.org.createWard(this.form.name, this.form.ratePerDay, this.form.bedCount, this.form.bedPrefix).subscribe(() => {
      this.toast.ok(`Ward ${this.form.name} created with ${this.form.bedCount} beds.`);
      this.showForm.set(false);
      this.form = { name: '', ratePerDay: 1800, bedCount: 6, bedPrefix: 'GW' };
      this.reload();
    });
  }
}
