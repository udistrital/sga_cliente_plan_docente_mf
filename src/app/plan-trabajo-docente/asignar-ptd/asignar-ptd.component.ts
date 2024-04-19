import { Component, OnInit } from '@angular/core';
import { ACTIONS, MODALS, VIEWS } from 'src/app/models/diccionario';

@Component({
  selector: 'app-asignar-ptd',
  templateUrl: './asignar-ptd.component.html',
  styleUrls: ['./asignar-ptd.component.scss']
})
export class AsignarPtdComponent implements OnInit {
  
  readonly VIEWS = VIEWS;
  readonly MODALS = MODALS;
  readonly ACTIONS = ACTIONS;
  vista: Symbol;

  constructor() {
    this.vista = VIEWS.LIST;
  }

  ngOnInit() {
    console.log("hello")
  }

}
