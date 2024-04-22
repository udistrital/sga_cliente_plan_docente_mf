import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MODALS, ROLES, VIEWS } from 'src/app/models/diccionario';
import { UserService } from 'src/app/services/user.service';
import { intersection as _intersection, head as _head, cloneDeep as _cloneDeep } from 'lodash';
import { Periodo } from 'src/app/models/parametros/periodo';
import { TranslateService } from '@ngx-translate/core';
import { PopUpManager } from 'src/app/managers/popUpManager';
import { PlanTrabajoDocenteService } from 'src/app/services/plan-trabajo-docente.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { ProyectoAcademicoService } from 'src/app/services/proyecto-academico.service';
import { RespFormat } from 'src/app/models/response-format';
import { checkContent, checkResponse } from 'src/app/utils/verify-response';
import { EstadoConsolidado } from 'src/app/models/plan-trabajo-docente/estado-consolidado';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-consolidado',
  templateUrl: './consolidado.component.html',
  styleUrls: ['./consolidado.component.scss']
})
export class ConsolidadoComponent implements OnInit, AfterViewInit {

  readonly VIEWS = VIEWS;
  /* readonly MODALS = MODALS;
  readonly ACTIONS = ACTIONS; */
  vista: Symbol;

  rolesCoord: string[] = [ROLES.COORDINADOR, ROLES.ADMIN_DOCENCIA];
  isCoordinator: string|undefined = undefined;

  dataSource: MatTableDataSource<any>;
  displayedColumns: string[] = ["proyecto_curricular", "codigo", "fecha_radicado", "periodo_academico", "revision_decanatura", "gestion", "estado", "enviar"];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  periodos: {select: any, opciones: Periodo[]};
  proyectos: {select: any, opciones: any[]};
  estadosConsolidado: {select: any, opciones: any[]};

  formNewEditConsolidado: FormGroup;
  //dataNewEditConsolidado: any;
  newEditConsolidado: boolean;
  consolidadoSololectura: boolean;

  formRespuestaConsolidado: FormGroup;
  //dataRespuestaConsolidado: any;
  respuestaConsolidado: boolean;

  listaPlanesConsolidado: any = undefined;

  constructor (
    private userService: UserService,
    private translate: TranslateService,
    private popUpManager: PopUpManager,
    private planTrabajoDocenteService: PlanTrabajoDocenteService,
    private parametrosService: ParametrosService,
    private proyectoAcademicoService: ProyectoAcademicoService,
    private builder: FormBuilder,
    private sgaPlanTrabajoDocenteMidService: PlanTrabajoDocenteService,
  ) {
    this.vista = VIEWS.LIST;
    this.dataSource = new MatTableDataSource();
    this.periodos = {select: undefined, opciones: []};
    this.proyectos = {select: undefined, opciones: []};
    this.estadosConsolidado = {select: undefined, opciones: []};
    this.formNewEditConsolidado = this.builder.group({});
    this.consolidadoSololectura = false;
    this.formRespuestaConsolidado = this.builder.group({});
    this.newEditConsolidado = false;
    this.respuestaConsolidado = false;
  }

  ngOnInit() {
    this.userService.getUserRoles().then(roles => {
      this.isCoordinator = _head(_intersection(roles, this.rolesCoord));
    });
    this.loadSelects();
    this.buildForms();
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

  buildForms() {
    this.formNewEditConsolidado = this.builder.group({
      ArchivoSoporte: ['', Validators.required],
      QuienEnvia: ['', Validators.required],
      Rol: ['', Validators.required],
    });
    this.formRespuestaConsolidado = this.builder.group({
      Respuesta: ['', Validators.required],
      Observaciones: ['', Validators.required],
    });
  }

  accionRevision(event: any) {
    this.verRevDecano(event.rowData.ConsolidadoJson);
  }

  accionGestion(event: any) {
    this.consolidadoSololectura = event.rowData.gestion.type === 'ver';
    this.nuevoEditarConsolidado(event.rowData.ConsolidadoJson);
  }

  accionEnviar(event: any) {
    let putPlan = _cloneDeep(event.rowData.ConsolidadoJson);
    const estado = this.estadosConsolidado.opciones.find(estado => estado.codigo_abreviacion === "ENV");
    putPlan.estado_consolidado_id = estado._id;
    this.planTrabajoDocenteService.put('consolidado_docente/'+putPlan._id, putPlan).subscribe(
      resp => {
        this.popUpManager.showSuccessAlert(this.translate.instant('ptd.actualizar_consolidado_ok'))
        this.listarConsolidados();
      }, err => {
        console.warn(err);
        this.popUpManager.showErrorAlert(this.translate.instant('ptd.fallo_actualizar_consolidado'))
      }
    );
  }

  loadPeriodo(): Promise<Periodo[]> {
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

  loadProyectos(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.proyectoAcademicoService.get('proyecto_academico_institucion?query=Activo:true&sortby=Nombre&order=asc&limit=0').subscribe({
        next: (resp: any) => {
          if (checkContent(resp)) {
            resolve(resp as any[]);
          } else {
            reject(new Error('No se encontraron proyectos'));
          }
        },
        error: (err) => {
          reject(err);
        }
      });
    });
  }

  cargarEstadosConsolidado(): Promise<EstadoConsolidado[]> {
    return new Promise((resolve, reject) => {
      this.planTrabajoDocenteService.get('estado_consolidado?query=activo:true&limit=0').subscribe({
        next: (res) => {
          if (res.Data.length > 0) {
            resolve(res.Data)
          } else {
            reject(new Error('No se encontraron estados de plan'))
          }
        },
        error: (err) => {
          reject(err)
        }
      });
    });
  }

  async loadSelects() {
    try {
      let promesas = [];
      promesas.push(this.loadPeriodo().then(periodos => {this.periodos.opciones = periodos}));
      promesas.push(this.loadProyectos().then(proyectos => {this.proyectos.opciones = proyectos;}));
      promesas.push(this.cargarEstadosConsolidado().then(estadosConsolidado => {this.estadosConsolidado.opciones = estadosConsolidado;}));
    } catch (error) {
      console.warn(error);
      this.popUpManager.showPopUpGeneric(this.translate.instant('ERROR.titulo_generico'),
        this.translate.instant('ERROR.sin_informacion_en') + ': <b>' + error + '</b>.<br><br>' +
        this.translate.instant('ERROR.persiste_error_comunique_OAS'),
        MODALS.ERROR, false);
    }
  }

  listarConsolidados() {
    if (this.periodos.select) {
      let proyecto = ""
      if (this.proyectos.select) {
        proyecto = ",proyecto_academico_id:"+this.proyectos.select.Id;
      }
      this.planTrabajoDocenteService.get(`consolidado_docente?query=activo:true,periodo_id:${this.periodos.select.Id}${proyecto}&limit=0`).subscribe((resp) => {
        let rawlistarConsolidados = <any[]>resp.Data;
        const idEstadosFiltro = this.estadosConsolidado.opciones
          .filter(estado => ["DEF","ENV","APR","N_APR"].includes(estado.codigo_abreviacion))
          .map(estado => estado._id);
        rawlistarConsolidados = rawlistarConsolidados.filter(consolidado => idEstadosFiltro.includes(consolidado.estado_consolidado_id));
        let formatedData: any[] = [];
        rawlistarConsolidados.forEach(consolidado => {
          const estadoConsolidado = this.estadosConsolidado.opciones.find(estado => estado._id == consolidado.estado_consolidado_id);
          const proyecto = this.proyectos.opciones.find(proyecto => proyecto.Id == consolidado.proyecto_academico_id);
          const periodo = this.periodos.opciones.find(periodo => periodo.Id == consolidado.periodo_id);
          let opcionGestion = "ver"
          if ((estadoConsolidado && (estadoConsolidado.codigo_abreviacion == "DEF" || estadoConsolidado.codigo_abreviacion == "N_APR")) && (this.isCoordinator)) {
            opcionGestion = "editar"
          }
          formatedData.push({
            "proyecto_curricular": proyecto ? proyecto.Nombre : "",
            "codigo": proyecto ? proyecto.Codigo : "",
            "fecha_radicado": this.formatoFecha(consolidado.fecha_creacion),
            "periodo_academico": periodo ? periodo.Nombre : "",
            "revision_decanatura": {value: undefined, type: 'ver', disabled: false},
            "gestion": {value: undefined, type: opcionGestion, disabled: !this.isCoordinator},
            "estado": estadoConsolidado ? estadoConsolidado.nombre : consolidado.estado_consolidado_id,
            "enviar": {value: undefined, type: 'enviar', disabled: (!this.isCoordinator) || (estadoConsolidado.codigo_abreviacion != "DEF")},
            "ConsolidadoJson": consolidado
          })
        })
        this.dataSource = new MatTableDataSource(formatedData);

      }, (err) => {
        console.warn(err);
        this.dataSource = new MatTableDataSource();
      });
    }
  }

  formatoFecha(fechaHora: string): string {
    return new Date(fechaHora).toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  }

  nuevoEditarConsolidado(consolidado: any) {
    this.vista = VIEWS.FORM;
    /* this.newEditConsolidado = true;
    this.formNewEditConsolidado.campos[this.getIndexFormNewEditConsolidado("Rol")].valor = this.isCoordinator;
    this.listaPlanesConsolidado = "";
    let terceroId = 0;
    if (consolidado) {
      this.consolidadoInfo = consolidado;
      const consolidado_coordinacion = JSON.parse(this.consolidadoInfo.consolidado_coordinacion);
      terceroId = consolidado_coordinacion.responsable_id;
      this.GestorDocumental.get([{Id: consolidado_coordinacion.documento_id, ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}]).subscribe(
        (resp: any[])  => {
          this.formNewEditConsolidado.campos[this.getIndexFormNewEditConsolidado("ArchivoSoporte")].urlTemp = resp[0].url;
          this.formNewEditConsolidado.campos[this.getIndexFormNewEditConsolidado("ArchivoSoporte")].valor = resp[0].url;
        }
      );
    } else {
      this.consolidadoInfo = undefined;
      terceroId = this.userService.getPersonaId();
    }
    this.tercerosService.get('tercero/'+terceroId).subscribe(resTerc => {
      this.formNewEditConsolidado.campos[this.getIndexFormNewEditConsolidado("QuienEnvia")].valor = resTerc.NombreCompleto;
    }, err => {
      console.warn(err);
      this.popUpManager.showPopUpGeneric(this.translate.instant('ERROR.titulo_generico'), this.translate.instant('ERROR.persiste_error_comunique_OAS'), MODALS.ERROR, false)
    }); */
  }

  async validarFormNewEdit() {
    /* if (this.periodos.select && this.proyectos.select) {
      if (event.valid) {
        if (this.consolidadoInfo == undefined) {
          if (this.listaPlanesConsolidado == "") {
            this.popUpManager.showPopUpGeneric(this.translate.instant('ptd.diligenciar_consolidado'), this.translate.instant('ptd.please_descargue_consolidado'), MODALS.INFO, false)
          } else {
            this.loading = true;
            this.GestorDocumental.uploadFiles([event.data.Consolidado.ArchivoSoporte]).subscribe(
              (resp: any[]) => {
                const consolidado = {
                  "documento_id": resp[0].res.Id,
                  "responsable_id": this.userService.getPersonaId(),
                }
                const prepareData = {
                  "plan_docente_id": JSON.stringify(this.listaPlanesConsolidado),
                  "periodo_id": `${this.periodos.select.Id}`,
                  "proyecto_academico_id": `${this.proyectos.select.Id}`,
                  "estado_consolidado_id": `${this.estadosConsolidado.opciones.find(estado => estado.codigo_abreviacion == "DEF")._id}`,
                  "respuesta_decanatura": JSON.stringify({sec: {}, dec: {}}),
                  "consolidado_coordinacion": JSON.stringify(consolidado),
                  "cumple_normativa": false,
                  "aprobado": false,
                  "activo": true
                }
                
                this.planTrabajoDocenteService.post('consolidado_docente', prepareData).subscribe((resp) => {
                  this.loading = false;
                  this.popUpManager.showSuccessAlert(this.translate.instant('ptd.crear_consolidado_ok'));
                }, (err) => {
                  this.loading = false;
                  console.warn(err);
                  this.popUpManager.showErrorAlert(this.translate.instant('ptd.fallo_crear_consolidado'));
                });
              }
            )
          }
        } else {
          const verifyNewDoc = new Promise(resolve => {
            if (event.data.Consolidado.ArchivoSoporte.file != undefined) {
              this.GestorDocumental.uploadFiles([event.data.Consolidado.ArchivoSoporte]).subscribe(
                (resp: any[]) => {
                  resolve(resp[0].res.Id)
                });
            } else {
              resolve(JSON.parse(this.consolidadoInfo.consolidado_coordinacion).documento_id)
            }
          })
          const consolidado = {
            "documento_id": await verifyNewDoc,
            "responsable_id": this.userService.getPersonaId(),
          }
          if (this.listaPlanesConsolidado != "") {
            this.consolidadoInfo.plan_docente_id = JSON.stringify(this.listaPlanesConsolidado);
          }
          this.consolidadoInfo.periodo_id = `${this.periodos.select.Id}`;
          this.consolidadoInfo.proyecto_academico_id = `${this.proyectos.select.Id}`;
          this.consolidadoInfo.estado_consolidado_id = `${this.estadosConsolidado.opciones.find(estado => estado.codigo_abreviacion == "DEF")._id}`;
          this.consolidadoInfo.consolidado_coordinacion = JSON.stringify(consolidado);
          this.loading = true;
          this.planTrabajoDocenteService.put('consolidado_docente/'+this.consolidadoInfo._id, this.consolidadoInfo).subscribe((resp) => {
            this.loading = false;
            this.popUpManager.showSuccessAlert(this.translate.instant('ptd.actualizar_consolidado_ok'));
          }, (err) => {
            this.loading = false;
            console.warn(err);
            this.popUpManager.showErrorAlert(this.translate.instant('ptd.fallo_actualizar_consolidado'));
          });
        }
      }
    } else {
      this.popUpManager.showPopUpGeneric(this.translate.instant('ptd.diligenciar_consolidado'), this.translate.instant('ptd.select_periodo_proyecto'), MODALS.INFO, false)
    } */
  }
  obtenerDocConsolidado() {
    if (this.periodos.select) {
      this.sgaPlanTrabajoDocenteMidService.post(`reporte/verificacion-cumplimiento-ptd?vigencia=${this.periodos.select.Id}&proyecto=${this.proyectos.select ? this.proyectos.select.Id : 0}`,{}).subscribe((resp) =>  {
        this.listaPlanesConsolidado = resp.Data.listaIdPlanes;
        const rawFilePDF = new Uint8Array(atob(resp.Data.pdf).split('').map(char => char.charCodeAt(0)));
        const urlFilePDF = window.URL.createObjectURL(new Blob([rawFilePDF], { type: 'application/pdf' }));
        this.previewFile(urlFilePDF);
        const rawFileExcel = new Uint8Array(atob(resp.Data.excel).split('').map(char => char.charCodeAt(0)));
        const urlFileExcel = window.URL.createObjectURL(new Blob([rawFileExcel], { type: 'application/vnd.ms-excel' }));
        const download = document.createElement("a");
        download.href = urlFileExcel;
        download.download = "Consolidado.xlsx";
        document.body.appendChild(download);
        download.click();
        document.body.removeChild(download);
      }, (err) => {
        this.popUpManager.showPopUpGeneric(this.translate.instant('ERROR.titulo_generico'), this.translate.instant('ERROR.persiste_error_comunique_OAS'), MODALS.ERROR, false)
        console.warn(err)
      });
    }
  }
  previewFile(url: string) {
    const h = screen.height * 0.65;
    const w = h * 3/4;
    const left = (screen.width * 3/4) - (w / 2);
    const top = (screen.height / 2) - (h / 2);
    window.open(url, '', 'toolbar=no,' +
      'location=no, directories=no, status=no, menubar=no,' +
      'scrollbars=no, resizable=no, copyhistory=no, ' +
      'width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
      /* const dialogDoc = new MatDialogConfig();
      dialogDoc.width = '80vw';
      dialogDoc.height = '90vh';
      dialogDoc.data = {url};
      this.matDialog.open(DialogPreviewFileComponent, dialogDoc); */
  }

  verRevDecano(consolidado: any) {
    const respuesta_decanatura = JSON.parse(consolidado.respuesta_decanatura);
    const estado = this.estadosConsolidado.opciones.find(estado => estado._id == consolidado.estado_consolidado_id);
    let Observaciones = "";
    if (Object.keys(respuesta_decanatura.sec).length > 0) {
      Observaciones += "Secretaría Decanatura:\n" + respuesta_decanatura.sec.observacion + "\n\n";
    }
    if (Object.keys(respuesta_decanatura.dec).length > 0) {
      Observaciones += "Decanatura:\n" + respuesta_decanatura.dec.observacion + "\n";
    }
    this.formRespuestaConsolidado.patchValue({
      Respuesta: estado ? estado.nombre : "Sin Definir",
      Observaciones: Observaciones,
    })
    this.vista = VIEWS.FORM;
    this.respuestaConsolidado = true;
  }
  regresar() {
    this.vista = VIEWS.LIST;
    this.newEditConsolidado = false;
    this.respuestaConsolidado = false;
    this.listarConsolidados();
  }

}
