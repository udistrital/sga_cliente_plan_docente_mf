import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { PopUpManager } from 'src/app/managers/popUpManager';
import { MODALS, ROLES, VIEWS } from 'src/app/models/diccionario';
import { Periodo } from 'src/app/models/parametros/periodo';
import { EstadoConsolidado } from 'src/app/models/plan-trabajo-docente/estado-consolidado';
import { RespFormat } from 'src/app/models/response-format';
import { ParametrosService } from 'src/app/services/parametros.service';
import { PlanTrabajoDocenteService } from 'src/app/services/plan-trabajo-docente.service';
import { ProyectoAcademicoService } from 'src/app/services/proyecto-academico.service';
import { UserService } from 'src/app/services/user.service';
import { checkContent, checkResponse } from 'src/app/utils/verify-response';
import { cloneDeep as _cloneDeep } from 'lodash';

@Component({
  selector: 'app-revision-consolidado',
  templateUrl: './revision-consolidado.component.html',
  styleUrls: ['./revision-consolidado.component.scss']
})
export class RevisionConsolidadoComponent implements OnInit, AfterViewInit {

  readonly VIEWS = VIEWS;
  /* readonly MODALS = MODALS;
  readonly ACTIONS = ACTIONS; */
  vista: Symbol;

  isSecDecanatura: string|undefined = undefined;
  isDecano: string|undefined = undefined;

  dataSource: MatTableDataSource<any>;
  displayedColumns: string[] = ["proyecto_curricular", "codigo", "fecha_radicado", "periodo_academico", "gestion", "estado", "enviar"];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  periodos: {select: any, opciones: Periodo[]};
  proyectos: {select: any, opciones: any[]};
  estadosConsolidado: {select: any, opciones: any[]};

  formRevConsolidado: FormGroup;
  
  constructor(
    private userService: UserService,
    private translate: TranslateService,
    private popUpManager: PopUpManager,
    private parametrosService: ParametrosService,
    private proyectoAcademicoService: ProyectoAcademicoService,
    private planTrabajoDocenteService: PlanTrabajoDocenteService,
    private builder: FormBuilder,
  ) {
    this.vista = VIEWS.LIST;
    this.dataSource = new MatTableDataSource();
    this.periodos = {select: undefined, opciones: []};
    this.proyectos = {select: undefined, opciones: []};
    this.estadosConsolidado = {select: undefined, opciones: []};
    this.formRevConsolidado = this.builder.group({});
  }

  ngOnInit() {
    this.userService.getUserRoles().then(roles => {
      this.isSecDecanatura = roles.find(role => (role == ROLES.SEC_DECANATURA));
        this.isDecano = roles.find(role => (role == ROLES.DECANO));
    });
    this.loadSelects();
    this.buildForm();
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

  buildForm() {
    this.formRevConsolidado = this.builder.group({

    });
  }

  accionGestion(event: any) {
    const readonly = event.rowData.gestion.type === 'ver';
    this.revisarConsolidado(event.rowData.ConsolidadoJson, readonly);
  }

  accionEnviar(event: any) {
    let putPlan = _cloneDeep(event.rowData.ConsolidadoJson);
    const estado = this.estadosConsolidado.opciones.find(estado => estado.codigo_abreviacion === "ENV_AVA");
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
      promesas.push(this.cargarEstadosConsolidado().then(estadosConsolidado => {
        this.estadosConsolidado.opciones = estadosConsolidado;
        let estadosCodAbrev: string[] = [];
        if (this.isSecDecanatura) {
          estadosCodAbrev = ["AVA","N_APR"];
        }
        if (this.isDecano) {
          estadosCodAbrev = ["APR"];
        }
        const ops = this.estadosConsolidado.opciones.filter(estado => estadosCodAbrev.includes(estado.codigo_abreviacion));
        /* this.formRevConsolidado.campos[this.getIndexFormRevConsolidado('EnviarAprovacionDec')].opciones = ops; */
      }));
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
        const idEstadosFiltro = this.idEstadosSegunRol();
        let rawlistarConsolidados = <any[]>resp.Data;
        rawlistarConsolidados = rawlistarConsolidados.filter(consolidado => idEstadosFiltro.includes(consolidado.estado_consolidado_id));
        const formatedData = this.estilizarDatosSegunRol(rawlistarConsolidados);
        this.dataSource = new MatTableDataSource(formatedData);
      }, (err) => {
        this.dataSource = new MatTableDataSource();
        console.warn(err);
      });
    }
  }

  idEstadosSegunRol(): string[] {
    let estadosCodAbrev: string[] = [];
    if (this.isSecDecanatura) {
      estadosCodAbrev = ["ENV","AVA","ENV_AVA","N_APR"];
    }
    if (this.isDecano) {
      estadosCodAbrev = ["ENV_AVA","APR"];
    }
    return this.estadosConsolidado.opciones
      .filter(estado => estadosCodAbrev.includes(estado.codigo_abreviacion))
      .map(estado => estado._id);
  }

  estilizarDatosSegunRol(consolidados: any[]): any[] {
    let formatedData: any[] = [];
    consolidados.forEach(consolidado => {
      const proyecto = this.proyectos.opciones.find(proyecto => proyecto.Id == consolidado.proyecto_academico_id);
      const periodo = this.periodos.opciones.find(periodo => periodo.Id == consolidado.periodo_id);
      const estadoConsolidado = this.estadosConsolidado.opciones.find(estado => estado._id == consolidado.estado_consolidado_id);
      let opcionGestion = "ver";
      if ((estadoConsolidado && estadoConsolidado.codigo_abreviacion == "ENV") && (this.isSecDecanatura)) {
        opcionGestion = "editar";
      }
      if ((estadoConsolidado && estadoConsolidado.codigo_abreviacion == "ENV_AVA") && (this.isDecano)) {
        opcionGestion = "editar";
      }
      formatedData.push({
        "proyecto_curricular": proyecto ? proyecto.Nombre : "",
        "codigo": proyecto ? proyecto.Codigo : "",
        "fecha_radicado": this.formatoFecha(consolidado.fecha_creacion),
        "periodo_academico": periodo ? periodo.Nombre : "",
        "gestion": { value: undefined, type: opcionGestion, disabled: (!this.isSecDecanatura && !this.isDecano) },
        "estado": estadoConsolidado ? estadoConsolidado.nombre : consolidado.estado_consolidado_id,
        "enviar": { value: undefined, type: 'enviar', disabled: (!this.isSecDecanatura) || (estadoConsolidado.codigo_abreviacion != "AVA") },
        "ConsolidadoJson": consolidado
      })
    })
    return formatedData;
  }

  formatoFecha(fechaHora: string): string {
    return new Date(fechaHora).toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  }

  revisarConsolidado(consolidado: any, readonly?: boolean) {
    /* this.formRevConsolidado.btn = this.translate.instant('GLOBAL.guardar');
    this.revConsolidadoInfo = consolidado;
    this.vista = VIEWS.FORM;
    this.formRevConsolidado.campos[this.getIndexFormRevConsolidado('Rol')].valor = this.isSecDecanatura || this.isDecano;
    this.formRevConsolidado.campos[this.getIndexFormRevConsolidado('CumpleNorma')].valor = consolidado.cumple_normativa;
    this.formRevConsolidado.campos[this.getIndexFormRevConsolidado('CumpleNorma')].deshabilitar = !this.isSecDecanatura;

    const estadoApr = this.estadosConsolidado.opciones.find(estado => estado._id == consolidado.estado_consolidado_id);
    if (estadoApr.codigo_abreviacion === "AVA" || estadoApr.codigo_abreviacion === "N_APR" || estadoApr.codigo_abreviacion === "APR") {
      this.formRevConsolidado.campos[this.getIndexFormRevConsolidado('EnviarAprovacionDec')].valor = estadoApr;
    }

    if (this.isSecDecanatura) {
      const consolidado_coordinacion = JSON.parse(consolidado.consolidado_coordinacion);
      this.loading = true;
      this.sgaMidService.post(`reportes/verif_cump_ptd/${consolidado.periodo_id}/${consolidado.proyecto_academico_id}`,{}).subscribe((resp1) =>  {
        const rawFilePDF = new Uint8Array(atob(resp1.Data.pdf).split('').map(char => char.charCodeAt(0)));
        const urlFilePDF = window.URL.createObjectURL(new Blob([rawFilePDF], { type: 'application/pdf' }));
        this.GestorDocumental.get([{Id: consolidado_coordinacion.documento_id, ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}]).subscribe(
          (resp: any[])  => {
            this.loading = false;
            this.formRevConsolidado.campos[this.getIndexFormRevConsolidado("ArchivoSoporteCoordinacion")].urlTemp = urlFilePDF+"|"+resp[0].url;
            this.formRevConsolidado.campos[this.getIndexFormRevConsolidado("ArchivoSoporteCoordinacion")].valor = urlFilePDF+"|"+resp[0].url;
          }
        );
      }, (err) => {
        this.loading = false;
        this.popUpManager.showPopUpGeneric(this.translate.instant('ERROR.titulo_generico'), this.translate.instant('ERROR.persiste_error_comunique_OAS'), MODALS.ERROR, false)
        console.warn(err)
      });
    }
    
    let terceroId = 0;
    const respuesta_decanatura = JSON.parse(consolidado.respuesta_decanatura);
    if (Object.keys(respuesta_decanatura.sec).length > 0) {
      if (respuesta_decanatura.sec.documento_id && respuesta_decanatura.sec.documento_id > 0) {
        this.loading = true;
        this.sgaMidService.post(`reportes/verif_cump_ptd/${consolidado.periodo_id}/${consolidado.proyecto_academico_id}`,{}).subscribe((resp1) =>  {
          const rawFilePDF = new Uint8Array(atob(resp1.Data.pdf).split('').map(char => char.charCodeAt(0)));
          const urlFilePDF = window.URL.createObjectURL(new Blob([rawFilePDF], { type: 'application/pdf' }));
          this.GestorDocumental.get([{Id: respuesta_decanatura.sec.documento_id, ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}]).subscribe(
            (resp: any[])  => {
              this.loading = false;
              if (this.isDecano) {
                this.formRevConsolidado.campos[this.getIndexFormRevConsolidado("ArchivoSoporteCoordinacion")].urlTemp = urlFilePDF+"|"+resp[0].url;
                this.formRevConsolidado.campos[this.getIndexFormRevConsolidado("ArchivoSoporteCoordinacion")].valor = urlFilePDF+"|"+resp[0].url;
              } else {
                this.formRevConsolidado.campos[this.getIndexFormRevConsolidado("ArchivoSoporte")].urlTemp = urlFilePDF+"|"+resp[0].url;
                this.formRevConsolidado.campos[this.getIndexFormRevConsolidado("ArchivoSoporte")].valor = urlFilePDF+"|"+resp[0].url;
              }
            }
          );
        }, (err) => {
          this.loading = false;
          this.popUpManager.showPopUpGeneric(this.translate.instant('ERROR.titulo_generico'), this.translate.instant('ERROR.persiste_error_comunique_OAS'), MODALS.ERROR, false)
          console.warn(err)
        });
      }
      if (this.isSecDecanatura) {
        terceroId = respuesta_decanatura.sec.responsable_id;
        this.formRevConsolidado.campos[this.getIndexFormRevConsolidado('Observaciones')].valor = respuesta_decanatura.sec.observacion;
      }
    }
    if ((Object.keys(respuesta_decanatura.dec).length > 0) && this.isDecano) {
      terceroId = respuesta_decanatura.dec.responsable_id;
      this.formRevConsolidado.campos[this.getIndexFormRevConsolidado('Observaciones')].valor = respuesta_decanatura.dec.observacion;
    }
    if (terceroId == 0) {
      terceroId = this.userService.getPersonaId();
    }
    this.tercerosService.get('tercero/'+terceroId).subscribe(resTerc => {
      this.formRevConsolidado.campos[this.getIndexFormRevConsolidado("QuienResponde")].valor = resTerc.NombreCompleto;
    }, err => {
      console.warn(err);
      this.popUpManager.showPopUpGeneric(this.translate.instant('ERROR.titulo_generico'), this.translate.instant('ERROR.persiste_error_comunique_OAS'), MODALS.ERROR, false)
    });
    if (readonly ? readonly : false) {
      this.formRevConsolidado.btn = "";
    } else {
      this.formRevConsolidado.btn = this.translate.instant('GLOBAL.guardar');
    } */
  }

  async validarFormRevConsolidado() {
    /* if (event.valid) {
      let respuesta_decanatura = JSON.parse(this.revConsolidadoInfo.respuesta_decanatura);
      if (this.isSecDecanatura) {
        const verifyNewDoc = new Promise(resolve => {
          if (event.data.RevisionConsolidado.ArchivoSoporte.file != undefined) {
            this.GestorDocumental.uploadFiles([event.data.RevisionConsolidado.ArchivoSoporte]).subscribe(
              (resp: any[]) => {
                resolve(resp[0].res.Id)
              });
          } else {
            resolve(respuesta_decanatura.sec.documento_id)
          }
        });
        respuesta_decanatura.sec.documento_id = await verifyNewDoc;
        respuesta_decanatura.sec.responsable_id = this.userService.getPersonaId();
        respuesta_decanatura.sec.observacion = event.data.RevisionConsolidado.Observaciones;
        this.revConsolidadoInfo.cumple_normativa = event.data.RevisionConsolidado.CumpleNorma;
      }
      if (this.isDecano) {
        respuesta_decanatura.dec.responsable_id = this.userService.getPersonaId();
        respuesta_decanatura.dec.observacion = event.data.RevisionConsolidado.Observaciones;
      }
      this.revConsolidadoInfo.estado_consolidado_id = event.data.RevisionConsolidado.EnviarAprovacionDec._id;
      this.revConsolidadoInfo.respuesta_decanatura = JSON.stringify(respuesta_decanatura);
      this.loading = true;
          this.planTrabajoDocenteService.put('consolidado_docente/'+this.revConsolidadoInfo._id, this.revConsolidadoInfo).subscribe((resp) => {
            this.loading = false;
            this.popUpManager.showSuccessAlert(this.translate.instant('ptd.actualizar_consolidado_ok'));
          }, (err) => {
            this.loading = false;
            console.warn(err);
            this.popUpManager.showErrorAlert(this.translate.instant('ptd.fallo_actualizar_consolidado'));
          });
    } */
  }

  regresar() {
    this.vista = VIEWS.LIST;
    this.listarConsolidados();
  }

}
