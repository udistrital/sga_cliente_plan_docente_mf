import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { TranslateService } from "@ngx-translate/core";
import { PopUpManager } from "src/app/managers/popUpManager";

@Component({
  selector: "app-dialogo-ver-detalles-colocacion",
  templateUrl: "./dialogo-ver-detalle-colocacion.component.html",
  styleUrl: "./dialogo-ver-detalle-colocacion.component.scss",
})
export class DialogoVerDetalleColocacionComponent implements OnInit {
  banderaEsColocacionModuloHorario = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public infoEspacio: any,
    public dialogRef: MatDialogRef<DialogoVerDetalleColocacionComponent>,
    private popUpManager: PopUpManager,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    console.log(this.infoEspacio);
    if (this.infoEspacio.tipo == 3) {
      this.banderaEsColocacionModuloHorario = true;
    }
  }

  preguntarAsignadoDocente() {
    this.popUpManager
      .showConfirmAlert(this.translate.instant("ptd.desea_asignar_docente"))
      .then((confirmado) => {
        if (confirmado.value) {
          this.dialogRef.close({
            asignado: true,
            idColocacionEspacioAcademico:
              this.infoEspacio.idColocacionEspacioAcademico,
          });
        }
      });
  }
}
