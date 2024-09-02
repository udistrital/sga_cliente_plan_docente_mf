import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { TranslateService } from "@ngx-translate/core";
import { PopUpManager } from "src/app/managers/popUpManager";
import { EspaciosAcademicosService } from "src/app/services/espacios-academicos.service";
import { inputsCrearGrupo } from "./utilidades";

@Component({
  selector: "app-dialogo-crear-espacio-grupo",
  templateUrl: "./dialogo-crear-espacio-grupo.component.html",
  styleUrl: "./dialogo-crear-espacio-grupo.component.scss",
})
export class DialogoCrearEspacioGrupoComponent implements OnInit {
  inputsCrearGrupo: any;
  formCrearGrupo!: FormGroup;
  espacioAcademico: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public dataEntrante: any,
    public dialogRef: MatDialogRef<DialogoCrearEspacioGrupoComponent>,
    private espacioAcademicoService: EspaciosAcademicosService,
    private formBuilder: FormBuilder,
    private popUpManager: PopUpManager,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.iniciarFormCrearGrupo();
    this.obtenerEspacioAcademico();
  }

  obtenerEspacioAcademico() {
    const espacioAcademicoId = this.dataEntrante.espacioAcademico._id;
    this.espacioAcademicoService
      .get(`espacio-academico/${espacioAcademicoId}`)
      .subscribe((res: any) => {
        if (res.Success) {
          this.espacioAcademico = res.Data;
        }
      });
  }

  iniciarFormCrearGrupo(): void {
    this.formCrearGrupo = this.formBuilder.group({
      indicador: ["", Validators.required],
    });

    this.inputsCrearGrupo = inputsCrearGrupo;
  }

  crearGrupoEspacioAcademico() {
    const grupoEspacioAcademico = this.construirObjetoGrupoEspacioAcademico();
    this.popUpManager
      .showConfirmAlert(
        this.translate.instant("ptd.desea_crear_grupo_espacio_academico")
      )
      .then((confirmado) => {
        if (!confirmado.value) {
          return;
        }

        this.espacioAcademicoService
          .post("espacio-academico", grupoEspacioAcademico)
          .subscribe((res: any) => {
            if (res.Success) {
              this.popUpManager.showSuccessAlert(
                this.translate.instant("ptd.grupo_espacio_academico_creado")
              );
              this.dialogRef.close({
                creado: true,
                info: res.Data,
              });
            }
          });
      });
  }

  //se construye el espacio hijo a partir del padre
  construirObjetoGrupoEspacioAcademico() {
    const grupoEspacioAcademico = this.espacioAcademico;
    grupoEspacioAcademico.periodo_id = this.dataEntrante.periodo.Id;
    grupoEspacioAcademico.grupo = this.formCrearGrupo.get("indicador")?.value;
    grupoEspacioAcademico.espacio_academico_padre = grupoEspacioAcademico._id;
    //para el post, o si no genera error porque el id ya existe
    delete grupoEspacioAcademico._id;
    return grupoEspacioAcademico;
  }
}
