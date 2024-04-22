import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { PopUpManager } from 'src/app/managers/popUpManager';
import { Periodo } from 'src/app/models/parametros/periodo';
import { RespFormat } from 'src/app/models/response-format';
import { ParametrosService } from 'src/app/services/parametros.service';
import { UserService } from 'src/app/services/user.service';
import { checkContent, checkResponse } from 'src/app/utils/verify-response';
import { intersection as _intersection } from 'lodash';
import { MODALS, ROLES } from 'src/app/models/diccionario';
import { SgaPlanTrabajoDocenteMidService } from 'src/app/services/sga-plan-trabajo-docente-mid.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogoPreAsignacionPtdComponent } from 'src/app/dialog-components/dialogo-preasignacion/dialogo-preasignacion.component';
import { PlanTrabajoDocenteService } from 'src/app/services/plan-trabajo-docente.service';

@Component({
  selector: 'app-preasignacion',
  templateUrl: './preasignacion.component.html',
  styleUrls: ['./preasignacion.component.scss']
})
export class PreasignacionComponent implements OnInit, AfterViewInit {

  rolesCoord: string[] = [ROLES.COORDINADOR, ROLES.ADMIN_DOCENCIA];
  rolesDocente: string[] = [ROLES.DOCENTE];
  coodrinador: boolean = false;

  periodos: Periodo[] = [];
  periodo: Periodo = new Periodo({});

  dataSource: MatTableDataSource<any>;
  displayedColumns_docente: string[] = ["espacio_academico", "periodo", "grupo", "proyecto", "nivel", "aprobacion_docente", "aprobacion_proyecto"];
  displayedColumns_coord: string[] = ["docente", "espacio_academico", "periodo", "grupo", "proyecto", "nivel", "aprobacion_docente", "aprobacion_proyecto", "enviar", "editar", "borrar"];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dialogConfig: MatDialogConfig;
  
  constructor(
    private userService: UserService,
    private translate: TranslateService,
    private popUpManager: PopUpManager,
    private parametrosService: ParametrosService,
    private sgaPlanTrabajoDocenteMidService: SgaPlanTrabajoDocenteMidService,
    private planTrabajoDocenteService: PlanTrabajoDocenteService,
    private dialog: MatDialog,
  ) {
    this.dataSource = new MatTableDataSource();
    this.dialogConfig = new MatDialogConfig();
  }

  ngOnInit() {
    this.userService.getUserRoles().then(roles => {
      const intersection = _intersection(roles, this.rolesCoord);
      if (intersection.length > 0) {
        this.coodrinador = true;
      }
    })
    this.cargarPeriodo().then(resp => this.periodos = resp)
      .catch(err => {
        console.log(err);
        this.popUpManager.showErrorToast(this.translate.instant('GLOBAL.sin_periodo'));
        this.periodos = [];
      });

    this.dialogConfig.width = '65vw';
    this.dialogConfig.minWidth = '700px';
    this.dialogConfig.height = '65vh';
    this.dialogConfig.maxHeight = '615px';
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
    this.popUpManager.showPopUpGeneric(this.translate.instant('ptd.enviar_a_docente'), this.translate.instant('ptd.pregunta_enviar_a_docente'), MODALS.INFO, false).then(
      action => {
        if (action.value) {
          let data = {
            "preasignaciones": [
              { "Id": event["rowData"].id },
            ],
            "no-preasignaciones": [],
            "docente": false,
          }

          this.sgaPlanTrabajoDocenteMidService.put('preasignacion/aprobar', data).subscribe({
            next: (resp: RespFormat) => {
              if (checkResponse(resp)) {
                this.popUpManager.showSuccessAlert(this.translate.instant('ptd.aprobacion_preasignacion'));
              } else {
                this.popUpManager.showErrorAlert(this.translate.instant('ptd.error_aprobacion_preasignacion'));
              }
              this.loadPreasignaciones();
            },
            error: (err) => {
              console.log(err);
              this.popUpManager.showErrorToast(this.translate.instant('ptd.error_aprobacion_preasignacion'));
            }
          });
        }
      }
    );
  }

  accionEditar(event: any) {
    this.popUpManager.showPopUpGeneric(this.translate.instant('ptd.preasignacion'), this.translate.instant('ptd.pregunta_editar'), MODALS.INFO, false).then(
      action => {
        if (action.value) {
          this.dialogConfig.data = event["rowData"];
          const preasignacionDialog = this.dialog.open(DialogoPreAsignacionPtdComponent, this.dialogConfig);
          preasignacionDialog.afterClosed().subscribe(() => {
            this.loadPreasignaciones();
          });
        }
      }
    );
  }

  accionBorrar(event: any) {
    this.popUpManager.showPopUpGeneric(this.translate.instant('ptd.preasignacion'), this.translate.instant('ptd.pregunta_eliminar'), MODALS.WARNING, false).then(
      action => {
        if (action.value) {
          this.planTrabajoDocenteService.delete('pre_asignacion', { Id: event.rowData.id }).subscribe({
            next: (resp: RespFormat) => {
              if (checkResponse(resp)) {
                this.popUpManager.showSuccessAlert(this.translate.instant('ptd.preasignacion_eliminada'));
              } else {
                this.popUpManager.showErrorAlert(this.translate.instant('ptd.error_preasignacion_eliminada'));
              }
              this.loadPreasignaciones();
            },
            error: (err) => {
              console.log(err);
              this.popUpManager.showErrorToast(this.translate.instant('ptd.error_preasignacion_eliminada'));
            }
          });
        }
      }
    );
  }

  agregacionPreasignacion() {
    this.dialogConfig.data = {};
    const preasignacionDialog = this.dialog.open(DialogoPreAsignacionPtdComponent, this.dialogConfig);
    preasignacionDialog.afterClosed().subscribe(result => {
      this.loadPreasignaciones();
    });
  }

  enviarAprobacion() {
    this.popUpManager.showPopUpGeneric(this.translate.instant('GLOBAL.enviar_aprobacion'), this.translate.instant('ptd.pregunta_enviar_a_coordinacion'), MODALS.QUESTION, false).then(
      action => {
        if (action.value) {
          let req = {
            "preasignaciones": [{}],
            "no-preasignaciones": [{}],
            "docente": true,
          }
          this.dataSource.data.forEach((preasignacion) => {
            if (preasignacion.aprobacion_docente.value) {
              req.preasignaciones.push({ "Id": preasignacion.id });
            } else {
              req['no-preasignaciones'].push({ "Id": preasignacion.id });
            }
          });
          this.sgaPlanTrabajoDocenteMidService.put('preasignacion/aprobar', req)
            .subscribe({
              next: (resp: RespFormat) => {
                if (checkResponse(resp)) {
                  this.popUpManager.showSuccessAlert(this.translate.instant('ptd.aprobacion_preasignacion'));
                } else {
                  this.popUpManager.showErrorAlert(this.translate.instant('ptd.error_aprobacion_preasignacion'));
                }
                this.loadPreasignaciones();
              },
              error: (err) => {
                console.log(err);
                this.popUpManager.showErrorToast(this.translate.instant('ptd.error_aprobacion_preasignacion'));
              }
            });
        }
      })
  }

  loadPreasignaciones() {
    if (this.coodrinador) {
      this.sgaPlanTrabajoDocenteMidService.get('preasignacion/?vigencia=' + this.periodo.Id).subscribe({
        next: (resp: RespFormat) => {
          if (checkResponse(resp)) {
            this.dataSource = new MatTableDataSource(resp.Data);
          } else {
            this.dataSource = new MatTableDataSource();
            this.popUpManager.showErrorAlert(this.translate.instant('ptd.error_no_found_preasignaciones'));
          }
        },
        error: err => {
          console.log(err);
          this.dataSource = new MatTableDataSource();
          this.popUpManager.showErrorToast(this.translate.instant('ptd.error_no_found_preasignaciones'));
        }
      });
    } else {
      this.userService.getPersonaId().then(id_tercero => {
        this.sgaPlanTrabajoDocenteMidService.get('preasignacion/docente?docente=' + id_tercero + '&vigencia=' + this.periodo.Id).subscribe({
          next: (resp: RespFormat) => {
            if (checkResponse(resp)) {
              this.dataSource = new MatTableDataSource(resp.Data);
            } else {
              this.dataSource = new MatTableDataSource();
              this.popUpManager.showErrorAlert(this.translate.instant('ptd.error_no_found_preasignaciones'));
            }
          },
          error: err => {
            console.log(err);
            this.dataSource = new MatTableDataSource();
            this.popUpManager.showErrorToast(this.translate.instant('ptd.error_no_found_preasignaciones'));
          }
        });
      }).catch(err => {
        console.log(err);
        this.dataSource = new MatTableDataSource();
        this.popUpManager.showErrorToast(this.translate.instant('GLOBAL.error_no_found_tercero_id'));
      });
    }
  }

  cargarPeriodo(): Promise<Periodo[]> {
    return new Promise((resolve, reject) => {
      this.parametrosService.get('periodo?query=CodigoAbreviacion:PA,Activo:true&sortby=Id&order=desc&limit=0').subscribe({
        next: (resp: RespFormat) => {
          if (checkResponse(resp) && checkContent(resp.Data)) {
            resolve(resp.Data as Periodo[]);
          } else {
            reject(new Error('No se encontraron periodos'));
          }
        },
        error: (err) => {
          reject(err);
        }
      });
    });
  }

  selectPeriodo(periodo: any) {
    this.periodo = periodo.value;
    console.log(this.periodo)
    if (this.periodo) {
      this.loadPreasignaciones();
    } else {
      this.dataSource = new MatTableDataSource();
    }
  }

}
