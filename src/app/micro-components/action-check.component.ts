import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';


@Component({
  selector: 'action-check',
  template: `
    <div [formGroup]="miniForm" class="checkbox">
      <mat-checkbox color="primary" formControlName="value"></mat-checkbox>
    </div>
  `,
  styles: [
    'div { display: flex; justify-content:center; align-items:center; }',
    '.checkbox {display: flex; justify-content:center; align-items: center;}'
  ]
})
export class ActionCheckComponent implements OnInit {

  @Input() value: any;
  @Input() rowData: any;
  @Output() checkboxVal: EventEmitter<any> = new EventEmitter();

  miniForm: FormGroup

  constructor() {
    this.miniForm = new FormGroup({});
  }

  ngOnInit() {
    this.miniForm = new FormGroup({
      value: new FormControl(this.value.value),
    });
    if (this.value.disabled) {
      this.miniForm.get("value")?.disable();
    } else {
      this.miniForm.get("value")?.enable();
    }

    this.miniForm.get("value")?.valueChanges.subscribe(x => {
      this.checkboxVal.emit({ value: x, Data: this.rowData })
    });
  }
}
