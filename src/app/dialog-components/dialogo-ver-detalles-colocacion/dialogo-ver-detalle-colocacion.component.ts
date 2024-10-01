import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

@Component({
  selector: "app-dialogo-ver-detalles-colocacion",
  templateUrl: "./dialogo-ver-detalle-colocacion.component.html",
  styleUrl: "./dialogo-ver-detalle-colocacion.component.scss",
})
export class DialogoVerDetalleColocacionComponent implements OnInit {
  banderaEsColocacionModuloHorario = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public infoEspacio: any,
    public dialogRef: MatDialogRef<DialogoVerDetalleColocacionComponent>
  ) {}

  ngOnInit() {
    console.log(this.infoEspacio);
    if (this.infoEspacio.tipo == 3) {
      this.banderaEsColocacionModuloHorario = true;
    }
  }
}
