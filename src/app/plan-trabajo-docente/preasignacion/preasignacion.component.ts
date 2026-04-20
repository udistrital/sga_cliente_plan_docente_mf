import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { TranslateService } from "@ngx-translate/core";
import { PopUpManager } from "src/app/managers/popUpManager";
import { Periodo } from "src/app/models/parametros/periodo";
import { RespFormat } from "src/app/models/response-format";
import { ParametrosService } from "src/app/services/parametros.service";
import { UserService } from "src/app/services/user.service";
import { checkContent, checkResponse } from "src/app/utils/verify-response";
import { MODALS } from "src/app/models/diccionario";
import { SgaPlanTrabajoDocenteMidService } from "src/app/services/sga-plan-trabajo-docente-mid.service";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { DialogoPreAsignacionPtdComponent } from "src/app/dialog-components/dialogo-preasignacion/dialogo-preasignacion.component";
import { PlanTrabajoDocenteService } from "src/app/services/plan-trabajo-docente.service";
import { PermisosUtils } from "src/app/utils/role-permissions";
import { Observable } from "rxjs/internal/Observable";
import { firstValueFrom } from "rxjs/internal/firstValueFrom";
import { forkJoin } from "rxjs/internal/observable/forkJoin";

@Component({
  selector: "app-preasignacion",
  templateUrl: "./preasignacion.component.html",
  styleUrls: ["./preasignacion.component.scss"],
})
export class PreasignacionComponent implements OnInit, AfterViewInit {
  roles: string[] = [];

  opcionesPermisos: string[] = [
    'aprobacion_docente',
    'nueva_preasignacion',
    'tabla_coordinador',
    'tabla_docente',
  ];
  permisos: { [key: string]: boolean } = {};
  periodos: Periodo[] = [];
  periodo: Periodo = new Periodo({});

  dataSource: MatTableDataSource<any>;
  displayedColumns_docente: string[] = [
    "espacio_academico",
    "periodo",
    "grupo",
    "proyecto",
    "nivel",
    "aprobacion_docente",
    "aprobacion_proyecto",
    "semaforo_preasignacion",
  ];
  displayedColumns_coord: string[] = [
    "docente",
    "espacio_academico",
    "periodo",
    "grupo",
    "proyecto",
    "nivel",
    "aprobacion_docente",
    "aprobacion_proyecto",
    "semaforo_preasignacion",
    "enviar",
    "editar",
    "borrar",
  ];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dialogConfig: MatDialogConfig;

  constructor(
    private userService: UserService,
    private translate: TranslateService,
    private popUpManager: PopUpManager,
    private parametrosService: ParametrosService,
    private planDocenteMid: SgaPlanTrabajoDocenteMidService,
    private planTrabajoDocenteService: PlanTrabajoDocenteService,
    private dialog: MatDialog,
    private permisosUtils: PermisosUtils
  ) {
    this.dataSource = new MatTableDataSource();
    this.dialogConfig = new MatDialogConfig();
  }

  ngOnInit() {
    this.userService.getUserRoles().then(async (roles) => {
      this.roles = roles;
      const observables: { [key: string]: Observable<boolean> } = {};
      this.opcionesPermisos.forEach(opcion => {
        observables[opcion] =
          this.permisosUtils.tienePermiso(this.roles, opcion);
      });
      const resultados = await firstValueFrom(forkJoin(observables));
      this.permisos = resultados;
      console.log('Permisos:', this.permisos);
    });
    this.cargarPeriodo()
      .then((resp) => (this.periodos = resp))
      .catch((err) => {
        this.popUpManager.showErrorToast(
          this.translate.instant("GLOBAL.sin_periodo")
        );
        this.periodos = [];
      });

    this.dialogConfig.width = "65vw";
    this.dialogConfig.minWidth = "700px";
    this.dialogConfig.height = "65vh";
    this.dialogConfig.maxHeight = "615px";
    this.dialogConfig.data = {};
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  accionEnviar(event: any) {
    if (!this.permisos['tabla_coordinador']) {
      return this.popUpManager.showErrorToast(
        this.translate.instant('GLOBAL.acceso_denegado')
      );
    }

    this.popUpManager
      .showPopUpGeneric(
        this.translate.instant("ptd.enviar_a_docente"),
        this.translate.instant("ptd.pregunta_enviar_a_docente"),
        MODALS.INFO,
        false
      )
      .then((action) => {
        if (action.value) {
          let data = {
            preasignaciones: [{ Id: event["rowData"].id }],
            "no-preasignaciones": [],
            docente: false,
          };

          this.planDocenteMid.put("preasignacion/aprobar", data).subscribe({
            next: (resp: RespFormat) => {
              if (checkResponse(resp)) {
                this.popUpManager.showSuccessAlert(
                  this.translate.instant("ptd.aprobacion_preasignacion")
                );
              } else {
                this.popUpManager.showErrorAlert(
                  this.translate.instant("ptd.error_aprobacion_preasignacion")
                );
              }
              this.loadPreasignaciones();
            },
            error: (err) => {
              this.popUpManager.showErrorToast(
                this.translate.instant("ptd.error_aprobacion_preasignacion")
              );
            },
          });
        }
      });
  }

  accionEditar(event: any) {
    if (!this.permisos['tabla_coordinador']) {
      return this.popUpManager.showErrorToast(
        this.translate.instant('GLOBAL.acceso_denegado')
      );
    }

    this.popUpManager
      .showPopUpGeneric(
        this.translate.instant("ptd.preasignacion"),
        this.translate.instant("ptd.pregunta_editar"),
        MODALS.INFO,
        false
      )
      .then((action) => {
        if (action.value) {
          this.dialogConfig.data = event["rowData"];
          const preasignacionDialog = this.dialog.open(
            DialogoPreAsignacionPtdComponent,
            this.dialogConfig
          );
          preasignacionDialog.afterClosed().subscribe(() => {
            this.loadPreasignaciones();
          });
        }
      });
  }

  preguntarBorradoPreAsignacion(event: any) {
    if (!this.permisos['tabla_coordinador']) {
      return this.popUpManager.showErrorToast(
        this.translate.instant('GLOBAL.acceso_denegado')
      );
    }

    this.popUpManager
      .showConfirmAlert(this.translate.instant("ptd.pregunta_eliminar"))
      .then((action) => {
        if (action.value) {
          this.popUpManager
            .showConfirmAlert(
              this.translate.instant(
                "ptd.eliminar_preasignacion_tiene_repetir_proceso_ptd"
              )
            )
            .then((action) => {
              if (action.value) {
                this.eliminarPreAsignacion(event.rowData.id);
              }
            });
        }
      });
  }

  eliminarPreAsignacion(preAsignacionId: any) {
    this.planDocenteMid
      .delete("preasignacion", { Id: preAsignacionId })
      .subscribe({
        next: (resp: RespFormat) => {
          if (resp.Message == "tiene colocaciones") {
            return this.popUpManager.showErrorAlert(
              this.translate.instant(
                "ptd.no_poder_eliminar_preasignacion_tiene_colocaciones"
              )
            );
          }

          this.popUpManager.showSuccessAlert(
            this.translate.instant("ptd.preasignacion_eliminada")
          );

          this.loadPreasignaciones();
        },
        error: (err) => {
          this.popUpManager.showErrorToast(
            this.translate.instant("ptd.error_preasignacion_eliminada")
          );
        },
      });
  }

  agregacionPreasignacion() {
    if (!this.permisos['nueva_preasignacion']) {
      return this.popUpManager.showErrorToast(
        this.translate.instant('GLOBAL.acceso_denegado')
      );
    }

    this.dialogConfig.data = {};
    const preasignacionDialog = this.dialog.open(
      DialogoPreAsignacionPtdComponent,
      this.dialogConfig
    );
    preasignacionDialog.afterClosed().subscribe((result) => {
      this.loadPreasignaciones();
    });
  }

  enviarAprobacion() {
    if (!this.permisos['aprobacion_docente']) {
      return this.popUpManager.showErrorToast(
        this.translate.instant('GLOBAL.acceso_denegado')
      );
    }

    this.popUpManager
      .showPopUpGeneric(
        this.translate.instant("GLOBAL.enviar_aprobacion"),
        this.translate.instant("ptd.pregunta_enviar_a_coordinacion"),
        MODALS.QUESTION,
        false
      )
      .then((action) => {
        if (action.value) {
          let req: {
            preasignaciones: { Id: any }[];
            "no-preasignaciones": { Id: any }[];
            docente: boolean;
          } = {
            preasignaciones: [],
            "no-preasignaciones": [],
            docente: true,
          };
          this.dataSource.data.forEach((preasignacion) => {
            if (preasignacion.aprobacion_docente.value) {
              req.preasignaciones.push({ Id: preasignacion.id });
            } else {
              req["no-preasignaciones"].push({ Id: preasignacion.id });
            }
          });
          this.planDocenteMid.put("preasignacion/aprobar", req).subscribe({
            next: (resp: RespFormat) => {
              if (checkResponse(resp)) {
                this.popUpManager.showSuccessAlert(
                  this.translate.instant("ptd.aprobacion_preasignacion")
                );
              } else {
                this.popUpManager.showErrorAlert(
                  this.translate.instant("ptd.error_aprobacion_preasignacion")
                );
              }
              this.loadPreasignaciones();
            },
            error: (err) => {
              this.popUpManager.showErrorToast(
                this.translate.instant("ptd.error_aprobacion_preasignacion")
              );
            },
          });
        }
      });
  }

  loadPreasignaciones() {
    if (this.permisos['tabla_coordinador']) {
      this.planDocenteMid
        .get("preasignacion?vigencia=" + this.periodo.Id)
        .subscribe({
          next: (resp: RespFormat) => {
            if (checkResponse(resp)) {
              this.dataSource = new MatTableDataSource(resp.Data);
            } else {
              this.dataSource = new MatTableDataSource();
              this.popUpManager.showErrorAlert(
                this.translate.instant("ptd.error_no_found_preasignaciones")
              );
            }
          },
          error: (err) => {
            this.dataSource = new MatTableDataSource();
            this.popUpManager.showErrorToast(
              this.translate.instant("ptd.error_no_found_preasignaciones")
            );
          },
        });
    } else if (this.permisos['tabla_docente']) {
      this.userService
        .getPersonaId()
        .then((id_tercero) => {
          this.planDocenteMid
            .get(
              "preasignacion/docente?docente=" +
                id_tercero +
                "&vigencia=" +
                this.periodo.Id
            )
            .subscribe({
              next: (resp: RespFormat) => {
                if (checkResponse(resp)) {
                  this.dataSource = new MatTableDataSource(resp.Data);
                } else {
                  this.dataSource = new MatTableDataSource();
                  this.popUpManager.showErrorAlert(
                    this.translate.instant("ptd.error_no_found_preasignaciones")
                  );
                }
              },
              error: (err) => {
                this.dataSource = new MatTableDataSource();
                this.popUpManager.showErrorToast(
                  this.translate.instant("ptd.error_no_found_preasignaciones")
                );
              },
            });
        })
        .catch((err) => {
          this.dataSource = new MatTableDataSource();
          this.popUpManager.showErrorToast(
            this.translate.instant("GLOBAL.error_no_found_tercero_id")
          );
        });
    } else {
      this.dataSource = new MatTableDataSource();
      this.popUpManager.showErrorToast(
        this.translate.instant("GLOBAL.acceso_denegado")
      );
    }
  }

  cargarPeriodo(): Promise<Periodo[]> {
    return new Promise((resolve, reject) => {
      this.parametrosService
        .get("periodo?query=CodigoAbreviacion:PA&sortby=Id&order=desc&limit=0")
        .subscribe({
          next: (resp: RespFormat) => {
            if (checkResponse(resp) && checkContent(resp.Data)) {
              resolve(resp.Data as Periodo[]);
            } else {
              reject(new Error("No se encontraron periodos"));
            }
          },
          error: (err) => {
            reject(err);
          },
        });
    });
  }

  selectPeriodo(periodo: any) {
    this.periodo = periodo.value;
    if (this.periodo) {
      this.loadPreasignaciones();
    } else {
      this.dataSource = new MatTableDataSource();
    }
  }

  // Función para determinar el estado del semáforo de preasignación
  getSemaforoPreasignacion(row: any): {
    color: string;
    tooltip: string;
    icon: string;
  } {
    const aprobacionProyecto = this.getAprobacionValue(row?.aprobacion_proyecto);
    const aprobacionDocente = this.getAprobacionValue(row?.aprobacion_docente);

    // Si la aprobación del proyecto es falsa, se muestra el semáforo rojo
    if (!aprobacionProyecto) {
      return {
        color: "#F44336",
        tooltip: this.translate.instant(
          "ptd.semaforo_preasignacion_no_enviado"
        ),
        icon: "cancel",
      };
    }

    // Si la aprobación del proyecto es verdadera pero la aprobación del docente es falsa, se muestra el semáforo amarillo
    if (!aprobacionDocente) {
      return {
        color: "#FFC107",
        tooltip: this.translate.instant(
          "ptd.semaforo_preasignacion_pendiente_docente"
        ),
        icon: "autorenew",
      };
    }

    // Si ambas aprobaciones son verdaderas, se muestra el semáforo verde
    return {
      color: "#4CAF50",
      tooltip: this.translate.instant("ptd.semaforo_preasignacion_aprobada"),
      icon: "check_circle",
    };
  }

  private getAprobacionValue(approval: any): boolean {
    if (typeof approval === "boolean") {
      return approval;
    }

    if (approval && typeof approval === "object" && "value" in approval) {
      return !!approval.value;
    }

    return false;
  }
}
