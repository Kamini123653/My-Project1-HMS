import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TestOrderDto, TestResultDto } from '../../../core/models/models';
import { LabService } from '../../../core/services/lab.service';
import { ToastService } from '../../../core/services/toast.service';

const PARAM_SETS: Record<string, string[]> = {
  'Complete Blood Count (CBC)': ['Hemoglobin', 'WBC Count', 'Platelet Count', 'RBC Count'],
  'Lipid Profile': ['Total Cholesterol', 'HDL', 'LDL', 'Triglycerides'],
  'HbA1c': ['HbA1c'],
  'X-Ray Chest': ['Findings'],
  'CT Scan': ['Findings'],
  'Ultrasound Abdomen': ['Findings'],
};

@Component({
  selector: 'app-lab-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (order(); as o) {
      <div class="crumb"><a (click)="router.navigateByUrl('/lab/queue')">Test Order Queue</a> / <b>LAB-{{ o.orderId }}</b></div>
      <div class="grid g-2" style="align-items:start;">
        <div class="card">
          <div class="card-h"><h3>{{ o.testName }} <span class="pill pill-info">{{ o.type }}</span></h3></div>
          <div class="card-b">
            @if (o.status === 'Pending') {
              <p class="sub" style="margin-bottom:12px;">Sample not yet collected.</p>
              <button class="btn btn-primary" (click)="collect(o)">Mark Sample Collected</button>
            } @else if (o.status === 'Collected') {
              <div class="formgrid">
                @for (p of paramNames(o.testName); track p) {
                  <div class="field"><label>{{ p }}</label><input [(ngModel)]="resultParams[p]" /></div>
                }
              </div>
              <button class="btn btn-primary" style="margin-top:12px;" (click)="saveResult(o)">Save Results &amp; Generate Report</button>
            } @else {
              <p class="sub" style="margin-bottom:12px;">Report generated and sent to {{ o.orderedBy }}.</p>
              @if (resultData(); as rd) {
                @for (kv of objectEntries(rd); track kv[0]) {
                  <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span>{{ kv[0] }}</span><span class="mono">{{ kv[1] }}</span></div>
                }
              }
            }
          </div>
        </div>
        <div class="card card-b">
          <h3 style="margin-bottom:10px;">Order Notes</h3>
          <div class="sub">Ordered by {{ o.orderedBy }} · Sample ID: {{ o.sampleId ?? 'not yet assigned' }}</div>
        </div>
      </div>
    }
  `
})
export class LabDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private labService = inject(LabService);
  private toast = inject(ToastService);
  router = inject(Router);

  order = signal<TestOrderDto | null>(null);
  resultData = signal<Record<string, string> | null>(null);
  resultParams: Record<string, string> = {};
  orderId = 0;

  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.labService.queue().subscribe(list => {
      const found = list.find(o => o.orderId === this.orderId) ?? null;
      this.order.set(found);
    });
    this.labService.getResult(this.orderId).subscribe({
      next: (r: TestResultDto) => { if (r.resultData) this.resultData.set(JSON.parse(r.resultData)); },
      error: () => {}
    });
  }

  paramNames(testName: string): string[] {
    return PARAM_SETS[testName] ?? ['Result'];
  }

  objectEntries(o: Record<string, string>): [string, string][] {
    return Object.entries(o);
  }

  collect(o: TestOrderDto): void {
    this.labService.collect(o.orderId).subscribe(res => { this.toast.ok(res.message); this.load(); });
  }

  saveResult(o: TestOrderDto): void {
    this.labService.saveResult(o.orderId, this.resultParams).subscribe(res => {
      this.toast.ok(res.message);
      this.load();
    });
  }
}
