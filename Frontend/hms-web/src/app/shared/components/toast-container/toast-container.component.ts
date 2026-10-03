import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="toast-container">
      @for (t of toastService.toasts(); track t.id) {
        <div class="toast" [class]="t.type">
          <span class="t-ic">{{ icon(t.type) }}</span>
          <span>{{ t.msg }}</span>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  icon(type: string): string {
    return { ok: '✓', warn: '⚠', danger: '✕', info: 'ℹ' }[type] ?? 'ℹ';
  }
}
