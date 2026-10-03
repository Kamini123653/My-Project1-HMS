import { Injectable, signal } from '@angular/core';

export type ToastType = 'ok' | 'warn' | 'danger' | 'info';
export interface Toast { id: number; msg: string; type: ToastType; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  toasts = signal<Toast[]>([]);

  show(msg: string, type: ToastType = 'info'): void {
    const id = ++this.seq;
    this.toasts.update(list => [...list, { id, msg, type }]);
    setTimeout(() => this.toasts.update(list => list.filter(t => t.id !== id)), 4000);
  }

  ok(msg: string) { this.show(msg, 'ok'); }
  warn(msg: string) { this.show(msg, 'warn'); }
  danger(msg: string) { this.show(msg, 'danger'); }
  info(msg: string) { this.show(msg, 'info'); }
}
