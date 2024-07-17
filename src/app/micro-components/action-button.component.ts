import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'action-button',
  template: `
    <div [ngSwitch]="value.type">
      <button *ngSwitchCase="'ver'" title="{{ 'GLOBAL.tooltip_ver_registro' | translate }}"
        [disabled]="value.disabled" (click)="action()" mat-icon-button color="accent" >
        <mat-icon>visibility</mat-icon>
      </button>
      <button *ngSwitchCase="'editar'" title="{{ 'GLOBAL.tooltip_editar_registro' | translate }}"
        [disabled]="value.disabled" (click)="action()" mat-icon-button color="accent" >
        <mat-icon>edit</mat-icon>
      </button>
      <button *ngSwitchCase="'borrar'" title="{{ 'GLOBAL.eliminar' | translate }}"
        [disabled]="value.disabled" (click)="action()" mat-icon-button color="accent" >
        <mat-icon>delete</mat-icon>
      </button>
      <button *ngSwitchCase="'crear'" title="{{ 'GLOBAL.crear' | translate }}"
        [disabled]="value.disabled" (click)="action()" mat-icon-button color="accent" >
        <mat-icon>add</mat-icon>
      </button>
      <button *ngSwitchCase="'enviar'" title="{{ 'GLOBAL.enviar' | translate }}"
        [disabled]="value.disabled" (click)="action()" mat-icon-button color="accent" >
        <mat-icon>send</mat-icon>
      </button>
    </div>
  `,
  styles: [
    'div { display: flex; justify-content:center; align-items:center; }',
  ]
})
export class ActionButtonComponent {

  @Input() value: any;
  @Input() rowData: any;
  @Output() valueChanged: EventEmitter<any> = new EventEmitter();

  constructor() { }

  action() {
    this.valueChanged.emit({value: this.value.value, rowData: this.rowData});
  }

}
