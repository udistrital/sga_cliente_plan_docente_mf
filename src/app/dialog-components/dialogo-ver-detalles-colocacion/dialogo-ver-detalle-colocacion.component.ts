import { Component, Inject, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { TranslateService } from "@ngx-translate/core";
import { PopUpManager } from "src/app/managers/popUpManager";
import { HorarioMidService } from "src/app/services/horario-mid.service";
import { PlanTrabajoDocenteService } from "src/app/services/plan-trabajo-docente.service";
import { inputsFormDocente } from "./utilidades";

@Component({
  selector: "app-dialogo-ver-detalles-colocacion",
  templateUrl: "./dialogo-ver-detalle-colocacion.component.html",
  styleUrl: "./dialogo-ver-detalle-colocacion.component.scss",
})
export class DialogoVerDetalleColocacionComponent implements OnInit {
  actividadGestionPlanDocente: any;
  planDocenteId: any;
  inputsFormDocente: any;
  banderaAsignarDocente: boolean = false;
  docente: any;
  vinculacionesDocente: any;
  docenteYaAsignado: boolean = false;

  formDocente!: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public infoEspacio: any,
    private _formBuilder: FormBuilder,
    private horarioMid: HorarioMidService,
    private popUpManager: PopUpManager,
    private planDocenteService: PlanTrabajoDocenteService,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<DialogoVerDetalleColocacionComponent>
  ) {}

  ngOnInit() {
    this.iniciarFormDocente();
    this.verificarSiHayAsignadoDocente();
    console.log(this.infoEspacio);
  }

  asignarDocente() {
    this.planDocenteService
      .get(
        `plan_docente?query=docente_id:${this.docente.Id},periodo_id:${this.infoEspacio.periodo.Id},activo:true`
      )
      .subscribe((planDocente: any) => {
        if (!planDocente.Success || planDocente.Data.length === 0) {
          return this.popUpManager.showAlert(
            "",
            this.translate.instant("gestion_horarios.docente_sin_plan_trabajo")
          );
        }

        this.planDocenteId = planDocente.Data[0]._id;

        this.planDocenteService
          .get("estado_plan?query=nombre:Definido")
          .subscribe((estadoPlan: any) => {
            if (
              !estadoPlan.Success ||
              estadoPlan.Data[0]._id !== planDocente.Data[0].estado_plan_id
            ) {
              return this.popUpManager.showAlert(
                "",
                this.translate.instant(
                  "gestion_horarios.plan_docente_sin_construccion"
                )
              );
            }

            this.horarioMid
              .get(
                `docente/pre-asignacion?docente-id=${this.docente.Id}&periodo-id=${this.infoEspacio.periodo.Id}`
              )
              .subscribe((res: any) => {
                if (
                  res.Success &&
                  res.Data.some((preasignacion: any) => {
                    return (
                      preasignacion.espacio_academico_id ===
                      this.infoEspacio.espacioAcademicoId
                    );
                  })
                ) {
                  this.crearEditarCargaPlan();
                } else {
                  this.popUpManager.showAlert(
                    "",
                    this.translate.instant(
                      "gestion_horarios.espacio_academico_no_asignado_docente"
                    )
                  );
                }
              });
          });
      });
  }

  crearEditarCargaPlan() {
    const cargaPlan: any = this.construirObjetoCargaPlan();
    if (this.docenteYaAsignado) {
      this.editarCargaPlan(cargaPlan);
    } else {
      this.crearCargaPlan(cargaPlan);
    }
  }

  editarCargaPlan(cargaPlan: any) {
    this.popUpManager
      .showConfirmAlert(
        this.translate.instant("gestion_horarios.desea_reasignar_docente")
      )
      .then((confirmado: any) => {
        if (confirmado.value) {
          this.planDocenteService
            .get("carga_plan/" + this.infoEspacio.cargaPlanId)
            .subscribe((res: any) => {
              if (res.Success) {
                cargaPlan._id = res.Data._id;
              }
              this.planDocenteService
                .put("carga_plan/" + this.infoEspacio.cargaPlanId, cargaPlan)
                .subscribe((res: any) => {
                  if (res.Success) {
                    this.popUpManager.showAlert(
                      "",
                      this.translate.instant(
                        "gestion_horarios.reasignacion_realizada"
                      )
                    );
                    this.dialogRef.close(true);
                  } else {
                    this.popUpManager.showAlert(
                      "",
                      this.translate.instant("GLOBAL.error")
                    );
                  }
                });
            });
        }
      });
  }

  crearCargaPlan(cargaPlan: any) {
    this.popUpManager
      .showConfirmAlert(
        this.translate.instant("gestion_horarios.desea_asignar_docente")
      )
      .then((confirmado: any) => {
        if (confirmado.value) {
          this.planDocenteService
            .post("carga_plan", cargaPlan)
            .subscribe((res: any) => {
              if (res.Success) {
                this.popUpManager.showAlert(
                  "",
                  this.translate.instant(
                    "gestion_horarios.asignacion_realizada"
                  )
                );
                this.dialogRef.close(true);
              } else {
                this.popUpManager.showAlert(
                  "",
                  this.translate.instant("GLOBAL.error")
                );
              }
            });
        }
      });
  }

  construirObjetoCargaPlan() {
    const horario = {
      horas: this.infoEspacio.horas,
      horaFormato: this.infoEspacio.horaFormato,
      tipo: this.infoEspacio.tipo,
      estado: this.infoEspacio.estado,
      dragPosition: this.infoEspacio.dragPosition,
      prevPosition: this.infoEspacio.prevPosition,
      finalPosition: this.infoEspacio.finalPosition,
    };

    return {
      duracion: this.infoEspacio.horas,
      edificio_id: this.infoEspacio.edificio.Id,
      colocacion_espacio_academico_id: this.infoEspacio.id,
      espacio_academico_id: this.infoEspacio.espacioAcademicoId,
      hora_inicio: parseInt(
        this.infoEspacio.horaFormato.split(" - ")[0].split(":")[0],
        10
      ),
      horario: horario,
      plan_docente_id: this.planDocenteId,
      salon_id: this.infoEspacio.salon.Id,
      sede_id: this.infoEspacio.edificio.Id,
      activo: true,
    };
  }

  cargarDatosDocente(documento: string) {
    this.vinculacionesDocente = [];
    this.horarioMid
      .get("docente/vinculaciones?documento=" + documento)
      .subscribe((res: any) => {
        if (res.Data && res.Status == "200") {
          const data = res.Data;
          this.docente = data.Docente;
          this.formDocente.patchValue({
            nombreDocente: data.Docente.Nombre,
          });
          this.vinculacionesDocente = data.Vinculaciones;
        } else if (res.Message == "No hay docente con el documento dado") {
          this.formDocente.patchValue({
            nombreDocente: null,
            vinculacion: null,
          });
          this.popUpManager.showAlert(
            "",
            this.translate.instant("ptd.no_docente_encontrado")
          );
        } else if (res.Message == "El docente no tiene vinculaciones") {
          this.formDocente.patchValue({
            nombreDocente: null,
            vinculacion: null,
          });
          this.popUpManager.showAlert(
            "",
            this.translate.instant("ptd.no_vinculacion_docente")
          );
        }
      });
  }

  iniciarFormDocente() {
    this.formDocente = this._formBuilder.group({
      documento: ["", Validators.required],
      nombreDocente: [{ value: "", disabled: true }, Validators.required],
      vinculacion: ["", Validators.required],
    });
    this.inputsFormDocente = inputsFormDocente;
  }

  verificarSiHayAsignadoDocente() {
    if (this.infoEspacio.cargaPlanId) {
      this.docenteYaAsignado = true;
    }
  }
}
