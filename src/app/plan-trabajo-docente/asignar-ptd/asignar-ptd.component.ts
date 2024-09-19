import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { PopUpManager } from "src/app/managers/popUpManager";
import { ACTIONS, MODALS, ROLES, VIEWS } from "src/app/models/diccionario";
import { Periodo } from "src/app/models/parametros/periodo";
import { RespFormat } from "src/app/models/response-format";
import { GestorDocumentalService } from "src/app/services/gestor-documental.service";
import { ParametrosService } from "src/app/services/parametros.service";
import { PlanTrabajoDocenteService } from "src/app/services/plan-trabajo-docente.service";
import { SgaPlanTrabajoDocenteMidService } from "src/app/services/sga-plan-trabajo-docente-mid.service";
import { UserService } from "src/app/services/user.service";
import { checkContent, checkResponse } from "src/app/utils/verify-response";
import { intersection as _intersection, head as _head } from "lodash";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatSelectChange } from "@angular/material/select";
import { EstadoPlan } from "src/app/models/plan-trabajo-docente/estado-plan";
import { cloneDeep as _cloneDeep } from "lodash";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { DialogPreviewFileComponent } from "src/app/dialog-components/dialog-preview-file/dialog-preview-file.component";

@Component({
  selector: "app-asignar-ptd",
  templateUrl: "./asignar-ptd.component.html",
  styleUrls: ["./asignar-ptd.component.scss"],
})
export class AsignarPtdComponent implements OnInit, AfterViewInit {
  readonly VIEWS = VIEWS;
  readonly MODALS = MODALS;
  readonly ACTIONS = ACTIONS;
  vista: Symbol;

  rolesCoord: string[] = [ROLES.COORDINADOR, ROLES.ADMIN_DOCENCIA];
  rolesDocente: string[] = [ROLES.DOCENTE];
  coordinador: boolean = false;
  rolIs: string | undefined = undefined;
  canEdit: Symbol = ACTIONS.VIEW;

  periodos: Periodo[] = [];
  periodo: Periodo = new Periodo({});
  periodosAnteriores: Periodo[] = [];

  estadosPlan: EstadoPlan[] = [];
  estadosAprobar: EstadoPlan[] = [];

  dataSource: MatTableDataSource<any>;
  displayedColumns: string[] = [
    "docente",
    "identificacion",
    "tipo_vinculacion",
    "periodo_academico",
    "soporte_documental",
    "gestion",
    "estado",
    "enviar",
  ];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  detallesAsignaciones: any[] = [];

  dataDocente: any = {};
  detalleAsignacion: any = {};
  dataDocentes_ptd: any[] = [];
  detallesGeneral: any = {};

  constructor(
    private translate: TranslateService,
    private popUpManager: PopUpManager,
    private userService: UserService,
    private sgaPlanTrabajoDocenteMidService: SgaPlanTrabajoDocenteMidService,
    private parametrosService: ParametrosService,
    private planTrabajoDocenteService: PlanTrabajoDocenteService,
    private gestorDocumental: GestorDocumentalService,
    private matDialog: MatDialog
  ) {
    this.vista = VIEWS.LIST;
    this.dataSource = new MatTableDataSource();
  }

  ngOnInit() {
    this.userService.getUserRoles().then((roles) => {
      let r = _head(
        _intersection(roles, this.rolesDocente.concat(this.rolesCoord))
      );
      const intersection = _intersection(roles, this.rolesCoord);
      if (intersection.length > 0) {
        this.coordinador = true;
      }
      if (r) {
        this.rolIs = r;
        this.canEdit = ACTIONS.EDIT;
      }
    });
    this.cargarPeriodo()
      .then((resp) => (this.periodos = resp))
      .catch((err) => {
        this.popUpManager.showErrorToast(
          this.translate.instant("GLOBAL.sin_periodo")
        );
        this.periodos = [];
      });
    this.cargarEstadosPlan().then((estados) => {
      this.estadosPlan = estados;
      this.estadosAprobar = this.estadosPlan.filter(
        (estado) =>
          estado.codigo_abreviacion === "PAPR" ||
          estado.codigo_abreviacion === "N_APR"
      );
    });
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

  accionSoporte(event: any) {
    if (event.value) {
      this.verPTDFirmado(event.value);
    }
  }

  accionGestion(event: any) {
    if (event.rowData.gestion.type == "editar") {
      this.canEdit = ACTIONS.EDIT;
    } else {
      this.canEdit = ACTIONS.VIEW;
    }
    this.sgaPlanTrabajoDocenteMidService
      .get(
        `plan/?docente=${event.rowData.docente_id}&vigencia=${event.rowData.periodo_id}&vinculacion=${event.rowData.tipo_vinculacion_id}`
      )
      .subscribe(
        (res: any) => {
          console.log(res);
          this.detalleAsignacion = res.Data;
          this.dataDocente = {
            Nombre: event.rowData.docente,
            NombreCorto:
              res.Data.docente.nombre1 && res.Data.docente.apellido1
                ? res.Data.docente.nombre1 + " " + res.Data.docente.apellido1
                : res.Data.docente.nombre,
            Documento: event.rowData.identificacion,
            Periodo: event.rowData.periodo_academico,
            TipoVinculacion: event.rowData.tipo_vinculacion,
            docente_id: event.rowData.docente_id,
            periodo_id: event.rowData.periodo_id,
            tipo_vinculacion_id: event.rowData.tipo_vinculacion_id,
          };
          this.checknloadRelatedPTD(
            this.detalleAsignacion.planes_relacionados_query
          );
          if (
            this.coordinador &&
            event.rowData.estado === "Enviado a coordinación"
          ) {
            this.detalleAsignacion.aprobacion = this.estadosAprobar;
            this.popUpManager.showPopUpGeneric(
              this.translate.instant("ptd.aprobacion_plan_coordinacion"),
              this.translate.instant("ptd.recordar_aprobar_plan"),
              MODALS.INFO,
              false
            );
          }
          this.vista = VIEWS.FORM;
          if (this.rolIs == ROLES.DOCENTE) {
            const modales = [];
            if (this.canEdit == ACTIONS.VIEW) {
              modales.push(this.translate.instant("ptd.info_modo_solo_ver"));
            }
            modales.push(
              this.translate.instant("ptd.aviso_informativo_docente_p1") +
                ".<br><br>" +
                this.translate.instant("ptd.aviso_informativo_docente_p2") +
                "."
            );
            //this.popUpManager.showManyPopUp(this.translate.instant('notas.docente'), modales, MODALS.INFO)
          }
        },
        (error) => {
          console.warn("error:", error);
        }
      );
  }

  accionEnviar(event: any) {
    const title = this.coordinador
      ? this.translate.instant("ptd.enviar_a_docente")
      : this.translate.instant("ptd.enviar_a_coordinacion");
    this.popUpManager
      .showPopUpGeneric(
        title,
        this.translate.instant("ptd.pregunta_enviar"),
        MODALS.WARNING,
        false
      )
      .then((action) => {
        if (action.value) {
          this.enviarSegunRol(this.coordinador, event.rowData.plan_docente_id);
        }
      });
  }

  checknloadRelatedPTD(otherPTD: string[]) {
    this.detallesAsignaciones = [];
    this.dataDocentes_ptd = [];
    this.detallesGeneral = undefined;
    if (otherPTD.length > 0) {
      this.detallesGeneral = <any>_cloneDeep(this.detalleAsignacion);
      this.detallesGeneral.docentesModular = {};
      this.detallesGeneral.docentesModular[this.dataDocente.docente_id] =
        this.dataDocente;

      // Mantener la carga del docente principal
      this.detallesGeneral.carga[0] = this.detallesGeneral.carga[0].map(
        (c: any) => ({
          ...c,
          docente_id: this.dataDocente.docente_id,
          modular: false,
        })
      );

      otherPTD.forEach((doc_per_vinc) => {
        this.sgaPlanTrabajoDocenteMidService
          .get("plan/" + doc_per_vinc)
          .subscribe(
            (res) => {
              this.detallesAsignaciones.push(res.Data);
              const nombre =
                res.Data.docente.nombre1 && res.Data.docente.apellido1
                  ? res.Data.docente.nombre1 + " " + res.Data.docente.apellido1
                  : res.Data.docente.nombre;
              const datathisDocente = {
                Nombre: res.Data.docente.nombre,
                NombreCorto: nombre,
                Documento: res.Data.docente.identificacion,
                Periodo: res.Data.periodo_academico,
                TipoVinculacion: res.Data.tipo_vinculacion[0].nombre,
                docente_id: res.Data.docente.id,
                periodo_id: res.Data.vigencia,
                tipo_vinculacion_id: res.Data.tipo_vinculacion[0].id,
              };
              this.dataDocentes_ptd.push(datathisDocente);
              const relatedCarga = <any[]>_cloneDeep(res.Data.carga[0]);

              // Añadir carga del otro docente solo si la materia es compartida con el docente principal
              relatedCarga.forEach((c) => {
                if (
                  this.detallesGeneral.espacios_academicos[0].some(
                    (ea: any) => {
                      return ea.id === c.espacio_academico_id;
                    }
                  )
                ) {
                  this.detallesGeneral.carga[0].push({
                    ...c,
                    docente_id: datathisDocente.docente_id,
                    modular: true,
                  });
                }
              });

              // Añadir espacios académicos del otro docente solo si la materia es compartida con el docente principal
              res.Data.espacios_academicos[0].forEach((ea: any) => {
                if (
                  this.detallesGeneral.espacios_academicos[0].some(
                    (eaGeneral: any) =>
                      eaGeneral.espacio_academico === ea.espacio_academico
                  )
                ) {
                  this.detallesGeneral.espacios_academicos[0].push({
                    ...ea,
                    docente_id: datathisDocente.docente_id,
                    modular: true,
                  });
                }
              });

              this.detallesGeneral.docentesModular[datathisDocente.docente_id] =
                datathisDocente;
            },
            (err) => {
              console.warn(doc_per_vinc, err);
            }
          );
      });
    }
  }

  loadAsignaciones() {
    if (this.coordinador) {
      this.sgaPlanTrabajoDocenteMidService
        .get("asignacion/?vigencia=" + this.periodo.Id)
        .subscribe({
          next: (resp: RespFormat) => {
            if (checkResponse(resp) && checkContent(resp)) {
              this.dataSource = new MatTableDataSource(resp.Data);
            } else {
              this.dataSource = new MatTableDataSource();
              this.popUpManager.showErrorAlert(
                this.translate.instant("ptd.error_no_found_asignaciones")
              );
            }
          },
          error: (err) => {
            this.dataSource = new MatTableDataSource();
            this.popUpManager.showErrorAlert(
              this.translate.instant("ptd.error_no_found_asignaciones")
            );
          },
        });
    } else {
      this.userService
        .getPersonaId()
        .then((id_tercero) => {
          this.sgaPlanTrabajoDocenteMidService
            .get(
              "asignacion/docente?docente=" +
                id_tercero +
                "&vigencia=" +
                this.periodo.Id
            )
            .subscribe({
              next: (resp: RespFormat) => {
                if (checkResponse(resp) && checkContent(resp)) {
                  this.dataSource = new MatTableDataSource(resp.Data);
                } else {
                  this.dataSource = new MatTableDataSource();
                  this.popUpManager.showErrorAlert(
                    this.translate.instant("ptd.error_no_found_asignaciones")
                  );
                }
              },
              error: (err) => {
                this.dataSource = new MatTableDataSource();
                this.popUpManager.showErrorAlert(
                  this.translate.instant("ptd.error_no_found_asignaciones")
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

  cargarPeriodosAnteriores(periodo: Periodo) {
    this.periodosAnteriores = this.periodos.filter((porPeriodo) => {
      if (
        porPeriodo.Year <= periodo.Year &&
        porPeriodo.Id < periodo.Id &&
        porPeriodo.Nombre < periodo.Nombre
      ) {
        return porPeriodo;
      } else {
        return false;
      }
    });
  }

  selectPeriodo(periodo: MatSelectChange) {
    this.periodo = periodo.value;
    if (this.periodo.Id) {
      this.cargarPeriodosAnteriores(this.periodo);
      this.loadAsignaciones();
    } else {
      this.dataSource = new MatTableDataSource();
    }
  }

  cargarEstadosPlan(): Promise<EstadoPlan[]> {
    return new Promise((resolve, reject) => {
      this.planTrabajoDocenteService
        .get("estado_plan?query=activo:true&limit=0")
        .subscribe({
          next: (res) => {
            if (res.Data.length > 0) {
              resolve(res.Data);
            } else {
              reject(new Error("No se encontraron estados de plan"));
            }
          },
          error: (err) => {
            reject(err);
          },
        });
    });
  }

  enviarSegunRol(coordinador: boolean, id_plan: string) {
    const cod_abrev = coordinador ? "ENV_COO" : "ENV_DOC";
    const estado = this.estadosPlan.find(
      (estado) => estado.codigo_abreviacion === cod_abrev
    );
    if (estado) {
      this.planTrabajoDocenteService.get("plan_docente/" + id_plan).subscribe({
        next: (res_g) => {
          if (!coordinador) {
            let respuestaJson = res_g.Data.respuesta
              ? JSON.parse(res_g.Data.respuesta)
              : {};
            respuestaJson["DocenteAprueba"] = new Date().toLocaleString(
              "es-CO",
              { timeZone: "America/Bogota" }
            );
            res_g.Data.respuesta = JSON.stringify(respuestaJson);
          }
          res_g.Data.estado_plan_id = estado._id;
          this.planTrabajoDocenteService
            .put("plan_docente/" + id_plan, res_g.Data)
            .subscribe({
              next: (res_p) => {
                this.popUpManager.showSuccessAlert(
                  this.translate.instant("ptd.plan_enviado_ok")
                );
                this.loadAsignaciones();
              },
              error: (err_p) => {
                this.popUpManager.showErrorAlert(
                  this.translate.instant("ptd.error_enviar_plan")
                );
                console.warn("putfail", err_p);
              },
            });
        },
        error: (err_g) => {
          this.popUpManager.showErrorAlert(
            this.translate.instant("ptd.error_enviar_plan")
          );
          console.warn("getfail", err_g);
        },
      });
    }
  }

  verPTDFirmado(idDoc: any) {
    this.gestorDocumental.get([{ Id: idDoc }]).subscribe((resp: any[]) => {
      this.previewFile(resp[0].url);
    });
  }

  previewFile(url: string) {
    const dialogDoc = new MatDialogConfig();
    dialogDoc.width = "65vw";
    dialogDoc.height = "80vh";
    dialogDoc.data = {
      url: url,
      title: this.translate.instant("GLOBAL.soporte_documental"),
    };
    this.matDialog.open(DialogPreviewFileComponent, dialogDoc);
  }

  regresar() {
    this.loadAsignaciones();
    this.vista = VIEWS.LIST;
  }

  manageChangesInGeneralPTD(event: any) {
    const xd = this.detallesGeneral.carga[0].filter(
      (c: any) => c.docente != event.docente_id
    );
  }
}
